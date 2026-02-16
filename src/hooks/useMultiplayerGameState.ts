'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { Socket } from 'socket.io-client';
import {
  ServerInvader,
  PlayerInfo,
  RoomState,
  RoomPhase,
  GameFullState,
  GameDelta,
  InvaderKilled,
  ClientToServerEvents,
  ServerToClientEvents,
} from '@/lib/socketEvents';

type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

export interface MultiplayerState {
  roomCode: string | null;
  phase: RoomPhase | null;
  players: PlayerInfo[];
  invaders: ServerInvader[];
  timeRemaining: number;
  countdownValue: number;
  winnerId: string | null;
  myLockedInvaderId: string | null;
  error: string | null;
  opponentDisconnected: boolean;
}

const initialState: MultiplayerState = {
  roomCode: null,
  phase: null,
  players: [],
  invaders: [],
  timeRemaining: 120,
  countdownValue: 3,
  winnerId: null,
  myLockedInvaderId: null,
  error: null,
  opponentDisconnected: false,
};

export function useMultiplayerGameState(socket: TypedSocket | null) {
  const [state, setState] = useState<MultiplayerState>(initialState);
  const invadersRef = useRef<Map<string, ServerInvader>>(new Map());

  // Reset state
  const reset = useCallback(() => {
    setState(initialState);
    invadersRef.current.clear();
  }, []);

  useEffect(() => {
    if (!socket) return;

    const onRoomState = (roomState: RoomState) => {
      setState(prev => ({
        ...prev,
        roomCode: roomState.roomCode,
        phase: roomState.phase,
        players: roomState.players,
        countdownValue: roomState.countdownValue,
        timeRemaining: roomState.timeRemaining,
        error: null,
        opponentDisconnected: false,
      }));
    };

    const onCountdown = (value: number) => {
      setState(prev => ({ ...prev, countdownValue: value, phase: 'countdown' }));
    };

    const onFullState = (fullState: GameFullState) => {
      // Replace entire invader state
      invadersRef.current.clear();
      for (const inv of fullState.invaders) {
        invadersRef.current.set(inv.id, inv);
      }
      setState(prev => ({
        ...prev,
        invaders: fullState.invaders,
        players: fullState.players,
        timeRemaining: fullState.timeRemaining,
        phase: fullState.phase,
      }));
    };

    const onDelta = (delta: GameDelta) => {
      // Update positions only
      for (const update of delta.invaders) {
        const inv = invadersRef.current.get(update.id);
        if (inv) {
          inv.x = update.x;
          inv.y = update.y;
        }
      }
      setState(prev => ({
        ...prev,
        invaders: Array.from(invadersRef.current.values()),
        timeRemaining: delta.timeRemaining,
      }));
    };

    const onInvaderKilled = (data: InvaderKilled) => {
      invadersRef.current.delete(data.invaderId);
      setState(prev => ({
        ...prev,
        invaders: Array.from(invadersRef.current.values()),
        myLockedInvaderId: prev.myLockedInvaderId === data.invaderId ? null : prev.myLockedInvaderId,
      }));
    };

    const onFinished = (data: { players: PlayerInfo[]; winnerId: string | null }) => {
      setState(prev => ({
        ...prev,
        phase: 'finished',
        players: data.players,
        winnerId: data.winnerId,
      }));
    };

    const onLockGranted = (data: { invaderId: string }) => {
      setState(prev => ({ ...prev, myLockedInvaderId: data.invaderId }));
      // Update invader lock state in ref
      const inv = invadersRef.current.get(data.invaderId);
      if (inv) {
        inv.lockedBy = socket.id ?? null;
      }
    };

    const onLockDenied = (_data: { invaderId: string; reason: string }) => {
      setState(prev => ({ ...prev, myLockedInvaderId: null }));
    };

    const onLocked = (data: { invaderId: string; bySocketId: string }) => {
      const inv = invadersRef.current.get(data.invaderId);
      if (inv) {
        inv.lockedBy = data.bySocketId;
      }
      setState(prev => ({
        ...prev,
        invaders: Array.from(invadersRef.current.values()),
      }));
    };

    const onReleased = (data: { invaderId: string }) => {
      if (data.invaderId) {
        const inv = invadersRef.current.get(data.invaderId);
        if (inv) {
          inv.lockedBy = null;
          inv.typingProgress = 0;
        }
      }
      setState(prev => ({
        ...prev,
        invaders: Array.from(invadersRef.current.values()),
      }));
    };

    const onRoomError = (message: string) => {
      setState(prev => ({ ...prev, error: message }));
    };

    const onPlayerDisconnected = (_data: { socketId: string; playerName: string }) => {
      setState(prev => ({ ...prev, opponentDisconnected: true }));
    };

    socket.on('room:state', onRoomState);
    socket.on('room:countdown', onCountdown);
    socket.on('game:fullState', onFullState);
    socket.on('game:delta', onDelta);
    socket.on('game:invaderKilled', onInvaderKilled);
    socket.on('game:finished', onFinished);
    socket.on('typing:lockGranted', onLockGranted);
    socket.on('typing:lockDenied', onLockDenied);
    socket.on('typing:locked', onLocked);
    socket.on('typing:released', onReleased);
    socket.on('room:error', onRoomError);
    socket.on('player:disconnected', onPlayerDisconnected);

    return () => {
      socket.off('room:state', onRoomState);
      socket.off('room:countdown', onCountdown);
      socket.off('game:fullState', onFullState);
      socket.off('game:delta', onDelta);
      socket.off('game:invaderKilled', onInvaderKilled);
      socket.off('game:finished', onFinished);
      socket.off('typing:lockGranted', onLockGranted);
      socket.off('typing:lockDenied', onLockDenied);
      socket.off('typing:locked', onLocked);
      socket.off('typing:released', onReleased);
      socket.off('room:error', onRoomError);
      socket.off('player:disconnected', onPlayerDisconnected);
    };
  }, [socket]);

  return { state, reset };
}
