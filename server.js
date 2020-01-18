var express = require('express');
var app = express();

//setting middleware
app.use(express.static(__dirname + '/')); //Serves resources from public folder

var port = 8080;
app.listen(port, function() {
    console.log("started on port: ", port);
});