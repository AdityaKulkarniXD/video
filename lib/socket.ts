import { io, Socket } from 'socket.io-client';

class SocketManager {
  private socket: Socket | null = null;
  private readonly serverUrl: string;

  constructor() {
    // Use environment variable or default to localhost for development
    this.serverUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';
  }

  connect(): Socket {
    if (!this.socket || !this.socket.connected) {
      this.socket = io(this.serverUrl, {
        transports: ['websocket', 'polling'],
        upgrade: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 20000,
        forceNew: false, // Reuse existing connection if available
      });

      this.socket.on('connect', () => {
        console.log('Connected to signaling server:', this.socket?.id);
      });

      this.socket.on('disconnect', (reason) => {
        console.log('Disconnected from signaling server:', reason);
      });

      this.socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
      });

      this.socket.on('reconnect', (attemptNumber) => {
        console.log('Reconnected to signaling server after', attemptNumber, 'attempts');
      });

      this.socket.on('reconnect_error', (error) => {
        console.error('Socket reconnection error:', error);
      });
    }

    return this.socket;
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  getSocket(): Socket | null {
    return this.socket;
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

export const socketManager = new SocketManager();
export { Socket };