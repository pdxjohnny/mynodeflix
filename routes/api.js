var express = require('express');
var router = express.Router();

var default_headers = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
};

function set_headers (res) {
  for (var header in default_headers)
  {
    res.setHeader(header, default_headers[header]);
  }
}

/* GET users listing. */
router.all('/', function(req, res, next) {
  set_headers(res);
  next();
});

/* GET users listing. */
router.get('/', function(req, res, next) {
  var reponse = {"OK": true};
  reponse = JSON.stringify(reponse);
  res.end(reponse);
});



module.exports = router;
