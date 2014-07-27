var express =       require("express");
var logfmt =        require("logfmt");
var mongo =         require('mongodb').MongoClient;
var bodyParser =    require('body-parser');
var numeral =       require('numeral');
var passport =      require('passport');
var LocalStrategy = require('passport-local').Strategy;

var app = express();

var dbString = process.env.MONGOHQ_URL || 'mongodb://localhost:27017/test';
var port = Number(process.env.PORT || 5000);

app.use(logfmt.requestLogger());

app.use(passport.initialize());
//app.use(express.session({ secret: 'keyboard cat'}));
app.use(passport.session());

app.use(bodyParser.urlencoded({extended:false}));
app.use(bodyParser.json());
app.use(bodyParser.json({ type: 'application/vnd.api+json' }));

app.use(express.static(__dirname + '/public'));

app.engine('html',require('ejs').renderFile);

passport.use(new LocalStrategy(
  function(username, password, done) {
    console.log("Querying for user: " + username);
    db.collection('users').findOne({ username:username }, function(err, user) {
      if(err) { return done(err); }
      if (!user) {
        return done(null, false, { message: 'Incorrect username.' });
      }
      if (!(user.password === password)) {
        return done(null, false, { message: 'Incorrect password.' });
      }
      return done(null, user);
    });
  }
));

passport.serializeUser(function(user, done) {
  done(null,user.username);
});

passport.deserializeUser(function(user, done) {
  db.collection('users').find( { username: user }, function(err,user) {
    done(err,user);
  });
});

app.listen(port, function() {
  console.log("Listening on " + port);
});

mongo.connect(dbString, function(err,dbase) {
  if(err) throw err;

  db = dbase;
  console.log("Connected to MongoDB");
});

// Root path
app.get('/', function(req, res) {
  // fetch customers and render them
  var customers = db.collection('customers').find();
  customers.toArray(function(err, results) {
    var i;
    var customers = '';
    for(i=0;i<results.length;i++) {
      customer = results[i];
      customer.link = '/' + encodeURIComponent(customer.name) + '/buy';
      customer.tab = numeral(customer.tab).format('$0.00');
      app.render('customer.html',{customer:customer},function(err,html) {
        customers = customers + html;
      });
    }

    // Add the 'create a new customer' entry
    var newCustomer = {name:"<b>Add New</b>",link:"/newcustomer",tab:0};
    app.render('customer.html',{customer:newCustomer},function(err,html) {
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
                                    failureRedirect: '/login'}),
    function(req,res) {
      console.log(req.user);
});

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

app.get('/:customer/buy', function(req,res) {
  console.log(req.customer);

  var drinks = db.collection('drinks').find();
  drinks.toArray(function(err, results) {
    var i;
    var drinks = '';
    for(i=0;i<results.length;i++) {
      drink = results[i];
      drink.price = numeral(drink.price).format('$0.00');
      drink.link = '/' + encodeURIComponent(req.customer.name) + '/buy/' + encodeURIComponent(drink.name);
      app.render('drink.html',{drink:drink},function(err,html) {
        drinks = drinks + html;
      });
    }

    // Add the 'create custom drink' entry
    var newDrink = {name:"<b>Create Custom Drink</b>",link:"/newdrink",price:0};
    app.render('drink.html',{drink:newDrink},function(err,html) {
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

app.get('/:customer/buy/:drink', function(req,res) {
  console.log(req.customer);
  console.log(req.drink);

  var customer = req.customer;
  var drink = req.drink;
  var purchase = [new Date(),drink.name];

  db.collection('customers').update(
    {name:customer.name},
    {
      $inc: { tab: -drink.price }, // subtracts the price from the customer's tab
      $push: { drinks: purchase } // and logs this purchase
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
app.get('/newcustomer', function(req,res) {
  res.render('newcustomer.html', {
    locals: {
      'title':'New Customer',
      'active':'/newcustomer'
    }
  });
});

// Form to add a new drink
app.get('/newdrink', function(req,res) {
  res.render('newdrink.html', {
    locals: {
      'title':'New Drink',
      'success':req.query.success,
      'active':'/newdrink'
    }
  });
});

// Add a customer (JSON)
app.post('/addcustomer', function(req,res) {
  console.log(req.body)
  if(req.body && req.body.name && req.body.tab) {
    db.collection('customers').insert({name:req.body.name,tab:+req.body.tab,drinks:[]},function(err,docs) {
      res.send('{"status":"ok","message":"Customer Added"}');
    });
  }
  else {
    res.send('{"status":"nok","message":"Customer Data Missing"}');
  }
});

// Add a drink (JSON)
app.post('/adddrink', function(req,res) {
  console.log(req.body)
  if(req.body && req.body.name && req.body.teaser && req.body.recipe && req.body.price) {
    db.collection('drinks').insert({name:req.body.name,teaser:req.body.teaser,recipe:req.body.recipe,price:+req.body.price},function(err,docs) {
      res.send('{"status":"ok","message":"Drink Added"}');
    });
  }
  else {
    res.send('{"status":"nok","message":"Drink Data Missing"}');
  }
});
