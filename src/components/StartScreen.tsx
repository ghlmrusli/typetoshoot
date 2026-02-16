import { Difficulty } from '@/lib/types';
import { DIFFICULTY_ORDER, DIFFICULTY_NAMES, DIFFICULTY_DESCRIPTIONS } from '@/lib/constants';
import styles from '@/styles/StartScreen.module.css';

interface StartScreenProps {
  onSelectDifficulty: (difficulty: Difficulty) => void;
  onMultiplayer?: () => void;
}

export default function StartScreen({ onSelectDifficulty, onMultiplayer }: StartScreenProps) {
  return (
    <div className={styles.timeSelection}>
      <div className={styles.content}>
        <div className={styles.rocketIcon}>🚀</div>
        <h1 className={styles.title}>Word Shooter!</h1>
        <p className={styles.subtitle}>Show your typing skills</p>

        <div className={styles.options}>
          {DIFFICULTY_ORDER.map((diff) => (
            <div
              key={diff}
              className={styles.option}
              onClick={() => onSelectDifficulty(diff)}
            >
              <div className={styles.optionName}>{DIFFICULTY_NAMES[diff]}</div>
              <div className={styles.optionDesc}>{DIFFICULTY_DESCRIPTIONS[diff]}</div>
            </div>
          ))}
        </div>

        {onMultiplayer && (
          <div
            className={`${styles.option} ${styles.multiplayerOption}`}
            onClick={onMultiplayer}
            style={{ marginTop: '15px' }}
          >
            <div className={styles.optionName}>Play with Others</div>
            <div className={styles.optionDesc}>1v1 real-time PvP</div>
          </div>
        )}
      </div>
    </div>
  );
}
