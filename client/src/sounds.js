// sounds.js - eagerly synthesized SFX via Web Audio. No asset files.
let ctx = null;
function ensureContext() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}
function t({ freq = 440, duration = 0.15, type = 'sine', volume = 0.18, startOffset = 0 } = {}) {
  const c = ensureContext();
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type; osc.frequency.value = freq; gain.gain.value = 0;
  const now = c.currentTime + startOffset;
  gain.gain.linearRampToValueAtTime(volume, now + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  osc.connect(gain).connect(c.destination);
  osc.start(now);
  osc.stop(now + duration + 0.02);
}
export const sfx = {
  click:   () => t({ freq: 740,  duration: 0.07, type: 'square',    volume: 0.10 }),
  tick:    () => t({ freq: 1200, duration: 0.06, type: 'square',    volume: 0.08 }),
  wrong:   () => t({ freq: 220,  duration: 0.18, type: 'sawtooth',  volume: 0.10 }),
  correct: () => { t({freq: 660,  duration: 0.10, type:'triangle', volume: 0.12}); t({freq: 880, duration: 0.12, type:'triangle', volume: 0.12, startOffset: 0.10}); t({freq: 1320, duration: 0.18, type:'triangle', volume: 0.12, startOffset: 0.22}); },
  start:   () => { t({freq: 440,  duration: 0.10, type:'sine',     volume: 0.12}); t({freq: 660, duration: 0.10, type:'sine',     volume: 0.12, startOffset: 0.10}); t({freq: 880, duration: 0.20, type:'sine',     volume: 0.14, startOffset: 0.20}); },
  finish:  () => { t({freq: 523,  duration: 0.15, type:'triangle', volume: 0.16}); t({freq: 659, duration: 0.15, type:'triangle', volume: 0.16, startOffset: 0.15}); t({freq: 784, duration: 0.15, type:'triangle', volume: 0.16, startOffset: 0.30}); t({freq: 1046,duration: 0.40, type:'triangle', volume: 0.18, startOffset: 0.45}); },
};
const K = 'rt-arena-muted';
export const isMuted = () => localStorage.getItem(K) === '1';
export const toggleMute = () => { const n = !isMuted(); localStorage.setItem(K, n ? '1' : '0'); return n; };
