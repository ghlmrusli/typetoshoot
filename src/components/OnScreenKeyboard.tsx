import { useCallback, useRef } from 'react';
import styles from '@/styles/OnScreenKeyboard.module.css';

interface OnScreenKeyboardProps {
  layout: string[][];
  onKeyPress: (key: string) => void;
  activeKeys?: Set<string>;
  hideForChallenge?: boolean;
}

export default function OnScreenKeyboard({
  layout,
  onKeyPress,
  activeKeys,
  hideForChallenge,
}: OnScreenKeyboardProps) {
  const pressedRef = useRef<Set<string>>(new Set());

  const handleTouchStart = useCallback(
    (e: React.TouchEvent, key: string) => {
      e.preventDefault();
      pressedRef.current.add(key);
      // Force re-render via the DOM directly for perf
      const el = e.currentTarget as HTMLElement;
      el.classList.add(styles.pressed);
    },
    []
  );

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent, key: string) => {
      e.preventDefault();
      e.stopPropagation();
      pressedRef.current.delete(key);
      const el = e.currentTarget as HTMLElement;
      setTimeout(() => el.classList.remove(styles.pressed), 100);
      onKeyPress(key);
    },
    [onKeyPress]
  );

  const handleClick = useCallback(
    (e: React.MouseEvent, key: string) => {
      e.preventDefault();
      e.stopPropagation();
      onKeyPress(key);
    },
    [onKeyPress]
  );

  return (
    <div
      className={`${styles.keyboard} ${
        hideForChallenge ? styles.hideForChallenge : ''
      }`}
    >
      {layout.map((row, rowIdx) => (
        <div key={rowIdx} className={styles.row}>
          {row.map((key) => {
            const isActive = activeKeys?.has(key);
            const display =
              key === 'backspace' ? '\u232B' : key === ' ' ? 'Space' : key.toUpperCase();

            return (
              <button
                key={key}
                className={`${styles.key} ${isActive ? styles.active : ''}`}
                data-key={key}
                onTouchStart={(e) => handleTouchStart(e, key)}
                onTouchEnd={(e) => handleTouchEnd(e, key)}
                onClick={(e) => handleClick(e, key)}
              >
                {display}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
