var config = require('../config');
var express = require('express');
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


// Routes defined here

/* GET root send OK. */
router.get('/', function(req, res, next) {
  var reponse = {
    "OK": true,
    "username": req.username,
    "password": req.password,
  };
  reponse = JSON.stringify(reponse);
  res.end(reponse);
});



module.exports = router;
