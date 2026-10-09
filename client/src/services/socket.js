import { io } from 'socket.io-client';

// Socket Server URL
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || (import.meta.env.DEV ? 'http://localhost:5000' : window.location.origin);

/**
 * Shared Socket.io client for authenticated project collaboration
 */
export const socket = io(SOCKET_URL, {
  autoConnect: false,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 2000,
  transports: ['websocket', 'polling']
});

export const connectProjectSocket = () => {
  socket.auth = { token: localStorage.getItem('collabhub_token') };
  if (!socket.connected) socket.connect();
  return socket;
};

export default socket;
