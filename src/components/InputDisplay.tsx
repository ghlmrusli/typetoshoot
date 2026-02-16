import { InvaderState } from '@/lib/types';
import styles from '@/styles/InputDisplay.module.css';

interface InputDisplayProps {
  currentInput: string;
  targetInvader: InvaderState | undefined;
  inputError: boolean;
}

export default function InputDisplay({
  currentInput,
  targetInvader,
  inputError,
}: InputDisplayProps) {
  const hasInput = currentInput.length > 0;

  return (
    <div
      className={`${styles.inputDisplay} ${hasInput ? styles.active : ''} ${
        !hasInput ? styles.empty : ''
      } ${inputError ? styles.error : ''}`}
    >
      {hasInput && targetInvader ? (
        targetInvader.word.split('').map((char, i) => (
          <span
            key={i}
            className={i < currentInput.length ? styles.typed : styles.untyped}
          >
            {char}
          </span>
        ))
      ) : hasInput ? (
        <span className={styles.typed}>{currentInput}</span>
      ) : null}
    </div>
  );
}
