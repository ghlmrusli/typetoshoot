'use client';

import { useCallback } from 'react';
import { Socket } from 'socket.io-client';
import { PlayerInfo, ClientToServerEvents, ServerToClientEvents } from '@/lib/socketEvents';
import styles from '@/styles/RoomWaiting.module.css';

type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

interface RoomWaitingProps {
  socket: TypedSocket | null;
  socketId: string | null;
  roomCode: string;
  players: PlayerInfo[];
  onLeave: () => void;
}

export default function RoomWaiting({ socket, socketId, roomCode, players, onLeave }: RoomWaitingProps) {
  const myPlayer = players.find(p => p.socketId === socketId);
  const isReady = myPlayer?.ready ?? false;

  const handleReady = useCallback(() => {
    if (!socket) return;
    socket.emit('room:ready');
  }, [socket]);

  const handleLeave = useCallback(() => {
    if (socket) {
      socket.emit('room:leave');
    }
    onLeave();
  }, [socket, onLeave]);

  return (
    <div className={styles.waiting}>
      <div className={styles.content}>
        <div className={styles.roomCodeLabel}>Room Code</div>
        <div className={styles.roomCode}>{roomCode}</div>

        <div className={styles.playerList}>
          {players.map((player) => (
            <div
              key={player.socketId}
              className={`${styles.player} ${player.ready ? styles.playerReady : ''}`}
            >
              <span className={styles.playerName}>
                {player.name}
                {player.socketId === socketId ? ' (you)' : ''}
              </span>
              <span className={`${styles.playerStatus} ${player.ready ? styles.playerStatusReady : ''}`}>
                {player.ready ? 'Ready!' : 'Waiting...'}
              </span>
            </div>
          ))}
          {players.length < 2 && (
            <div className={styles.waitingSlot}>
              Waiting for opponent...
            </div>
          )}
        </div>

        <button
          className={`${styles.readyBtn} ${isReady ? styles.readyBtnActive : ''}`}
          onClick={handleReady}
          disabled={isReady || players.length < 2}
        >
          {isReady ? 'Ready!' : players.length < 2 ? 'Waiting for opponent...' : 'Ready Up'}
        </button>

        <button className={styles.leaveBtn} onClick={handleLeave}>
          Leave Room
        </button>

        <div className={styles.hint}>
          Share the room code with a friend to play together
        </div>
      </div>
    </div>
  );
}
