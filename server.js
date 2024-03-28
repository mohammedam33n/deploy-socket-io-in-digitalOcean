import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';

const app = express();

const server = createServer(app);
const io = new Server(server, {
    cors: {
        methods: ['GET', 'PATCH', 'POST', 'PUT'],
        origin: true,
        credentials: true,
        transports: ['websocket', 'polling'],
    },
});

const sendTime = () => {
    const currentTime = new Date().toJSON();
    io.emit('time', { time: currentTime });
    console.log('EMIT: time', currentTime);
};

setInterval(sendTime, 10000);

io.on('connection', (socket) => {
    console.log('connection');

    socket.on('clientMessage', (data) => {
        console.log('ON: clientMessage');
        socket.emit(serverResponse, { message: 'Received message! Returning message!!' });
        console.log('EMIT: fromServer');
    });

    socket.on('sendChatToServer', (message) => {
        console.log(message);
        socket.broadcast.emit('sendChatToClient', message);
    });

    socket.on('disconnect', () => {
        console.log('Disconnect');
    });
});

const PORT = 3000;
server.listen(PORT, () => {
    console.log('Server is running');
});
