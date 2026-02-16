import { useMemo } from 'react';
import { PAUSE_MESSAGES } from '@/lib/constants';
import styles from '@/styles/PauseOverlay.module.css';

interface PauseOverlayProps {
  onResume: () => void;
}

export default function PauseOverlay({ onResume }: PauseOverlayProps) {
  const message = useMemo(
    () => PAUSE_MESSAGES[Math.floor(Math.random() * PAUSE_MESSAGES.length)],
    []
  );

  return (
    <div className={styles.overlay} onClick={onResume}>
      <div className={styles.content}>
        <div className={styles.microcopy}>{message}</div>
        <div className={styles.pauseIcon}>
          <span className={`material-symbols-outlined ${styles.materialIcon}`}>
            play_arrow
          </span>
          <span className={styles.pauseText}>Continue</span>
        </div>
      </div>
    </div>
  );
}
