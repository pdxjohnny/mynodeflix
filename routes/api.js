var config = require('../config');
var express = require('express');
var cassandra = require('cassandra-driver');
var router = express.Router();

// Headers defined here
var default_headers = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
};
/* Set API headers */
router.use(function(req, res, next) {
  for (var header in default_headers)
  {
    res.setHeader(header, default_headers[header]);
  }
  next();
});


// Auth defined here
if ( typeof config.auth !== "undefined" &&
  config.auth === "basic" )
{
  router.use(function(req, res, next) {
    var auth;
    // check whether an autorization header was send    
    if (req.headers.authorization) {
      // only accepting basic auth, so:
      // * cut the starting "Basic " from the header
      // * decode the base64 encoded username:password
      // * split the string at the colon
      // -> should result in an array
      auth = new Buffer(req.headers.authorization.substring(6), 'base64').toString().split(':');
    }

    // checks if:
    // * auth array exists 
    // * first value matches the expected user 
    // * second value the expected password
    // Add them to req for acess by subsequent functions
    req.username = auth[0]
    req.password = auth[1]
    if (!auth) {
      // any of the tests failed
      // send an Basic Auth request (HTTP Code: 401 Unauthorized)
      res.statusCode = 401;
      // MyRealmName can be changed to anything, will be prompted to the user
      res.setHeader('WWW-Authenticate', 'Basic realm="MyRealmName"');
      // this will displayed in the browser when authorization is cancelled
      res.end('Unauthorized');
    } else {
      // continue with processing, user was authenticated
      next();
    }
  });
}

// For database
router.use(function(req, res, next) {
  var db = new cassandra.Client({ contactPoints: [config.host]});
  req.db = db;
  db.connect(function (err) {
    if (err)
    {
      db.shutdown();
      return console.error('There was an error when connecting', err);
    }
    else
    {
      next();
      db.shutdown();
    }
  });
});

// Routes defined here

/* GET root send OK. */
router.get('/', function(req, res, next) {
  console.log('Connected to cluster with %d host(s): %j', req.db.hosts.length, req.db.hosts.keys());
  console.log('Keyspaces: %j', Object.keys(req.db.metadata.keyspaces));
  var count = 0;
  var query = 'SELECT * FROM \"examples\".\"basic\"';
  req.db.eachRow(query, [], {autoPage: true},
    // On recv row
    function(n, row) {
      ++count;
      row = JSON.stringify(row);
      res.write(row);
    },
    // End Callbask
    function (err) {
      console.log("Recived %d", count);
      reponse = JSON.stringify(reponse);
      res.end(reponse);
    }
  );
});

/* GET add send OK. */
router.get('/add', function(req, res, next) {
  console.log('Connected to cluster with %d host(s): %j', req.db.hosts.length, req.db.hosts.keys());
  console.log('Keyspaces: %j', Object.keys(req.db.metadata.keyspaces));
  var count = 0;
  var query = 'SELECT * FROM \"examples\".\"basic\"';
  req.db.eachRow(query, [], {autoPage: true},
    // On recv row
    function(n, row) {
      ++count;
      row = JSON.stringify(row);
      res.write(row);
    },
    // End Callbask
    function (err) {
      console.log("Recived %d", count);
      reponse = JSON.stringify(reponse);
      res.end(reponse);
    }
  );
});



module.exports = router;
