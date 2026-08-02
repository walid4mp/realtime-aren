// Centralized configuration. Honors Render's PORT env var.
module.exports = {
  PORT: process.env.PORT || 3001,
  // 4-char codes drawn from this alphabet (no 0/O/1/I/L).
  CODE_CHARS: 'ABCDEFGHJKMNPQRSTUVWXYZ23456789',
  ROOM: {
    MIN_PLAYERS: 2,
    MAX_PLAYERS: 8,
    ROUNDS_PER_MATCH: 5,
    ROUND_DURATION_MS: 6000,
    INTERMISSION_MS: 3000,
  },
};
