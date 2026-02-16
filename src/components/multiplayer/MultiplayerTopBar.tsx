'use client';

import { PlayerInfo } from '@/lib/socketEvents';
import styles from '@/styles/MultiplayerTopBar.module.css';

interface MultiplayerTopBarProps {
  players: PlayerInfo[];
  timeRemaining: number;
  mySocketId: string | null;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function MultiplayerTopBar({ players, timeRemaining, mySocketId }: MultiplayerTopBarProps) {
  const me = players.find(p => p.socketId === mySocketId);
  const opponent = players.find(p => p.socketId !== mySocketId);
  const isLow = timeRemaining <= 30;

  return (
    <div className={styles.topbar}>
      <div className={`${styles.playerScore} ${styles.playerScoreLeft}`}>
        <span className={styles.playerName}>{me?.name || 'You'}</span>
        <span className={`${styles.score} ${styles.myScore}`}>{me?.score ?? 0}</span>
      </div>

      <div className={`${styles.timer} ${isLow ? styles.timerLow : ''}`}>
        {formatTime(timeRemaining)}
      </div>

      <div className={`${styles.playerScore} ${styles.playerScoreRight}`}>
        <span className={`${styles.score}`}>{opponent?.score ?? 0}</span>
        <span className={styles.playerName}>{opponent?.name || 'Opponent'}</span>
      </div>
    </div>
  );
}
