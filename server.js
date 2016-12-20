'use strict';

var os = require('os');
var nodeStatic = require('node-static');
var http = require('http');

var file = new nodeStatic.Server('./public');
var app = http.createServer(function(req, res) {
  file.serve(req, res);
}).listen(process.env.PORT || 8080);
