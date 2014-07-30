var express =       require("express");
var session =       require("express-session");
var logfmt =        require("logfmt");
var mongo =         require('mongodb').MongoClient;
var ObjectID =      require('mongodb').ObjectID;
var bodyParser =    require('body-parser');
var numeral =       require('numeral');
var passport =      require('passport');
var LocalStrategy = require('passport-local').Strategy;
var moment =        require('moment');

var app = express();

var dbString = process.env.MONGOHQ_URL || 'mongodb://localhost:27017/test';
var port = Number(process.env.PORT || 5000);

app.use(logfmt.requestLogger());

app.use(session({ secret: 'keyboard cat', resave: true, saveUninitialized: true}));
app.use(passport.initialize());
app.use(passport.session());

app.use(bodyParser.urlencoded({extended:false}));
app.use(bodyParser.json());
app.use(bodyParser.json({ type: 'application/vnd.api+json' }));

app.use(express.static(__dirname + '/public'));

app.engine('html',require('ejs').renderFile);

passport.use(new LocalStrategy(
  function(username, password, done) {
    console.log("Authenticating user: " + username);
    db.collection('users').findOne({ username:username }, function(err, user) {
      if(err) { return done(err); }
      if (!user) {
        return done(null, false, { message: 'Incorrect username.' });
      }
      if (!(user.password === password)) {
        // TODO hash passwords before this goes live
        return done(null, false, { message: 'Incorrect password.' });
      }
      return done(null, user);
    });
  }
));

passport.serializeUser(function(user, done) {
  console.log("Serializing: " + user.username);
  done(null,user._id);
});

passport.deserializeUser(function(id, done) {
  db.collection('users').find({id:id}, function(err,user) {
    done(err,user);
  });
});

function requireAuth(req, res, next) {
  if(!req.isAuthenticated()) {
    console.log("not authenticated!");
    res.redirect('/login');
  }
  else {
    next();
  }
}

app.listen(port, function() {
  console.log("Listening on " + port);
});

mongo.connect(dbString, function(err,dbase) {
  if(err) throw err;

  db = dbase;
  console.log("Connected to MongoDB");
});

// Root path
app.get('/', requireAuth, function(req, res) {
    // fetch customers and render them
    var customers = db.collection('customers').find().sort( {name:1} );
    customers.toArray(function(err, results) {
      var i;
      var customers = '';
      for(i=0;i<results.length;i++) {
        customer = results[i];
        customer.link = '/' + encodeURIComponent(customer.name) + '/buy';
        customer.tab = numeral(customer.tab).format('$0.00');
        app.render('trows/customer.html',{customer:customer},function(err,html) {
          customers = customers + html;
        });
    }

    // Add the 'create a new customer' entry
    var newCustomer = {name:"<b>Add New</b>",link:"/newcustomer",tab:0};
    app.render('trows/customer.html',{customer:newCustomer},function(err,html) {
      customers = html + customers;
    });

    res.render('table.html', {
      locals: {
        'tabletitle': 'Customers',
        'tabledata': customers,
        'title':'Barmaster 9001',
        'active':'/'
        }
    });
  });
});

// login page form
app.get('/login', function(req,res) {
  res.render('login.html', {
    locals: {
      'title':'Log In',
      'active':'/login'
    }
  });
});

// login page POST endpoint
app.post('/login',
    passport.authenticate('local', {successRedirect: '/',
                                    failureRedirect: '/login'}));

// allows use of the :customer route param
app.param('customer',function(req,res,next,id) {
  var customer = db.collection('customers').findOne({name:id},function(err,customer) {
    req.customer = customer;
    next();
  });
});

// allows use of the :drink route param
app.param('drink',function(req,res,next,id) {
  var drink = db.collection('drinks').findOne({name:id},function(err,drink) {
    req.drink = drink;
    next();
  });
});

app.get('/:customer/buy', requireAuth, function(req,res) {
  var drinks = db.collection('drinks').find();
  drinks.toArray(function(err, results) {
    var i;
    var drinks = '';
    for(i=0;i<results.length;i++) {
      drink = results[i];
      drink.price = numeral(drink.price).format('$0.00');
      drink.link = '/' + encodeURIComponent(req.customer.name) + '/buy/' + encodeURIComponent(drink.name);
      app.render('trows/drink.html',{drink:drink},function(err,html) {
        drinks = drinks + html;
      });
    }

    // Add the 'create custom drink' entry
    var newDrink = {name:"<b>Create One-Off Drink</b>",link:"/" + encodeURIComponent(req.customer.name) + "/one-off-drink",price:0};
    app.render('trows/drink.html',{drink:newDrink},function(err,html) {
      drinks = html + drinks;
    });


    res.render('table.html', {
      locals: {
        'tabletitle': 'Choose a Drink',
        'tabledata': drinks,
        'title':'Barmaster 9001',
        'active':'/customer/buy'
      }
    });
  });
});

