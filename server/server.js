"use strict"

const express = require('express');
const app= express();
const nunjucks = require('nunjucks');
const server = require('http').Server(app);
const io = require('socket.io')(server, {serveClient: true});
const mongoose = require('mongoose');
const BodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const PORT = process.env.PORT || 3000;

const passport = require('passport');
const { Strategy } = require('passport-jwt');

const { jwt } = require('./config');

passport.use(new Strategy(jwt, function(jwt_payload, done) {
    if(jwt_payload != void(0)) return done(false, jwt_payload);
    done();
}));
 

mongoose.connect('mongodb://localhost:27017/chat', {});
mongoose.Promise = require('bluebird');
mongoose.set('debug', true);

nunjucks.configure('./client/views', {
    autoescape: true,
    express: app
});

// parse application/x-www-form-urlencoded
app.use(BodyParser.urlencoded({ extended: false }));
 
// parse application/json
app.use(BodyParser.json())

app.use(cookieParser());

require('./router')(app);
require('./sockets')(io);

server.listen(PORT, '0.0.0.0', ()=>{
    console.log("server started on port 3000");
});