import styles from '@/styles/GameOverScreen.module.css';

interface GameOverScreenProps {
  highestScore: number;
  onRestart: () => void;
}

export default function GameOverScreen({ highestScore, onRestart }: GameOverScreenProps) {
  return (
    <div className={styles.gameOver}>
      <h1 className={styles.title}>GAME OVER</h1>
      <div className={styles.finalScore}>Highest Score: {highestScore}</div>
      <button className={styles.restartBtn} onClick={onRestart}>
        Restart Game
      </button>
    </div>
  );
}
