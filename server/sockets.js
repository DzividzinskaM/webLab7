"use stict";

const MessageModel = require('./models/messages_model');
const cookieParser = require('cookie-parser');
const passport = require('passport');
const config = require('./config');

function auth (socket, next) {

    // Parse cookie
    cookieParser()(socket.request, socket.request.res, () => {});

    // JWT authenticate
    passport.authenticate('jwt', {session: false}, function (error, decryptToken, jwtError) {
        if(!error && !jwtError && decryptToken) {
            next(false, {username: decryptToken.username, id: decryptToken.id});
        } else {
            next('guest');
        }
    })(socket.request, socket.request.res);

}
module.exports = io => {
    io.on('connection', function(socket){
        
        auth(socket, (guest, user) => {
            if(!guest) {
                socket.join('all');
                socket.username = user.username;
                socket.emit('connected', `you are connected to chat as ${user.username}`);
            }
        });

        socket.on('msg', content =>{
            
            const obj = {
                date: new Date(),
                content: content,
                username: socket.username
            };
            
            MessageModel.create(obj, err => {
                if(err) return console.error("MessageModel", err);
                socket.emit("message", obj);
                socket.to('all').emit("message", obj);
            });

        });

     
        socket.on('receiveHistory', ()=>{
            MessageModel.count({}, function( err, count){
                //console.log( "Number of users:", count );
                MessageModel
                .find({})
                .skip(count-3)
                .sort({date: 1})
    
                .lean()
                .exec((err, messages) => {
                    if(!err){
                        socket.emit("history", messages);
                    }
                })
            })
           
        });

        socket.on('MoreHistory', ()=>{
            MessageModel.count({}, function( err, count){
                MessageModel
                .find({})
                .limit(count-3)
                //.sort({date: -1})
                .lean()
                .exec((err, messages) => {
                    if(!err){
                        socket.emit("Ahistory", messages);
                    }
                })
            });
            
        });
    });
};