// index.js - HTTP + Socket.IO entry point.
// Single Node process: Express serves the React build AND runs Socket.IO,
// perfect for one Render web service.
const path = require('path');
const http = require('http');
const express = require('express');
const cors = require('cors');
const { Server } = require('socket.io');

const { PORT } = require('./config');
const { RoomManager } = require('./rooms');
const { startMatch } = require('./match');

const app = express();
app.use(cors());
app.use(express.json());

// Render health check.
app.get('/healthz', (_req, res) => res.json({ ok: true, uptime: process.uptime() }));

// Serve the built React app (client/dist) and fall back to index.html.
const distPath = path.resolve(__dirname, '..', '..', 'client', 'dist');
app.use(express.static(distPath));
app.get('*', (_req, res, next) => {
  res.sendFile(path.join(distPath, 'index.html'), (err) => { if (err) next(); });
});

const server = http.createServer(app);
// Allow any origin during the game; tighten in real production deploys.
const io = new Server(server, { cors: { origin: '*', methods: ['GET', 'POST'] } });

const manager = new RoomManager();
const loops = new Map(); // code -> RoomLoop instance

io.on('connection', (socket) => {
  console.log('[io] connected ' + socket.id);
  socket.emit('hello', { id: socket.id, serverTime: Date.now() });

  // ---- LOBBY / ROOM CONTROL ----

  socket.on('create_room', ({ name }, cb) => {
    const room = manager.create(socket.id, name);
    socket.join(room.code);
    io.to(room.code).emit('room_state', room.toState());
    if (typeof cb === 'function') cb({ ok: true, code: room.code, state: room.toState() });
  });

  socket.on('join_room', ({ code, name }, cb) => {
    const result = manager.join((code || '').toUpperCase(), socket.id, name);
    if (result.error) { if (typeof cb === 'function') cb({ ok: false, error: result.error }); return; }
    const { room } = result;
    socket.join(room.code);
    io.to(room.code).emit('room_state', room.toState());
    if (typeof cb === 'function') cb({ ok: true, code: room.code, state: room.toState() });
  });

  socket.on('leave_room', (_p, cb) => {
    const left = manager.leave(socket.id);
    if (left) {
      socket.leave(left);
      const room = manager.rooms.get(left);
      if (room) io.to(left).emit('room_state', room.toState());
      if (loops.has(left)) { loops.get(left).clear(); loops.delete(left); }
    }
    if (typeof cb === 'function') cb({ ok: true });
  });

  socket.on('start_match', (_p, cb) => {
    const room = manager.getRoomFor(socket.id);
    if (!room) return cb && cb({ ok: false, error: 'Not in a room' });
    if (room.hostId !== socket.id) return cb && cb({ ok: false, error: 'Only the host can start' });
    if (room.players.size < 2) return cb && cb({ ok: false, error: 'Need at least 2 players' });
    if (loops.has(room.code)) loops.get(room.code).clear();
    loops.set(room.code, startMatch(room, io));
    if (typeof cb === 'function') cb({ ok: true });
  });

  // ---- GAMEPLAY ----

  socket.on('submit_answer', ({ choice }, cb) => {
    const room = manager.getRoomFor(socket.id);
    if (!room || room.status !== 'playing') return cb && cb({ ok: false, error: 'Not accepting answers right now' });
    if (!room.answers.has(socket.id)) room.answers.set(socket.id, { choice, ts: Date.now() });
    io.to(room.code).emit('answer_count', { answered: room.answers.size, total: room.players.size });
    if (typeof cb === 'function') cb({ ok: true });
  });

  // ---- DISCONNECT CLEANUP ----

  socket.on('disconnect', () => {
    console.log('[io] disconnected ' + socket.id);
    const left = manager.leave(socket.id);
    if (left) {
      const room = manager.rooms.get(left);
      if (room) io.to(left).emit('room_state', room.toState());
      else loops.delete(left);
    }
  });
});

// 0.0.0.0 so Render's external routing works.
server.listen(PORT, '0.0.0.0', () => console.log('[Realtime Arena] listening on :' + PORT));
