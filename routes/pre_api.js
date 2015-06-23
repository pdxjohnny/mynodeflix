var config = require('../config');
var express = require('express');
var async = require('async');
var cassandra = require('cassandra-driver');
var router = express.Router();

// Seting headers and database done here

/* Set API headers */
router.use(function(req, res, next) {
  for (var header in config.api.headers)
  {
    res.setHeader(header, config.api.headers[header]);
  }
  next();
});


// Auth defined here
if ( typeof config.api.auth !== "undefined" &&
  config.api.auth === "basic" )
{
  router.use(function(req, res, next) {
    var auth;
    // check whether an authorization header was send
    if (req.headers.authorization)
    {
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
    if (!auth)
    {
      // any of the tests failed
      // send an Basic Auth request (HTTP Code: 401 Unauthorized)
      res.statusCode = 401;
      // MyRealmName can be changed to anything, will be prompted to the user
      res.setHeader('WWW-Authenticate', 'Basic realm="MyRealmName"');
      // this will displayed in the browser when authorization is cancelled
      res.end('Unauthorized');
    }
    else
    {
      // continue with processing, user was authenticated
      next();
    }
  });
}


// For database
if ( typeof config.database !== "undefined" &&
  config.database.type === "cassandra" )
{
  router.use(function(req, res, next) {
    var db = new cassandra.Client({ contactPoints: [config.database.host]});
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
}

module.exports = router;
