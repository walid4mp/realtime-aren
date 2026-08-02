import { io } from 'socket.io-client';
// Production: same origin as the page. Dev: hardcoded :3001 (Vite proxies anyway).
const URL = import.meta.env.PROD ? window.location.origin : `http://${window.location.hostname}:3001`;
export const socket = io(URL, {
  transports: ['websocket', 'polling'],
  autoConnect: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 800,
});