app.get('/:customer/buy/:drink', requireAuth, function(req,res) {
  var customer = req.customer;
  var drink = req.drink;
  var timestamp = new Date();

  db.collection('transactions').insert({type: "purchase", drink: drink.name, customer: customer._id, timestamp: timestamp, amount: -drink.price},
    {safe:true},
    function(err, transactions) {
      var transaction = transactions[0];
      console.log("Transaction #" + transaction._id + ": " + customer.name + " bought a " + drink.name + " for $" + drink.price);
    }
  );

  db.collection('customers').update(
    {_id:customer._id},
    {
      $inc: { tab: -drink.price }, // subtracts the price from the customer's tab
    },
    {safe:true},
    function(err,object) {
      customer.firstName = customer.name.split(" ")[0];
      drink.price = numeral(drink.price).format('$0.00');

      res.render('sale.html', {
        locals: {
          'title': 'Purchase',
          'customer': customer,
          'drink': drink,
          'active':'/customer/buy/drink'
        }
      });
    }
  );
});

// Form to add a new customer
app.get('/newcustomer', requireAuth, function(req,res) {
  res.render('newcustomer.html', {
    locals: {
      'title':'New Customer',
      'active':'/newcustomer'
    }
  });
});

// Form to add a new drink
app.get('/newdrink', requireAuth, function(req,res) {
  res.render('newdrink.html', {
    locals: {
      'title':'New Drink',
      'success':req.query.success,
      'active':'/newdrink'
    }
  });
});

app.get('/:customer/one-off-drink', requireAuth, function(req,res) {
  res.render('customdrink.html', {
    locals: {
      'title':'Custom Drink',
      'customer': req.customer,
      'success':req.query.success,
      'active':'/one-off-drink'
    }
  });
});

app.get('/customers', requireAuth, function(req,res) {
  // fetch customers and render them
  var customers = db.collection('customers').find().sort( {name:1} );
  customers.toArray(function(err, results) {
    var i;
    var customers = '';
    for(i=0;i<results.length;i++) {
      customer = results[i];
      customer.link = '/customers/' + encodeURIComponent(customer.name);
      customer.tab = numeral(customer.tab).format('$0.00');
      app.render('trows/customer.html',{customer:customer},function(err,html) {
        customers = customers + html;
      });
    }

    res.render('table.html', {
      locals: {
        'tabletitle': 'Manage Customers',
        'tabledata': customers,
        'title':'Barmaster 9001',
        'active':'/customers'
        }
    });
  });
});

app.get('/customers/:customer', requireAuth, function(req,res) {
  req.customer.tab = numeral(req.customer.tab).format('$0.00');
  console.log(new ObjectID(req.customer._id));

  var transactions = db.collection('transactions').find( {customer: new ObjectID(req.customer._id)} ).sort( {timestamp: -1} );

  transactions.toArray(function(err, results) {
    var i;
    var render = '';
    for(i=0;i<results.length;i++) {
      transaction = results[i];

      transaction.amount = numeral(transaction.amount).format('$0.00');
      transaction.timestamp = moment(transaction.timestamp).format("ddd MMM Mo, H:mm");

      app.render('trows/transaction.html',{transaction:transaction},function(err,html) {
        render = render + html;
      });
    }

    res.render('customerinfo.html', {
      locals: {
        'customer': req.customer,
        'transactions': render,
        'title':'Customer Info',
        'active':'/customers'
        }
    });
  });
});

// Add a customer (JSON)
app.post('/addcustomer', requireAuth, function(req,res) {
  if(req.body && req.body.name && req.body.tab) {
    db.collection('customers').insert({name:req.body.name,tab:+req.body.tab,transactions:[]},function(err,docs) {
      res.send('{"status":"ok","message":"Customer Added"}');
    });
  }
  else {
    res.send('{"status":"nok","message":"Customer Data Missing"}');
  }
});

// Add a drink (JSON)
app.post('/adddrink', requireAuth, function(req,res) {
  if(req.body && req.body.name && req.body.teaser && req.body.recipe && req.body.price) {
    db.collection('drinks').insert({name:req.body.name,teaser:req.body.teaser,recipe:req.body.recipe,price:+req.body.price},function(err,docs) {
      res.send('{"status":"ok","message":"Drink Added"}');
    });
  }
  else {
    res.send('{"status":"nok","message":"Drink Data Missing"}');
  }
});

app.post('/modify-tab', requireAuth, function(req,res) {
  if(req.body && req.body.name && req.body.amount) {
    var amount = +req.body.amount;
    var name = req.body.name;
    var type = req.body.type;
    var drink = req.body.drink;
    var timestamp = new Date();
    console.log("Adding " + amount + " to tab of " + name + " because " + type);

    db.collection('customers').findOne({name: name},
      function(err, customer) {
        db.collection('customers').update(
          {name: name},
          {
            $inc: { tab: amount }, // adds the amount (which may be negative) to the customer's tab
          },
          {safe:true},
          function(err,customers) {
          }
        );

        db.collection('transactions').insert(
          {type: type, drink: drink, customer: customer._id, timestamp: timestamp, amount: amount},
          {safe: true},
          function(err, transactions) {
            var transaction = transactions[0];
            console.log(transaction);
            console.log("Transaction #" + transaction._id + ": " + customer.name + "\'s tab was modified by $" + amount + " because of a " + type);
          }
        );

        res.send('{"status":"ok","message":"Tab Modified"}');
      }
    );


  }
  else {
    res.send('{"status":"nok","message":"Data Missing"}');
  }
});
