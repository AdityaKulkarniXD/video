const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = expre

// Enable CORS for all routes
app.use(cors({
  origin: "*",
  methods: ["GET", "POST"],
  credentials: true
}));

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

app.get("/", (req, res) => {
  res.json({ 
    message: "WebRTC Signaling Server is running", 
    version: "1.0.0",
    timestamp: new Date().toISOString()
  });
});

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true
  },
  pingTimeout: 60000,
  pingInterval: 25000
});

// Store room information
const rooms = new Map();

io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on("join-room", (roomId) => {
    console.log(`User ${socket.id} joining room: ${roomId}`);
    
    // Leave any previous rooms
    Array.from(socket.rooms).forEach(room => {
      if (room !== socket.id) {
        socket.leave(room);
      }
    });

    // Join the new room
    socket.join(roomId);
    
    // Initialize room if it doesn't exist
    if (!rooms.has(roomId)) {
      rooms.set(roomId, new Set());
    }
    
    rooms.get(roomId).add(socket.id);
    
    // Notify others in the room
    socket.to(roomId).emit("user-joined", socket.id);
    
    // Send current room participants
    const participants = Array.from(rooms.get(roomId) || []);
    socket.emit("room-participants", participants.filter(id => id !== socket.id));

    console.log(`Room ${roomId} now has ${rooms.get(roomId).size} participants`);

    // Handle WebRTC signaling
    socket.on("offer", (data) => {
      console.log(`Relaying offer from ${socket.id} in room ${roomId}`);
      socket.to(roomId).emit("offer", { 
        ...data, 
        from: socket.id 
      });
    });

    socket.on("answer", (data) => {
      console.log(`Relaying answer from ${socket.id} in room ${roomId}`);
      socket.to(roomId).emit("answer", { 
        ...data, 
        from: socket.id 
      });
    });

    socket.on("ice-candidate", (data) => {
      console.log(`Relaying ICE candidate from ${socket.id} in room ${roomId}`);
      socket.to(roomId).emit("ice-candidate", { 
        ...data, 
        from: socket.id 
      });
    });

    // Handle media state changes
    socket.on("media-state", (data) => {
      socket.to(roomId).emit("media-state", {
        ...data,
        from: socket.id
      });
    });
  });

  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);
    
    // Remove from all rooms and notify other participants
    rooms.forEach((participants, roomId) => {
      if (participants.has(socket.id)) {
        participants.delete(socket.id);
        socket.to(roomId).emit("user-left", socket.id);
        
        // Clean up empty rooms
        if (participants.size === 0) {
          rooms.delete(roomId);
          console.log(`Room ${roomId} deleted - no participants left`);
        } else {
          console.log(`Room ${roomId} now has ${participants.size} participants`);
        }
      }
    });
  });

  socket.on("error", (error) => {
    console.error("Socket error:", error);
  });
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`🚀 WebRTC Signaling Server running on port ${PORT}`);
  console.log(`📡 Socket.io server ready for connections`);
  console.log(`🌍 CORS enabled for all origins`);
});naling server running on port ${PORT}`));
