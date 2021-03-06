'use strict';

var compression = require('compression');
var bodyParser = require('body-parser');
var express = require('express');
var db = require('./db').connect();
var fs = require('fs');
var morgan = require('morgan');

var app = express();
var STATIC_DIR = __dirname + '/../static';

app.use(morgan('combined'));
app.use(compression());
app.use(bodyParser());

// TODO: If behind proxy like nginx, enable trust proxy:
// http://expressjs.com/guide/behind-proxies.html
// app.enable('trust proxy')

var index = fs.readFileSync(STATIC_DIR + '/index.html');
app.get('/', function (req, res) {
  res.end(index);
});

app.use('/static', express.static(STATIC_DIR));

var server = app.listen(8000, function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log('SeaNetMap app listening at http://%s:%s', host, port);
});

// Endpoint for saving test results
app.post('/test_results', function (req, res) {
  db.saveTestResult(req.body, req.ip, function (err, data) {

    if (err) {
      return res.status(500).send(err);
    }

    return res.status(200).end();
  });
});

// Endpoint for getting **all of the test results**
app.get('/test_results', function (req, res) {
  db.getTestResults(function (err, rows) {

    if (err) {
      return res.status(500).send(err);
    }

    var response = rows.map(function (row) {
      return {
        results: JSON.parse(row.results),
        ip_address: row.ip_address,
        created_at: row.created_at
      }
    });

    return res.send(response);
  });
});
