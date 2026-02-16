'use client';

import { useState, useCallback } from 'react';
import { Socket } from 'socket.io-client';
import { ClientToServerEvents, ServerToClientEvents } from '@/lib/socketEvents';
import styles from '@/styles/Lobby.module.css';

type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

interface LobbyProps {
  socket: TypedSocket | null;
  connected: boolean;
  onBack: () => void;
}

export default function Lobby({ socket, connected, onBack }: LobbyProps) {
  const [playerName, setPlayerName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleCreate = useCallback(() => {
    if (!socket || !playerName.trim()) return;
    setLoading(true);
    setError(null);

    socket.emit('room:create', { playerName: playerName.trim() }, (response) => {
      setLoading(false);
      if ('error' in response) {
        setError(response.error);
      }
      // Success is handled by room:state event
    });
  }, [socket, playerName]);

  const handleJoin = useCallback(() => {
    if (!socket || !playerName.trim() || !roomCode.trim()) return;
    setLoading(true);
    setError(null);

    socket.emit('room:join', { roomCode: roomCode.trim().toUpperCase(), playerName: playerName.trim() }, (response) => {
      setLoading(false);
      if ('error' in response) {
        setError(response.error);
      }
    });
  }, [socket, playerName, roomCode]);

  if (!connected) {
    return (
      <div className={styles.lobby}>
        <div className={styles.content}>
          <p className={styles.connecting}>Connecting to server...</p>
          <button className={styles.backBtn} onClick={onBack}>Back</button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.lobby}>
      <div className={styles.content}>
        <div className={styles.title}>Multiplayer</div>
        <p className={styles.subtitle}>Race to type words against a friend!</p>

        <div className={styles.section}>
          <input
            className={`${styles.input} ${styles.nameInput}`}
            type="text"
            placeholder="Your name"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            maxLength={12}
          />
        </div>

        <div className={styles.section}>
          <div className={styles.sectionTitle}>Create a room</div>
          <button
            className={styles.btn}
            onClick={handleCreate}
            disabled={!playerName.trim() || loading}
          >
            {loading ? 'Creating...' : 'Create Room'}
          </button>
        </div>

        <div className={styles.divider}>or</div>

        <div className={styles.section}>
          <div className={styles.sectionTitle}>Join a room</div>
          <div className={styles.joinSection}>
            <input
              className={`${styles.input} ${styles.codeInput}`}
              type="text"
              placeholder="CODE"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase().slice(0, 4))}
              maxLength={4}
            />
            <button
              className={styles.btn}
              onClick={handleJoin}
              disabled={!playerName.trim() || roomCode.length < 4 || loading}
            >
              {loading ? 'Joining...' : 'Join Room'}
            </button>
          </div>
        </div>

        {error && <p className={styles.error}>{error}</p>}

        <button className={styles.backBtn} onClick={onBack}>
          Back to Menu
        </button>
      </div>
    </div>
  );
}
