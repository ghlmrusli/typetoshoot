import { useEffect, useRef } from 'react';
import { GameState, GameAction } from '@/lib/types';
import { DIFFICULTY_NAMES, CATEGORY_NAMES } from '@/lib/constants';
import styles from '@/styles/TopBar.module.css';

interface TopBarProps {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
}

export default function TopBar({ state, dispatch }: TopBarProps) {
  const scoreRef = useRef<HTMLSpanElement>(null);
  const animFrameRef = useRef<number>(0);
  const prevScoreRef = useRef(state.score);

  // Animate score counter
  useEffect(() => {
    if (state.scoreAnimation && scoreRef.current) {
      const start = prevScoreRef.current;
      const end = state.score;
      const duration = 400;
      let startTs: number | null = null;

      const step = (ts: number) => {
        if (!startTs) startTs = ts;
        const progress = Math.min((ts - startTs) / duration, 1);
        const value = Math.floor(progress * (end - start) + start);
        if (scoreRef.current) scoreRef.current.textContent = String(value);
        if (progress < 1) {
          animFrameRef.current = requestAnimationFrame(step);
        } else {
          if (scoreRef.current) scoreRef.current.textContent = String(end);
          prevScoreRef.current = end;
          dispatch({ type: 'CLEAR_SCORE_ANIMATION' });
        }
      };
      animFrameRef.current = requestAnimationFrame(step);
      return () => cancelAnimationFrame(animFrameRef.current);
    } else {
      prevScoreRef.current = state.score;
    }
  }, [state.scoreAnimation, state.score, dispatch]);

  return (
    <div className={styles.topbar}>
      <div className={styles.leftControls}>
        <div className={styles.score}>
          Score:{' '}
          <span
            ref={scoreRef}
            className={`${styles.scoreValue} ${
              state.scoreAnimation === 'increase' ? styles.scoreIncrease : ''
            } ${state.scoreAnimation === 'decrease' ? styles.scoreDecrease : ''}`}
          >
            {state.score}
          </span>
        </div>
        <div
          className={styles.display}
          onClick={() => dispatch({ type: 'CYCLE_DIFFICULTY' })}
        >
          {DIFFICULTY_NAMES[state.difficulty]}
        </div>
        <div
          className={styles.display}
          onClick={() => dispatch({ type: 'CYCLE_CATEGORY' })}
        >
          {CATEGORY_NAMES[state.category]}
        </div>
      </div>
      <div className={styles.rightControls}>
        <button
          className={`${styles.btn} ${styles.pauseBtn}`}
          onClick={() => dispatch({ type: 'TOGGLE_PAUSE' })}
        >
          <span className={`material-symbols-outlined ${styles.materialIcon}`}>
            {state.isPaused ? 'play_arrow' : 'pause'}
          </span>
        </button>
        <button
          className={styles.btn}
          onClick={() => dispatch({ type: 'START_GAME', difficulty: state.difficulty })}
        >
          <span className={`material-symbols-outlined ${styles.materialIcon}`}>
            refresh
          </span>
        </button>
      </div>
    </div>
  );
}
