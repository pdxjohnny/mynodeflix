var config = require('../config');
var express = require('express');
var async = require('async');
var cassandra = require('cassandra-driver');
var router = require("./pre_api");
var fs = require("fs");
var url = require("url");
var path = require("path");
var mime = require('mime');
var formidable = require('formidable');
var util = require('util');
var mkdirp = require('mkdirp');

// Routes defined here

/* GET root send OK. */
router.get('/', function(req, res, next) {
  res.end("[]");
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
router.post('/movie/:username', function(req, res, next) {
  if (req.username === req.params.username ||
    config.all_access === req.params.username)
  {
    var form = new formidable.IncomingForm(),
        files = [],
        fields = [];

    form.uploadDir = config.media_dir + req.params.username;

    form
      .on('file', function(field, file) {
        files.push(file);
      })
      .on('end', function() {
        var tmp_name = files[0]["path"];
        var real_name = tmp_name.substring(0, tmp_name.lastIndexOf('/'))
          + "/" + files[0]["name"];
        fs.rename(tmp_name, real_name);
        var response = {"OK": true}
        response = JSON.stringify(response);
        res.end(response);
      });
    mkdirp(form.uploadDir, function(err) {
      form.parse(req);
    });
  }
});

module.exports = router;
