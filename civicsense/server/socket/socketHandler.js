const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

let io;

const initSocket = (server) => {
  io = new Server(server, {
    cors: { origin: process.env.CLIENT_URL || 'http://localhost:5173', methods: ['GET','POST'], credentials: true },
    pingTimeout: 60000,
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next();
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      socket.userRole = decoded.role;
    } catch (_) {}
    next();
  });

  io.on('connection', (socket) => {
    if (socket.userId) socket.join(`user_${socket.userId}`);
    if (socket.userRole) socket.join(`role_${socket.userRole}`);

    socket.on('join_area', (area) => socket.join(`area_${area}`));
    socket.on('join_public', () => socket.join('public_dashboard'));
    socket.on('disconnect', () => {});
  });

  return io;
};

const getIO = () => {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
};

module.exports = { initSocket, getIO };
