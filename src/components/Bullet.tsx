import React from 'react';
import { BulletState } from '@/lib/types';
import { BULLET_BEAM_LENGTH } from '@/lib/constants';
import styles from '@/styles/Bullet.module.css';

interface BulletProps {
  bullet: BulletState;
}

function BulletComponent({ bullet }: BulletProps) {
  return (
    <div
      className={styles.bullet}
      style={{
        left: bullet.x - 1.5,
        top: bullet.y,
        height: BULLET_BEAM_LENGTH,
        transform: `rotate(${bullet.angle}deg)`,
        transformOrigin: 'top center',
      }}
    />
  );
}

export default React.memo(BulletComponent);
