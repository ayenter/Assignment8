#!/usr/bin/env node

"use strict";

var http = require("http"), querystring = require("querystring"), express = require("express"), path = require("path");

var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/test');

var bodyParser = require('body-parser');
var app = express();

var router = express.Router();
app.use(express.static('public'));
app.set('view engine', 'jade');
app.set('views', path.join(__dirname, '/views'));
app.use(bodyParser.json()); 
app.use(bodyParser.urlencoded({ extended: true }));


// Connect to the db
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function (callback) {
});


global.INIT_KEY = 10 * Math.pow(36, 3);

var linkSchema = mongoose.Schema({
    "long" : String,
    "short" : String,
    "hits" : Number
});
var Link = mongoose.model("link", linkSchema);


app.on("error", function (err) {
    console.log("error - " + err);
});

function ValidURL(str) {
    "use strict"
    return (str.substring(0, 11) !== "http://loca");
}

app.get('/', function(req, res) {
    //var popular = Link.find({}).sort('hits').limit(10);
    "use strict";
    res.render('index', {pop: "", output: ""});
});

app.post('/', function(req, res) {
    "use strict";
    var url, test, output_url;
    var input = req.body.input;
    INIT_KEY += 1;
    var key = (INIT_KEY).toString(36);
    var newlink = new Link({ long: input, short: key, hits: 0});
    newlink.save();
    res.render('index', {top: "", output: "http://localhost:3000/" + key});
});


app.all('/:key', function(req, res) {
    Link.find({"short" : req.params.key}, function(err, reply) {
    //db.get("short:"+req.params.key, function(err, reply) {
        "use strict";
        console.log(reply);
        if(reply!=null && err==null){
            res.redirect(reply[0].long);

        } else {
            res.render("index", {output: "NOT FOUND"});
        }
    });
    
});


var server = app.listen(3000);
var address = server.address();
console.log("nudge is listening at http://localhost:" + address.port + "/");
