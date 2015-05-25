var config = require("../config");
var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', config.page);
});

module.exports = router;
