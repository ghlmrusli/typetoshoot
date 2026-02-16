import React from 'react';
import { InvaderState } from '@/lib/types';
import styles from '@/styles/Invader.module.css';

interface InvaderProps {
  invader: InvaderState;
  currentInput: string;
  isTarget: boolean;
  lockedBy?: string | null;
  mySocketId?: string | null;
}

function InvaderComponent({ invader, currentInput, isTarget, lockedBy, mySocketId }: InvaderProps) {
  const progress =
    currentInput && invader.word.startsWith(currentInput) && !invader.isDying
      ? (currentInput.length / invader.word.length) * 100
      : 0;

  const isCompleted = invader.isDying && isTarget;

  // Fade when approaching bottom
  let opacity = 1;
  if (typeof window !== 'undefined') {
    const fadeStart = window.innerHeight * 0.65;
    const fadeEnd = window.innerHeight * 0.70;
    if (invader.y >= fadeStart && invader.y < fadeEnd) {
      const fadeProgress = (invader.y - fadeStart) / (fadeEnd - fadeStart);
      opacity = Math.max(0, 1 - fadeProgress);
    }
  }

  // Multiplayer lock classes
  let lockClass = '';
  if (lockedBy && mySocketId) {
    if (lockedBy === mySocketId) {
      lockClass = styles.lockedByMe;
    } else {
      lockClass = styles.lockedByOpponent;
    }
  }

  return (
    <div
      className={`${styles.invader} ${invader.isDying ? styles.dying : ''} ${lockClass}`}
      style={{
        left: invader.x,
        top: invader.y,
        opacity: invader.isDying ? undefined : opacity,
      }}
    >
      <div
        className={`${styles.word} ${isCompleted ? styles.typing : ''}`}
        style={{ '--progress': `${progress}%` } as React.CSSProperties}
      >
        {invader.word.split('').map((char, i) => (
          <span key={i} className={styles.char}>
            {char}
          </span>
        ))}
      </div>
      <div className={styles.emoji}>{invader.emoji}</div>
    </div>
  );
}

export default React.memo(InvaderComponent);
