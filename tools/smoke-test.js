// Smoke test: spins up 3 Socket.IO clients, joins one room, runs a full 5-round
// match, and asserts the critical socket events fire end-to-end. Run AFTER
// `npm start` is up. Override target via SMOKE_URL=...
const { io } = require('socket.io-client');

const URL = process.env.SMOKE_URL || `http://127.0.0.1:${process.env.PORT || 3001}`;
let failures = 0;
const pass = (l) => console.log('  ok  ' + l);
const fail = (l, d) => { failures += 1; console.error('  FAIL ' + l + (d ? ' - ' + d : '')); };
const wait = (ms) => new Promise(r => setTimeout(r, ms));

function makePlayer(name) {
  const events = { hello: 0, roomState: [], roundStart: 0, roundEnd: 0, matchEnd: 0 };
  const s = io(URL, { transports: ['websocket'], reconnection: false });
  s.on('hello',       ()  => (events.hello += 1));
  s.on('room_state',  (s2) => events.roomState.push(s2));
  s.on('round_start', ()  => (events.roundStart += 1));
  s.on('round_end',   ()  => (events.roundEnd   += 1));
  s.on('match_end',   ()  => (events.matchEnd   += 1));
  return { socket: s, events };
}
const emit = (s, e, p) => new Promise(res => s.emit(e, p, ack => res(ack)));

(async () => {
  console.log('\n=> smoke test against ' + URL + '\n');

  const host = makePlayer('Host');
  await wait(200);
  if (host.events.hello !== 1) fail('host received hello'); else pass('host received hello');

  const createAck = await emit(host.socket, 'create_room', { name: 'Host' });
  if (!createAck?.ok || !/^[A-Z2-9]{4}$/.test(createAck.code)) {
    fail('create_room returned valid 4-char code', JSON.stringify(createAck));
    process.exit(1);
  }
  pass('create_room -> ' + createAck.code);

  const g1 = makePlayer('A');
  const g2 = makePlayer('B');
  await wait(160);
  const j1 = await emit(g1.socket, 'join_room', { name: 'A', code: createAck.code });
  const j2 = await emit(g2.socket, 'join_room', { name: 'B', code: createAck.code });
  if (!j1?.ok) fail('guest1 joined'); else pass('guest1 joined');
  if (!j2?.ok) fail('guest2 joined'); else pass('guest2 joined');

  const last = host.events.roomState[host.events.roomState.length - 1];
  if (last?.players?.length === 3) pass('room_state has 3 players');
  else fail('room_state player count', 'got ' + (last?.players?.length));

  // Have each guest submit a wrong answer so they stay in sync and we get round_end events.
  // Also pin player choice: we just don't touch it - the server rates empty slots as score 0.
  const startAck = await emit(host.socket, 'start_match', {});
  if (!startAck?.ok) fail('start_match', JSON.stringify(startAck));
  else pass('start_match accepted');

  await wait(50000); // 5 rounds * ~9s

  if (host.events.roundStart === 5) pass('5 round_start events');
  else fail('round_start count', 'got ' + host.events.roundStart);
  if (host.events.matchEnd === 1) pass('1 match_end event');
  else fail('match_end count', 'got ' + host.events.matchEnd);

  for (const s of [host.socket, g1.socket, g2.socket]) s.disconnect();
  process.exit(failures === 0 ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(1); });
