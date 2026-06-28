const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const authRoutes = require('./routes/auth');

const app = express();
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Map of rooms and their participants
const rooms = {};

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on('join-room', (roomId, username) => {
    socket.join(roomId);
    
    if (!rooms[roomId]) {
      rooms[roomId] = {};
    }
    rooms[roomId][socket.id] = { username, id: socket.id };

    // Let everyone else in the room know someone joined
    socket.to(roomId).emit('user-connected', { userId: socket.id, username });

    // Send the list of current users in the room to the newly joined user
    const otherUsers = Object.values(rooms[roomId]).filter(u => u.id !== socket.id);
    socket.emit('room-users', otherUsers);

    console.log(`${username} (${socket.id}) joined room ${roomId}`);

    // WebRTC Signaling
    socket.on('offer', (payload) => {
      io.to(payload.target).emit('offer', {
        caller: socket.id,
        sdp: payload.sdp,
        username
      });
    });

    socket.on('answer', (payload) => {
      io.to(payload.target).emit('answer', {
        caller: socket.id,
        sdp: payload.sdp
      });
    });

    socket.on('ice-candidate', (payload) => {
      io.to(payload.target).emit('ice-candidate', {
        caller: socket.id,
        candidate: payload.candidate
      });
    });

    // Chat
    socket.on('chat-message', (messageObj) => {
      io.to(roomId).emit('chat-message', {
        sender: username,
        senderId: socket.id,
        ...messageObj,
        timestamp: new Date().toISOString()
      });
    });

    // Whiteboard
    socket.on('draw', (drawData) => {
      socket.to(roomId).emit('draw', drawData);
    });
    
    socket.on('clear-board', () => {
      socket.to(roomId).emit('clear-board');
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.id}`);
      if (rooms[roomId] && rooms[roomId][socket.id]) {
        delete rooms[roomId][socket.id];
        socket.to(roomId).emit('user-disconnected', socket.id);
        
        // Clean up empty rooms
        if (Object.keys(rooms[roomId]).length === 0) {
          delete rooms[roomId];
        }
      }
    });
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
