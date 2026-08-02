import React, { useEffect, useState, useCallback } from 'react';
import { socket } from './socket.js';
import { sfx, isMuted, toggleMute } from './sounds.js';
import Home from './views/Home.jsx';
import Lobby from './views/Lobby.jsx';
import Game from './views/Game.jsx';
import EndScreen from './views/EndScreen.jsx';

export default function App() {
  const [me, setMe] = useState(null);
  const [screen, setScreen] = useState('home');
  const [room, setRoom] = useState(null);
  const [prompt, setPrompt] = useState(null);
  const [timing, setTiming] = useState(null);
  const [muted, setMuted] = useState(isMuted());
  const [joinError, setJoinError] = useState('');
  const [lastResult, setLastResult] = useState(null);

  useEffect(() => {
    const onHello = ({ id }) => setMe(m => m || { id, name: '' });
    const onState = (s) => { setRoom(s); if (s.status === 'lobby') setScreen('lobby'); };
    const onCountdown = ({ state }) => { setRoom(state); setScreen('game'); setPrompt(null); sfx.start(); };
    const onRoundStart = (state) => {
      setRoom(state);
      setPrompt(state.prompt);
      setTiming({ roundStart: state.roundStart, roundEndsAt: state.roundEndsAt, serverTime: state.serverTime });
      setLastResult(null);
      setScreen('game');
      sfx.tick();
    };
    const onMatchEnd = (state) => { setRoom(state); setScreen('end'); sfx.finish(); };
    socket.on('hello', onHello);
    socket.on('room_state', onState);
    socket.on('countdown', onCountdown);
    socket.on('round_start', onRoundStart);
    socket.on('match_end', onMatchEnd);
    return () => {
      socket.off('hello', onHello);
      socket.off('room_state', onState);
      socket.off('countdown', onCountdown);
      socket.off('round_start', onRoundStart);
      socket.off('match_end', onMatchEnd);
    };
  }, []);

  const createRoom = useCallback((name) => {
    setJoinError('');
    socket.emit('create_room', { name }, (ack) => {
      if (ack?.ok) { setMe({ id: socket.id, name }); setRoom(ack.state); setScreen('lobby'); }
    });
  }, []);
  const joinRoom = useCallback((name, code) => {
    setJoinError('');
    socket.emit('join_room', { code, name }, (ack) => {
      if (ack?.ok) { setMe({ id: socket.id, name }); setRoom(ack.state); setScreen('lobby'); }
      else setJoinError(ack?.error || 'Unable to join');
    });
  }, []);
  const startMatch = useCallback(() => socket.emit('start_match', {}, () => {}), []);
  const leaveRoom = useCallback(() => {
    socket.emit('leave_room', {}, () => { setRoom(null); setPrompt(null); setScreen('home'); });
  }, []);
  const submitAnswer = useCallback((choice) => {
    if (!prompt) return;
    socket.emit('submit_answer', { choice }, () => {});
    if (!muted) (choice === prompt.target ? sfx.correct() : sfx.wrong());
    setLastResult({ correct: choice === prompt.target, choice, target: prompt.target });
  }, [prompt, muted]);
  const toggleSound = () => setMuted(toggleMute());

  let view;
  if (screen === 'home' || !room) view = <Home onCreate={createRoom} onJoin={joinRoom} error={joinError} />;
  else if (screen === 'lobby') view = <Lobby room={room} me={me} onStart={startMatch} onLeave={leaveRoom} />;
  else if (screen === 'game') view = <Game room={room} me={me} prompt={prompt} timing={timing} lastResult={lastResult} onAnswer={submitAnswer} onLeave={leaveRoom} />;
  else view = <EndScreen room={room} me={me} onLeave={leaveRoom} />;

  return (
    <div className="app-shell">
      <header className="app-bar">
        <div className="brand"><span className="brand-dot" /> Realtime Arena</div>
        <button className="ghost" onClick={toggleSound}>{muted ? 'Sound off' : 'Sound on'}</button>
      </header>
      <main className="app-main">{view}</main>
      <footer className="app-foot">v1.0 - Color Clash</footer>
    </div>
  );
}
