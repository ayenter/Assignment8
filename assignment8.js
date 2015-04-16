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

function fixAddress(addr) {
    "use strict"
    if (addr.length != 4) {
        if (addr.length >= 7 && addr.substring(0, 7) !== "http://") {
            addr = "http://" + addr;
        }
        if (addr.length >= 22 && addr.substring(0, 22) === "http://localhost:3000/") {
            addr = addr.substring(22);
        } else if (addr.length >= 11 && addr.substring(0, 11) !== "http://www.") {
            addr = "http://www." + addr.substring(7);
        }
    } else if (addr.length < 4) {
        addr = null;
    }
    return addr;
}

app.get('/', function(req, res) {
    //var popular = Link.find({}).sort('hits').limit(10);
    "use strict";
    Link.find({}).select("short long").sort({hits: -1}).limit(10).exec(function(err,topten) {
        res.render('index2', {top: JSON.stringify(topten), output: ""});
    });
});

app.post('/', function(req, res) {
    "use strict";
    var input = req.body.input;
    input = fixAddress(input);
    var output;
    if (input != null){
        Link.find({long: input}, function(err, longlist) {
            Link.find({short: input}, function(err, shortlist) {
                Link.find({}).sort({hits: -1}).limit(10).exec(function(err,topten) {
                    if (longlist.length!=0) {
                        output = "http://localhost:3000/" + longlist[0].short;
                    } else if (shortlist.length!=0) {
                        output = shortlist[0].long;
                    } else {
                        INIT_KEY += 1;
                        var key = (INIT_KEY).toString(36);
                        var newlink = new Link({ long: input, short: key, hits: 0});
                        newlink.save();
                        output = "http://localhost:3000/" + key;
                    }
                    res.render('index2', {top: JSON.stringify(topten), output: output});
                });
            });
        });
    }
});

//http://mongoosejs.com/docs/2.7.x/docs/updating-documents.html
app.all('/:key', function(req, res) {
    "use strict";
    Link.findOne({"short" : req.params.key}, function(err, reply) {
        if(reply!=null && reply.length!=0 && err==null){
            reply.hits = reply.hits + 1;
            reply.save();
            res.redirect(reply.long);
        } else {
            res.render("index2", {top: JSON.stringify(["NOT FOUND"]), output: ""});
        }
    });
    
});


var server = app.listen(3000);
var address = server.address();
console.log("nudge is listening at http://localhost:" + address.port + "/");
