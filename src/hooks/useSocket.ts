'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { ClientToServerEvents, ServerToClientEvents } from '@/lib/socketEvents';

type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

// Empty or unset = connect to same origin (works with Next.js rewrites + ngrok)
const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || undefined;

export function useSocket() {
  const socketRef = useRef<TypedSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [socketId, setSocketId] = useState<string | null>(null);

  useEffect(() => {
    const opts: Parameters<typeof io>[1] = {
      transports: ['websocket', 'polling'],
      autoConnect: true,
    };
    const socket: TypedSocket = SOCKET_URL ? io(SOCKET_URL, opts) : io(opts);

    socket.on('connect', () => {
      setConnected(true);
      setSocketId(socket.id ?? null);
    });

    socket.on('disconnect', () => {
      setConnected(false);
      setSocketId(null);
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  const getSocket = useCallback((): TypedSocket | null => {
    return socketRef.current;
  }, []);

  return { socket: socketRef.current, connected, socketId, getSocket };
}
