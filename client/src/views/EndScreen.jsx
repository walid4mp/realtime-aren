import React, { useEffect } from 'react';
import Leaderboard from '../components/Leaderboard.jsx';

export default function EndScreen({ room, me, onLeave }) {
  const board = room.leaderboard || [];
  const winner = board[0];
  const myRank = board.find(p => p.id === me?.id)?.rank;

  useEffect(() => {
    const root = document.getElementById('confetti-root');
    if (!root) return;
    root.innerHTML = '';
    for (let i = 0; i < 40; i++) {
      const el = document.createElement('span');
      el.className = 'confetti';
      el.style.left = Math.random() * 100 + '%';
      el.style.background = `hsl(${Math.random() * 360}, 80%, 60%)`;
      el.style.animationDelay = Math.random() * 1.2 + 's';
      root.appendChild(el);
      setTimeout(() => el.remove(), 4000);
    }
  }, []);

  return (
    <div className="card center end">
      <div id="confetti-root" className="confetti-root" aria-hidden="true" />
      <h1 className="title">Match Over</h1>
      {winner && (
        <div className="winner-banner">
          <span className="crown">Crown</span>
          <span className="winner-name">{winner.name}</span>
          <span className="winner-score">{winner.score} pts</span>
        </div>
      )}
      {myRank && <p className="rank-line">You finished #{myRank} of {board.length}</p>}
      <Leaderboard players={room.players} highlightId={me?.id} />
      <button className="btn primary big" onClick={onLeave}>Back to Home</button>
    </div>
  );
}
