require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const authRoutes = require('./routes/auth');
const meetingRoutes = require('./routes/meetings');
const Room = require('./models/Room');
const connectDB = require('./config/db');
const { sendMeetingInvite, sendContactEmail } = require('./mailer');

const app = express();

// Connect to MongoDB
connectDB();

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/meetings', meetingRoutes);

// API to send room invite via email
app.post('/api/rooms/invite', async (req, res) => {
  const { email, roomId, roomLink, inviterName } = req.body;
  if (!email || !roomId) {
    return res.status(400).json({ error: 'Email and Room ID are required' });
  }

  try {
    await sendMeetingInvite({
      toEmail: email,
      roomId,
      roomLink: roomLink || `http://localhost:5173/room/${roomId}`,
      inviterName
    });
    res.json({ success: true, message: `Invite email sent to ${email}` });
  } catch (err) {
    console.error('Email invite error:', err.message);
    res.status(500).json({ error: err.message || 'Failed to send invite email' });
  }
});

// API to handle contact form submission
app.post('/api/contact', async (req, res) => {
  const { name, email, subject, category, message } = req.body;
  
  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Name, Email, and Message are required' });
  }

  try {
    await sendContactEmail({ name, email, subject, category, message });
    res.json({ success: true, message: 'Message sent successfully' });
  } catch (err) {
    console.error('Contact email error:', err.message);
    res.status(500).json({ error: 'Failed to send message. Please try again later.' });
  }
});

// API to create a new room
app.post('/api/rooms', async (req, res) => {
  const { roomId, hostId } = req.body;
  if (!roomId) return res.status(400).json({ error: 'Room ID is required' });
  try {
    let room = await Room.findOne({ id: roomId });
    if (!room) {
      room = await Room.create({ id: roomId, hostId });
    }
    res.json({ success: true, roomId });
  } catch (err) {
    console.error('Error creating room:', err);
    res.status(500).json({ error: 'Failed to create room' });
  }
});

// API to verify if a room exists
app.get('/api/rooms/:roomId', async (req, res) => {
  const { roomId } = req.params;
  try {
    const room = await Room.findOne({ id: roomId });
    if (room || (rooms[roomId] && Object.keys(rooms[roomId]).length > 0)) {
      res.json({ exists: true, hostId: room?.hostId });
    } else {
      res.json({ exists: false });
    }
  } catch (err) {
    res.json({ exists: false });
  }
});

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
    
    // Store user info on the socket for other events
    socket.roomId = roomId;
    socket.username = username;
    
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
  });

  // WebRTC Signaling
  socket.on('offer', (payload) => {
    io.to(payload.target).emit('offer', {
      caller: socket.id,
      sdp: payload.sdp,
      username: socket.username
    });
  });

  socket.on('answer', (payload) => {
    io.to(payload.target).emit('answer', {
      caller: socket.id,
      sdp: payload.sdp
    });
  });

  socket.on('toggle-chat', (payload) => {
    io.to(payload.roomId).emit('chat-toggled', payload.enabled);
  });

  socket.on('ice-candidate', (payload) => {
    io.to(payload.target).emit('ice-candidate', {
      caller: socket.id,
      candidate: payload.candidate
    });
  });

  // Chat
  socket.on('chat-message', (messageObj) => {
    const targetRoomId = messageObj.roomId || socket.roomId;
    if (!targetRoomId) return;
    
    io.to(targetRoomId).emit('chat-message', {
      sender: socket.username,
      senderId: socket.id,
      ...messageObj,
      timestamp: new Date().toISOString()
    });
  });

  // Whiteboard & Tab Sync
  socket.on('switch-tab', ({ roomId, tab }) => {
    const targetRoomId = roomId || socket.roomId;
    if (targetRoomId) {
      socket.to(targetRoomId).emit('switch-tab', tab);
    }
  });

  socket.on('whiteboard-update', (data) => {
    const targetRoomId = data.roomId || socket.roomId;
    if (targetRoomId) {
      socket.to(targetRoomId).emit('whiteboard-update', data);
    }
  });

  socket.on('whiteboard-page', (data) => {
    const targetRoomId = data.roomId || socket.roomId;
    if (targetRoomId) {
      socket.to(targetRoomId).emit('whiteboard-page', data);
    }
  });

  socket.on('laser-pointer', (data) => {
    const targetRoomId = data.roomId || socket.roomId;
    if (targetRoomId) {
      socket.to(targetRoomId).emit('laser-pointer', data);
    }
  });

  socket.on('cursor-move', (data) => {
    const targetRoomId = data.roomId || socket.roomId;
    if (targetRoomId) {
      socket.to(targetRoomId).emit('cursor-move', data);
    }
  });

  socket.on('whiteboard-lock', (data) => {
    const targetRoomId = data.roomId || socket.roomId;
    if (targetRoomId) {
      socket.to(targetRoomId).emit('whiteboard-lock', data);
    }
  });

  // Reactions
  socket.on('reaction', ({ roomId, userId, emoji }) => {
    const targetRoomId = roomId || socket.roomId;
    if (targetRoomId) {
      io.to(targetRoomId).emit('reaction', { userId, emoji });
    }
  });

  // Media State changes (audio/video mute toggles)
  socket.on('media-state', ({ isVideoMuted, isAudioMuted }) => {
    const targetRoomId = socket.roomId;
    if (targetRoomId) {
      socket.to(targetRoomId).emit('user-media-state', {
        userId: socket.id,
        isVideoMuted,
        isAudioMuted
      });
    }
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
    const roomId = socket.roomId;
    if (roomId && rooms[roomId] && rooms[roomId][socket.id]) {
      delete rooms[roomId][socket.id];
      socket.to(roomId).emit('user-disconnected', socket.id);
      
      // Clean up empty rooms
      if (Object.keys(rooms[roomId]).length === 0) {
        delete rooms[roomId];
      }
    }
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
