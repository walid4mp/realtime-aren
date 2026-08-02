import React, { useState } from 'react';
import Leaderboard from '../components/Leaderboard.jsx';

export default function Lobby({ room, me, onStart, onLeave }) {
  const isHost = room.hostId === me?.id;
  const canStart = room.players.length >= 2;
  const [copied, setCopied] = useState(false);

  const share = async () => {
    const url = `${window.location.origin}/?room=${room.code}`;
    try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 1800); }
    catch { window.prompt('Copy this invite link:', url); }
  };

  return (
    <div className="card lobby">
      <div className="invite">
        <div className="invite-code">
          {room.code.split('').map((c, i) => (
            <span key={i} className="invite-char" style={{ animationDelay: `${i * 60}ms` }}>{c}</span>
          ))}
        </div>
        <button className="btn primary" onClick={share}>{copied ? 'Copied' : 'Copy invite link'}</button>
      </div>

      <Leaderboard players={room.players} highlightId={me?.id} />

      <div className="lobby-actions">
        {isHost ? (
          <button className="btn primary big" disabled={!canStart} onClick={onStart}>
            Start Match {canStart ? '' : '(need 2+ players)'}
          </button>
        ) : <div className="waiting">Waiting for host to start</div>}
        <button className="btn ghost" onClick={onLeave}>Leave Room</button>
      </div>
    </div>
  );
}
