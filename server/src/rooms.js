const crypto = require('crypto');
const { CODE_CHARS, ROOM } = require('./config');

function generateRoomCode(existing) {
  for (let i = 0; i < 10; i++) {
    const bytes = crypto.randomBytes(4);
    let code = '';
    for (let b = 0; b < bytes.length; b++) code += CODE_CHARS[bytes[b] % CODE_CHARS.length];
    if (code.length === 4 && !existing.has(code)) return code;
  }
  throw new Error('Could not allocate a unique room code');
}

// Build a Stroop prompt: a word color (the noun) printed in a different color
// (the target). Also produce 4 choices that include the correct answer.
function buildPrompt() {
  const colors = [
    {name:'Red',hex:'#ef4444'},{name:'Blue',hex:'#3b82f6'},
    {name:'Green',hex:'#22c55e'},{name:'Yellow',hex:'#facc15'},
    {name:'Purple',hex:'#a855f7'},{name:'Pink',hex:'#ec4899'},
    {name:'Orange',hex:'#fb923c'},{name:'Cyan',hex:'#06b6d4'},
  ];
  const wordPick = colors[Math.floor(Math.random()*colors.length)];
  let colorPick = colors[Math.floor(Math.random()*colors.length)];
  while (colorPick.name === wordPick.name) colorPick = colors[Math.floor(Math.random()*colors.length)];
  const choices = new Set([colorPick.name]);
  while (choices.size < 4) choices.add(colors[Math.floor(Math.random()*colors.length)].name);
  const shuffled = Array.from(choices).sort(() => Math.random() - 0.5);
  const colorHex = Object.fromEntries(colors.map(c => [c.name, c.hex]));
  return {
    word: wordPick.name,
    target: colorPick.name,
    targetHex: colorPick.hex,
    wordHex: colorHex[wordPick.name],
    choices: shuffled,
    choicesHex: shuffled.map(n => colorHex[n]),
  };
}

class Room {
  constructor(code, hostId) {
    this.code = code; this.hostId = hostId;
    this.players = new Map();
    this.roundIndex = 0; this.totalRounds = ROOM.ROUNDS_PER_MATCH;
    this.status = 'lobby';
    this.currentPrompt = null; this.roundStart = 0; this.roundEndsAt = 0;
    this.answers = new Map(); this.matchStartedAt = 0;
  }
  addPlayer(id, name) {
    const safeName = (name || 'Player').toString().slice(0, 16) || 'Player';
    this.players.set(id, { id, name: safeName, score: 0, ready: false, joinedAt: Date.now() });
    return this.players.get(id);
  }
  removePlayer(id) {
    const existed = this.players.delete(id);
    if (this.hostId === id) {
      const next = Array.from(this.players.values()).sort((a, b) => a.joinedAt - b.joinedAt)[0];
      this.hostId = next ? next.id : null;
    }
    return existed;
  }
  // Faster correct answers earn more. Wrong or missing answers earn 0.
  finalizeRound() {
    for (const player of this.players.values()) {
      const ans = this.answers.get(player.id);
      if (!ans || ans.choice !== this.currentPrompt.target) continue;
      const elapsed = Math.max(0, ans.ts - this.roundStart);
      const remaining = Math.max(1, this.roundEndsAt - this.roundStart);
      const ratio = Math.min(1, Math.max(0, (remaining - elapsed) / remaining));
      player.score += Math.round(25 + 75 * ratio);
    }
  }
  leaderboard() {
    return Array.from(this.players.values())
      .sort((a, b) => b.score - a.score || a.joinedAt - b.joinedAt)
      .map((p, i) => ({ rank: i + 1, id: p.id, name: p.name, score: p.score }));
  }
  toPublic() {
    return {
      code: this.code, hostId: this.hostId,
      players: Array.from(this.players.values()).map(p => ({ id: p.id, name: p.name, score: p.score, ready: p.ready })),
      status: this.status, roundIndex: this.roundIndex, totalRounds: this.totalRounds,
      leaderboard: this.leaderboard(),
    };
  }
  toState() { return { ...this.toPublic(), prompt: this.currentPrompt, roundStart: this.roundStart, roundEndsAt: this.roundEndsAt, serverTime: Date.now() }; }
}

class RoomManager {
  constructor() { this.rooms = new Map(); }
  create(hostSocketId, hostName) {
    const code = generateRoomCode(this.rooms);
    const room = new Room(code, hostSocketId);
    room.addPlayer(hostSocketId, hostName);
    this.rooms.set(code, room);
    return room;
  }
  join(code, socketId, name) {
    const room = this.rooms.get(code);
    if (!room) return { error: 'Room not found' };
    if (room.status !== 'lobby') return { error: 'Match already started' };
    if (room.players.size >= ROOM.MAX_PLAYERS) return { error: 'Room is full' };
    room.addPlayer(socketId, name);
    return { room };
  }
  leave(socketId) {
    for (const [code, room] of this.rooms) {
      if (room.players.has(socketId)) {
        room.removePlayer(socketId);
        if (room.players.size === 0) this.rooms.delete(code);
        return code;
      }
    }
    return null;
  }
  getRoomFor(socketId) {
    for (const room of this.rooms.values()) if (room.players.has(socketId)) return room;
    return null;
  }
}

module.exports = { RoomManager, buildPrompt };
