const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { OpenAI } = require('openai');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// ضع مفتاح الـ API الخاص بك هنا إذا كان لديك واحد لتفعيل الـ AI
const openai = new OpenAI({ apiKey: 'YOUR_OPENAI_API_KEY' });

app.use(express.static('public'));

let activeRooms = {};

io.on('connection', (socket) => {
    
    // الهوست يصنع الغرفة هنا
    socket.on('hostCreateRoom', () => {
        const roomId = Math.floor(1000 + Math.random() * 9000).toString();
        activeRooms[roomId] = {
            host: socket.id,
            player: null,
            round: 1,
            hostTurn: true,
            p1Item: 'أسد', p2Item: 'نمر'
        };
        socket.join(roomId);
        socket.emit('roomCreated', roomId);
    });

    // اللاعب ينضم للهوست
    socket.on('playerJoinRoom', (roomId) => {
        const room = activeRooms[roomId];
        if (room && !room.player) {
            room.player = socket.id;
            socket.join(roomId);
            setupRound(roomId);
        } else {
            socket.emit('receiveMsg', { text: "الغرفة غير موجودة أو ممتلئة!" });
        }
    });

    async function setupRound(roomId) {
        const room = activeRooms[roomId];
        io.to(roomId).emit('startRoundData', {
            round: room.round,
            category: "حيوانات",
            p1Image: "https://images.unsplash.com/photo-1546182990-dffeafbe841d", 
            p2Image: "https://images.unsplash.com/photo-1546182990-dffeafbe841d", 
            hostTurn: room.hostTurn
        });
    }

    socket.on('gameAction', (data) => {
        const room = activeRooms[data.room];
        if(!room) return;

        if (data.action === 'chat') {
            socket.to(data.room).emit('receiveMsg', { text: data.text });
            room.hostTurn = !room.hostTurn;
            io.to(data.room).emit('turnSwitched', { hostTurn: room.hostTurn });
        }
    });
});

server.listen(3000, () => {
    console.log('السيرفر يعمل بنجاح على المنفذ 3000 🚀');
});