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

/* Set API headers */
router.all('/', function(req, res, next) {
  set_headers(res);
  next();
});

/* GET root send OK. */
router.get('/', function(req, res, next) {
  var reponse = {"OK": true};
  reponse = JSON.stringify(reponse);
  res.end(reponse);
});



module.exports = router;
