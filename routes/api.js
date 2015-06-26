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

/* GET list of content in user directory */
router.get('/movie/:username', function(req, res, next) {
  find_dir(req, res, next, function (req, res, next, dir_path) {
    send_dir(res, dir_path);
  });
});

/* GET list of content in collection */
router.get('/movie/:username/:collection', function(req, res, next) {
  find_dir(req, res, next, function (req, res, next, dir_path) {
    dir_path = path.join(dir_path, req.params.collection);
    send_dir(res, dir_path);
  });
});

/* GET send movie from requested directory, all_access or personal. */
router.get('/movie/:username/:collection/:title', function(req, res, next) {
  find_dir(req, res, next, function (req, res, next, dir_path) {
    dir_path = path.join(dir_path, req.params.collection);
    send_media(req, res, req.params.title, dir_path);
  });
});

/* POST upload a movie to personal directory or all_access. */
router.post('/movie/:username/:collection', function(req, res, next) {
  find_dir(req, res, next, function (req, res, next, dir_path) {
    dir_path = path.join(dir_path, req.params.collection);
    save_media(req, res, dir_path);
  });
});

function find_dir(req, res, next, callback) {
  if (config.page.single_access === req.params.username ||
    config.page.all_access === req.params.username)
  {
    var dir_path = config.page.all_access;
    // List the username and passwords directory
    if (config.page.single_access === req.params.username)
    {
      dir_path = req.encoded_auth;
    }
    return callback(req, res, next, dir_path);
  }
}

function send_dir(res, directory) {
  var readdir = path.resolve(config.media_dir, directory);
  fs.readdir(readdir, function (err, files) {
    if (err)
    {
      res.end("[]");
    }
    else
    {
      files = JSON.stringify(files);
      res.end(files);
    }
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
