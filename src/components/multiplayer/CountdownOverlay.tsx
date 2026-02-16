'use client';

import styles from '@/styles/CountdownOverlay.module.css';

interface CountdownOverlayProps {
  value: number;
}

export default function CountdownOverlay({ value }: CountdownOverlayProps) {
  return (
    <div className={styles.overlay}>
      <div key={value} className={`${styles.count} ${value <= 0 ? styles.go : ''}`}>
        {value > 0 ? value : 'GO!'}
      </div>
    </div>
  );
}
