import styles from '@/styles/Rocket.module.css';

interface RocketProps {
  angle: number;
}

export default function Rocket({ angle }: RocketProps) {
  return (
    <div
      className={`${styles.gun} ${styles.aiming}`}
      style={{ transform: `rotate(${angle}deg)` }}
    >
      🚀
    </div>
  );
}
