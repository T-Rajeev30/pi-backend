// server.js
require('dotenv').config();
const http     = require('http');
const mongoose = require('mongoose');
const { Server } = require('socket.io');
const app      = require('./app');

const PORT = process.env.PORT || 5001;

async function startServer() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('[DB] MongoDB connected:', mongoose.connection.name);

    const server = http.createServer(app);

    // ── Socket.IO ─────────────────────────────────────────────────────────────
    const io = new Server(server, {
      cors: {
        origin: [
          'https://statcams.com',
          'https://www.statcams.com',
          'https://zpi.statcams.com',
        ],
        credentials: true,
      },
    });

    global.io = io;

    io.on('connection', (socket) => {
      console.log('[Socket.IO] Client connected:', socket.id);
      socket.on('disconnect', () => {
        console.log('[Socket.IO] Client disconnected:', socket.id);
      });
    });

    // ── MQTT Subscriber (load AFTER io is set as global) ─────────────────────
    // This is intentionally loaded here so global.io is available inside it
    require('./mqtt/subscriber');
    console.log('[MQTT] Subscriber loaded');

    server.listen(PORT, () => {
      console.log(`[Server] API running on port ${PORT}`);
    });
  } catch (err) {
    console.error('[Server] Startup failed:', err);
    process.exit(1);
  }
}

startServer();
