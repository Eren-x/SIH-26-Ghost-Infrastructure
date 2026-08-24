import { io } from 'socket.io-client';

// In production the server serves the client from the same origin;
// in dev, Vite runs on 5173 and the API on 3001.
const SERVER_URL = import.meta.env.PROD
  ? window.location.origin
  : 'http://localhost:3001';

export const socket = io(SERVER_URL, {
  transports: ['websocket'],
  autoConnect: true,
});
