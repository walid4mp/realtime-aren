const { ROOM } = require('./config');

class RoomLoop {
  constructor(room, io) { this.room = room; this.io = io; this.timers = []; }
  clear() { while (this.timers.length) clearTimeout(this.timers.shift()); }
  set(fn, ms) { const h = setTimeout(fn, ms); this.timers.push(h); return h; }
}

function startMatch(room, io) {
  const loop = new RoomLoop(room, io);
  room.matchStartedAt = Date.now();
  room.roundIndex = 0;
  room.totalRounds = ROOM.ROUNDS_PER_MATCH;

  const startRound = () => {
    room.answers.clear();
    room.currentPrompt = require('./rooms').buildPrompt();
    room.roundStart = Date.now() + 250;
    room.roundEndsAt = room.roundStart + ROOM.ROUND_DURATION_MS;
    room.status = 'playing';
    io.to(room.code).emit('round_start', room.toState());

    loop.set(() => {
      room.finalizeRound();
      room.status = 'round_end';
      io.to(room.code).emit('round_end', room.toState());
      if (room.roundIndex + 1 >= room.totalRounds) {
        loop.set(() => {
          room.status = 'match_end';
          io.to(room.code).emit('match_end', room.toState());
          loop.clear();
        }, ROOM.INTERMISSION_MS);
      } else {
        room.roundIndex += 1;
        loop.set(startRound, ROOM.INTERMISSION_MS);
      }
    }, room.roundEndsAt - Date.now());
  };

  room.status = 'countdown';
  io.to(room.code).emit('countdown', { code: room.code, ms: 1500, state: room.toState() });
  loop.set(startRound, 1500);
  return loop;
}

module.exports = { startMatch };
