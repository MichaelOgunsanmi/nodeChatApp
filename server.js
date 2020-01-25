const path = require('path');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const {generateMessage, generateLocationMessage} = require('./utils/messages');
const {addUser, removeUser, getUsersInRoom, getUser} = require('./utils/users');
const config = require('config');
const Filter = require('bad-words');

const pathToPubicDirectory = path.resolve(__dirname, 'public');
const PORT = process.env.PORT || config.get('PORT');

const app = express();
// const server = http.createServer(app);

app.use(express.static(pathToPubicDirectory));
const nm_dependencies = ['mustache', 'moment', 'qs']; // keep adding required node_modules to this array.
nm_dependencies.forEach(dep => {
    app.use(`/${dep}`, express.static(path.resolve(`node_modules/${dep}`)));
});

const server = app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`);
});

const io = socketio(server);


io.on('connection', (socket) => {
    console.log('New Websocket connection');

    socket.on('join', ({username, room}, callback) => {
        const {error, user} = addUser({id: socket.id, username, room});

        if (error) return callback(error);


        socket.join(user.room);
        socket.emit('message', generateMessage('Admin', 'Welcome'));
        socket.broadcast.to(user.room).emit('message', generateMessage('Admin', `${user.username} just joined`));

        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        });

        callback()
    });

    socket.on('sendMessage', (message, callback) =>{
        const user = getUser(socket.id);

        const filter = new Filter();

        if (filter.isProfane(message))
            return callback('Profanity not allowed');

        io.to(user.room).emit('message', generateMessage(user.username, message));
        callback();
    });

    socket.on('sendLocation', (coordinates, callback) => {
        const user = getUser(socket.id);

        io.to(user.room).emit('locationMessage', generateLocationMessage(user.username, `http://google.com/maps?q=${coordinates.latitude},${coordinates.longitude}`));
        callback();
    });

    socket.on('disconnect', () => {
        const user = removeUser(socket.id);
        if (user) {
            io.to(user.room).emit('message', generateMessage('Admin', `${user.username} has left the chat`))
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUsersInRoom(user.room)
            });
        }
        })
});

app.get('/', (req, res, next) => {
    res.send('Chat App')
});

