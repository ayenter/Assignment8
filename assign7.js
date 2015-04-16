#!/usr/bin/env node

"use strict";

var http = require("http"), querystring = require("querystring"), express = require("express"), path = require("path");
var redis = require("redis");
var bodyParser = require('body-parser');
var app = express();

var router = express.Router();
app.use(express.static('public'));
app.set('view engine', 'jade');
app.set('views', path.join(__dirname, '/views'));
app.use(bodyParser.json()); 
app.use(bodyParser.urlencoded({ extended: true }));

global.db = redis.createClient();
global.INIT_KEY = 10 * Math.pow(36, 3);


app.on("error", function (err) {
    console.log("error - " + err);
});

function isLong(str) {
    "use strict"
    return (str.substring(0, 11) !== "http://loca");
}

function isMissinghttp(str) {
    "use strict"
    return (str.substring(0, 7) !== "http://");
}

app.get('/', function(req, res) {
    var popular = db.zrevrange('hits', 0, 9);
    "use strict";
    db.zrevrange(["clicks", 0, 9], function (err, topten) {
        console.log(topten);
        res.render('index', {top: JSON.stringify(topten), output: ""});
    });
});

app.post('/', function(req, res) {
    "use strict";
    var url, test, output_url;
    var input = req.body.input;
    console.log("INPUT: " + input);
    if (isMissinghttp(input)){
        console.log("ADDED HTTP");
        input = "http://" + input;
    }
    if (!isLong(input)){
        input = input.substring(22);
    }

    db.get('short:'+input, function(err, reply) {
        if(reply!=null && err==null){
            db.zrevrange(["clicks", 0, 9], function (err, topten) {
                console.log(topten);
                res.render('index', {top: JSON.stringify(topten), output: reply});
            });
        } else {
            db.setnx('next', INIT_KEY);

            var incr = Math.floor(Math.random()*10)+1;
            db.incr('next', function(err, value){
                if (value!=null && err==null){
                    var key = (value).toString(36);
                    db.get('long:'+ input, function(err, exists){
                        console.log("exists:" + exists);
                        if (exists==null){
                            db.setnx('long:'+ input, "http://localhost:3000/"+key);
                            db.setnx('short:' + key, input);
                            db.zrevrange(["clicks", 0, 9], function (err, topten) {
                                console.log(topten);
                                res.render('index', {top: JSON.stringify(topten), output: "http://localhost:3000/"+key});
                            });
                        } else {
                            db.zrevrange(["clicks", 0, 9], function (err, topten) {
                                console.log(topten);
                                res.render('index', {top: JSON.stringify(topten), output: exists});
                            });
                        }
                    });
                }
            });
        }
    });
});


app.all('/:key', function(req, res) {
    db.get("short:"+req.params.key, function(err, reply) {
        "use strict";

        if(reply!=null && err==null){
            db.zincrby(["clicks", 1, req.params.key], function(){});
            console.log("REPLY:" + reply);
            res.redirect(reply);

        } else {
            res.render("index", {output: "NOT FOUND"});
        }
    });
    
});


var server = app.listen(3000);
var address = server.address();
console.log("nudge is listening at http://localhost:" + address.port + "/");
