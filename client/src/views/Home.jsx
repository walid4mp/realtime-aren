import React, { useState } from 'react';
import { randomName } from '../utils/randomName.js';

export default function Home({ onCreate, onJoin, error }) {
  const [name, setName] = useState(() => localStorage.getItem('rt-arena-name') || randomName());
  const [code, setCode] = useState('');
  const [mode, setMode] = useState('home');

  const persist = (n) => { setName(n); localStorage.setItem('rt-arena-name', n); };

  return (
    <div className="card center">
      <h1 className="title">Color <span className="grad">Clash</span></h1>
      <p className="subtitle">A real-time color Stroop showdown. Tap the color of the word - not what it says.</p>

      <label className="field">
        <span>Your name</span>
        <input type="text" value={name} maxLength={16}
          onChange={(e) => persist(e.target.value)} placeholder="Enter a nickname" />
      </label>

      {mode === 'home' && (
        <div className="row">
          <button className="btn primary" disabled={!name.trim()} onClick={() => onCreate(name.trim())}>Create Room</button>
          <button className="btn secondary" onClick={() => setMode('join')}>Join with Code</button>
        </div>
      )}

      {mode === 'join' && (
        <>
          <label className="field">
            <span>Invite code</span>
            <input type="text" value={code} maxLength={4} autoFocus
              style={{ textTransform: 'uppercase', letterSpacing: '0.4em' }}
              onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
              placeholder="WXYZ" />
          </label>
          {error && <div className="error">{error}</div>}
          <div className="row">
            <button className="btn ghost" onClick={() => setMode('home')}>Back</button>
            <button className="btn primary" disabled={!name.trim() || code.length < 4}
              onClick={() => onJoin(name.trim(), code)}>Join</button>
          </div>
        </>
      )}
    </div>
  );
}
