import React from 'react';

export default function Leaderboard({ players, highlightId, compact }) {
  const sorted = [...(players || [])].sort(
    (a, b) => (b.score || 0) - (a.score || 0) || a.joinedAt - b.joinedAt
  );
  if (!sorted.length) return <div className="muted">No players yet</div>;
  return (
    <ul className={`leaderboard ${compact ? 'compact' : ''}`}>
      {sorted.map((p, i) => (
        <li key={p.id} className={`lb-row ${p.id === highlightId ? 'me' : ''}`}>
          <span className="lb-rank">{i + 1}</span>
          <span className="lb-name">{p.name}</span>
          <span className="lb-score">{p.score || 0}</span>
        </li>
      ))}
    </ul>
  );
}
