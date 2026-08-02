import React, { useEffect, useRef, useState } from 'react';
import Leaderboard from '../components/Leaderboard.jsx';

export default function Game({ room, me, prompt, timing, lastResult, onAnswer, onLeave }) {
  const [now, setNow] = useState(Date.now());
  const rafRef = useRef(null);

  useEffect(() => {
    if (!timing) return undefined;
    const tick = () => { setNow(Date.now()); rafRef.current = requestAnimationFrame(tick); };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [timing]);

  if (!prompt) {
    return <div className="card center"><div className="spinner" /><p>Starting round</p></div>;
  }

  const elapsed = Math.max(0, now - (timing.roundStart - (Date.now() - timing.serverTime) - 50));
  const total = timing.roundEndsAt - timing.roundStart;
  const pct = Math.max(0, Math.min(100, (elapsed / total) * 100));
  const remainingMs = Math.max(0, total - elapsed);

  return (
    <div className="card game">
      <div className="round-bar">
        <div className="round-info">Round <strong>{room.roundIndex + 1}</strong> / {room.totalRounds}</div>
        <div className="round-timer">
          <div className="round-bar-fill" style={{ width: `${pct}%` }} />
          <span className="round-bar-label">{Math.max(0, Math.ceil(remainingMs / 1000))}s</span>
        </div>
      </div>

      <div className="prompt-wrap">
        <div className="prompt-word pop-in" style={{ color: prompt.wordHex }}>{prompt.word}</div>
        <div className="prompt-hint">Tap the color this word is printed in</div>
      </div>

      <div className="choices">
        {prompt.choices.map((choice, idx) => {
          const hex = prompt.choicesHex[idx];
          const isLastPick = lastResult?.choice === choice;
          return (
            <button key={choice + idx}
              className={`choice ${isLastPick ? (lastResult.correct ? 'correct' : 'wrong') : ''}`}
              style={{ background: hex }}
              onClick={() => onAnswer(choice)}
              disabled={!!lastResult}>
              {choice}
            </button>
          );
        })}
      </div>

      <Leaderboard players={room.players} highlightId={me?.id} compact />
      <button className="btn ghost small" onClick={onLeave}>Leave</button>
    </div>
  );
}
