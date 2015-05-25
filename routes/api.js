var config = require('../config');
var express = require('express');
var async = require('async');
var cassandra = require('cassandra-driver');
var router = require("./pre_api");


// Routes defined here

/* GET root send OK. */
router.get('/', function(req, res, next) {
  console.log('Connected to cluster with %d host(s): %j', req.db.hosts.length, req.db.hosts.keys());
  console.log('Keyspaces: %j', Object.keys(req.db.metadata.keyspaces));
  var count = 0;
  var query = 'SELECT * FROM \"examples\".\"basic\"';
  res.write("[");
  req.db.eachRow(query, [], {autoPage: true},
    // On recv row
    function(n, row) {
      ++count;
      row = JSON.stringify(row);
      res.write(row + ", ");
    },
    // End Callbask
    function (err) {
      console.log("Recived %d", count);
      res.end("]");
    }
  );
});

/* GET add send OK. */
router.get('/add', function(req, res, next) {
  console.log('Connected to cluster with %d host(s): %j', req.db.hosts.length, req.db.hosts.keys());
  console.log('Keyspaces: %j', Object.keys(req.db.metadata.keyspaces));
  var id = cassandra.types.Uuid.random();
  async.series([
    function createKeyspace(next) {
      var query = "CREATE KEYSPACE IF NOT EXISTS \"examples\" WITH replication = {'class': 'SimpleStrategy', 'replication_factor': '3' }";
      req.db.execute(query, next);
    },
    function createTable(next) {
      var query = "CREATE TABLE IF NOT EXISTS \"examples\".\"basic\" (id uuid, txt text, val int, PRIMARY KEY(id))";
      req.db.execute(query, next);
    },
    function insert(next) {
      var query = 'INSERT INTO \"examples\".\"basic\" (id, txt, val) VALUES (?, ?, ?)';
      req.db.execute(query, [id, 'Hello!', 100], { prepare: true}, next);
    },
    function select(next) {
      var query = 'SELECT id, txt, val FROM \"examples\".\"basic\" WHERE id = ?';
      req.db.execute(query, [id], { prepare: true}, function (err, result) {
        if (err) return next(err);
        var row = result.first();
        row = JSON.stringify(row);
        res.end(row);
        next();
      });
    }
  ], function (err) {
    if (err) {
      console.error('There was an error', err.message, err.stack);
    }
    req.db.shutdown();
  });
});



module.exports = router;
