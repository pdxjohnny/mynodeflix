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

/* GET list of content in directory */
router.get('/movie/:username', function(req, res, next) {
  send_dir(res, req.params.username);
});

/* GET send movie from requested directory, all_access or private. */
router.get('/movie/:username/:title', function(req, res, next) {
  if (req.username === req.params.username ||
    config.all_access === req.params.username)
  {
    var send_dir = req.params.username;
    // Save to the username and passwords directory
    if (req.username === req.params.username)
    {
      send_dir = req.encoded_auth;
    }
    send_media(req, res, req.params.title, send_dir);
  }
});

/* POST upload a movie to private directory or all_access. */
router.post('/movie/:username', function(req, res, next) {
  if (req.username === req.params.username ||
    config.all_access === req.params.username)
  {
    var save_dir = req.params.username;
    // Save to the username and passwords directory
    if (req.username === req.params.username)
    {
      save_dir = req.encoded_auth;
    }
    save_media(req, res, save_dir);
  }
});

function send_dir(res, directory) {
  var readdir = path.resolve(config.media_dir, directory);
  fs.readdir(readdir, function (err, files) {
    files = JSON.stringify(files);
    res.end(files);
  });
}

function send_media(req, res, movie, directory) {
  // Find the path to the file
  var file = path.resolve(config.media_dir, directory);
  file = path.resolve(file, movie);
  // Determine what part of the file was requested
  var range = req.headers.range;
  var positions = range.replace(/bytes=/, "").split("-");
  var start = parseInt(positions[0], 10);

  // Look for the file
  fs.stat(file, function(err, stats) {
    // The file was not found
    if (err)
    {
      res.status(404).send('Not found');
    }
    // The file was found send the correct part of it
    else
    {
      // Determine what part of the file to send
      var total = stats.size;
      var end = positions[1] ? parseInt(positions[1], 10) : total - 1;
      var chunksize = (end - start) + 1;

      // Send the headers for this part of the file to the client
      res.writeHead(206, {
        "Content-Range": "bytes " + start + "-" + end + "/" + total,
        "Accept-Ranges": "bytes",
        "Content-Length": chunksize,
        "Content-Type": mime.lookup(movie)
      });

      // Send the correct part of the file to the client
      var stream = fs.createReadStream(file, { start: start, end: end })
      .on("open", function() {
        stream.pipe(res);
      }).on("error", function(err) {
        res.end(err);
      });
    }
  });
}

function save_media(req, res, save_dir) {
  // Uploader object
  var form = new formidable.IncomingForm();
  // Array of files to precess
  var files = [];

  // The directory the files will be uploaded to
  form.uploadDir = path.resolve(config.media_dir, save_dir);

  form
    .on('file', function(field, file) {
      // Add the file information to the array
      files.push(file);
    })
    .on('end', function() {
      // Rename all of the uploaded files to their proper name
      for (var i in files) {
        var file = files[i];
        var tmp_name = file["path"];
        var real_name = tmp_name.substring(0, tmp_name.lastIndexOf('/'))
          + "/" + file["name"];
          // If there was an error just delete the tmp file
        fs.rename(tmp_name, real_name, function (err) {
          fs.unlink(tmp_name, function (err) {});
        });
      }
      // Say that it all went swimingly
      var response = {"OK": true}
      response = JSON.stringify(response);
      res.end(response);
    });
  // Create the directory path if it doesn't exist
  mkdirp(form.uploadDir, function(err) {
    // Process the upload
    form.parse(req);
});
}

module.exports = router;
