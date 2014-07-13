var express =       require("express");
var logfmt =        require("logfmt");
var mongo =         require('mongodb').MongoClient;
var bodyParser =    require('body-parser');

var app = express();

var dbString = process.env.MONGOHQ_URL || 'mongodb://localhost:27017/test';
var port = Number(process.env.PORT || 5000);

app.use(logfmt.requestLogger());

app.use(bodyParser.urlencoded({extended:false}));
app.use(bodyParser.json());
app.use(bodyParser.json({ type: 'application/vnd.api+json' }));

app.use(express.static(__dirname + '/public'));

app.engine('html',require('ejs').renderFile);

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
  var customers = db.collection('customers').find();
  customers.toArray(function(err, results) {
    var i;
    var customers = '';
    for(i=0;i<results.length;i++) {
      customer = results[i];
      customer.link = '/' + encodeURIComponent(customer.name) + '/buy';
      app.render('customer.html',{customer:customer},function(err,html) {
        customers = customers + html;
      });
    }

    var newCustomer = {name:"<b>Add New</b>",link:"/newcustomer",tab:0};
    app.render('customer.html',{customer:newCustomer},function(err,html) {
      customers = html + customers;
    });

    res.render('index.html', {
      locals: {
        'tabledata': customers,
        'title':'Barmaster 9001'
        }
    });
  });
});

// List all customers (JSON)
app.get('/listcustomers', function(req,res) {
  var record = db.collection('customers').find();
  record.toArray(function(err, results) {
    //console.dir(results);
    res.send(results);
  });
});

// Form to add a new customer
app.get('/newcustomer', function(req,res) {
  res.render('newcustomer.html', {
    locals: {
      'title':'New Customer'
    }
  });
});

// Add a customer (JSON)
app.post('/addcustomer', function(req,res) {
  console.log(req.body)
  if(req.body && req.body.name && req.body.tab) {
    db.collection('customers').insert({name:req.body.name,tab:req.body.tab,drinks:[]},function(err,docs) {
      res.send('{"status":"ok","message":"Customer Added"}');
    });
  }
  else {
    res.send('{"status":"nok","message":"Customer Data Missing"}');
  }
});
