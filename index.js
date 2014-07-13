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

app.get('/', function(req, res) {
  var body = 'test text';
  res.render('index.html', {
    locals: {
      'body': body,
      'title':'Index Page',
      stylesheets: ['//maxcdn.bootstrapcdn.com/bootstrap/3.2.0/css/bootstrap.min.css','/public/stylesheets/style.css'],
      jslibs: ['//maxcdn.bootstrapcdn.com/bootstrap/3.2.0/js/bootstrap.min.js','/public/javascript/jquery.min.js']
      }
  });
});

app.get('/listcustomers', function(req,res) {
  var record = db.collection('customers').find();
  record.toArray(function(err, results) {
    //console.dir(results);
    res.send(results);
  });
});

app.post('/addcustomer', function(req,res) {
  if(req.body && req.body.name && req.body.tab) {
    db.collection('customers').insert({name:req.body.name,tab:req.body.tab,drinks:[]},function(err,docs) {
      console.log(req.body);
      res.send('{"status":"ok","message":"Customer Added"}');
    });
  }
  else {
    res.send('{"status":"nok","message":"Customer Data Missing"}');
  }
});
