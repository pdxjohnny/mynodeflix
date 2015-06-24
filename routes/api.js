var config = require('../config');
var express = require('express');
var async = require('async');
var cassandra = require('cassandra-driver');
var router = require("./pre_api");
var fs = require("fs");
var url = require("url");
var path = require("path");
var mime = require('mime');


// Routes defined here

/* GET root send OK. */
router.get('/', function(req, res, next) {
  res.end("[]");
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

/* GET send movie from requested directory, all_access or private. */
router.get('/movie/:username/:title', function(req, res, next) {
  if (req.username === req.params.username ||
    config.all_access === req.params.username)
  {
    var format = ".mp4";
    var title = req.params.title;
    var movie = title + format;
    var file = path.resolve(__dirname, movie);
    var range = req.headers.range;
    var positions = range.replace(/bytes=/, "").split("-");
    var start = parseInt(positions[0], 10);

    fs.stat(file, function(err, stats) {
      if (err) {
        res.status(404).send('Not found');
      }
      else {
        var total = stats.size;
        var end = positions[1] ? parseInt(positions[1], 10) : total - 1;
        var chunksize = (end - start) + 1;

        res.writeHead(206, {
          "Content-Range": "bytes " + start + "-" + end + "/" + total,
          "Accept-Ranges": "bytes",
          "Content-Length": chunksize,
          "Content-Type": mime.lookup(format)
        });

        var stream = fs.createReadStream(file, { start: start, end: end })
        .on("open", function() {
          stream.pipe(res);
        }).on("error", function(err) {
          res.end(err);
        });
      }
    });
  }
});

/* POST upload a movie to private directory or all_access. */
router.post('/movie/:username/:title', function(req, res, next) {
  if (req.username === req.params.username ||
    config.all_access === req.params.username)
  {
    var format = ".mp4";
    var title = req.params.title;
    var movie = title + format;
    var file = path.resolve(__dirname, movie);
    var range = req.headers.range;
    var positions = range.replace(/bytes=/, "").split("-");
    var start = parseInt(positions[0], 10);

    fs.stat(file, function(err, stats) {
      if (err) {
        res.status(404).send('Not found');
      }
      else {
        var total = stats.size;
        var end = positions[1] ? parseInt(positions[1], 10) : total - 1;
        var chunksize = (end - start) + 1;

        res.writeHead(206, {
          "Content-Range": "bytes " + start + "-" + end + "/" + total,
          "Accept-Ranges": "bytes",
          "Content-Length": chunksize,
          "Content-Type": mime.lookup(format)
        });

        var stream = fs.createReadStream(file, { start: start, end: end })
        .on("open", function() {
          stream.pipe(res);
        }).on("error", function(err) {
          res.end(err);
        });
      }
    });
  }
});

module.exports = router;
