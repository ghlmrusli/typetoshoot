import { useEffect, useCallback } from 'react';
import { ChallengeState, GameAction } from '@/lib/types';
import { CHALLENGE_KEYBOARD_ROWS } from '@/lib/constants';
import OnScreenKeyboard from './OnScreenKeyboard';
import styles from '@/styles/ChallengeScreen.module.css';

interface ChallengeScreenProps {
  challenge: ChallengeState;
  dispatch: React.Dispatch<GameAction>;
}

export default function ChallengeScreen({ challenge, dispatch }: ChallengeScreenProps) {
  // Timer tick
  useEffect(() => {
    const interval = setInterval(() => {
      dispatch({ type: 'CHALLENGE_TICK' });
    }, 1000);
    return () => clearInterval(interval);
  }, [dispatch]);

  const handleKeyPress = useCallback(
    (key: string) => {
      if (key === 'backspace') {
        dispatch({ type: 'CHALLENGE_BACKSPACE' });
      } else {
        dispatch({ type: 'CHALLENGE_TYPE', char: key });
      }
    },
    [dispatch]
  );

  return (
    <div className={styles.challengeScreen}>
      <div className={styles.content}>
        <div className={styles.timer}>{challenge.timeLeft} Sec</div>
        <h2 className={styles.title}>SPEED ROUND</h2>
        <div className={styles.sentence}>
          {challenge.sentence.split('').map((char, i) => {
            let cls = styles.char;
            if (i < challenge.input.length) cls += ` ${styles.correct}`;
            else if (i === challenge.input.length) cls += ` ${styles.current}`;
            return (
              <span key={i} className={cls}>
                {char}
              </span>
            );
          })}
        </div>
        <div className={styles.input}>{challenge.input}</div>
      </div>

      <div className={styles.challengeKeyboard}>
        <OnScreenKeyboard
          layout={CHALLENGE_KEYBOARD_ROWS}
          onKeyPress={handleKeyPress}
        />
      </div>
    </div>
  );
}
