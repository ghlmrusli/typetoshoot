import { useCallback, useMemo } from 'react';
import { GameState, GameAction } from '@/lib/types';
import { KEYBOARD_ROWS } from '@/lib/constants';
import TopBar from './TopBar';
import Invader from './Invader';
import Bullet from './Bullet';
import Rocket from './Rocket';
import InputDisplay from './InputDisplay';
import OnScreenKeyboard from './OnScreenKeyboard';
import PauseOverlay from './PauseOverlay';
import ChallengeScreen from './ChallengeScreen';
import styles from '@/styles/GameScreen.module.css';

interface GameScreenProps {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
}

export default function GameScreen({ state, dispatch }: GameScreenProps) {
  const targetInvader = state.targetInvaderId
    ? state.invaders.find((i) => i.id === state.targetInvaderId)
    : undefined;

  const activeKeys = useMemo(() => {
    const keys = new Set<string>();
    if (state.currentInput && targetInvader && !targetInvader.isDying) {
      for (let i = 0; i < state.currentInput.length; i++) {
        keys.add(state.currentInput[i]);
      }
    }
    return keys;
  }, [state.currentInput, targetInvader]);

  const handleKeyPress = useCallback(
    (key: string) => {
      if (state.screen !== 'playing' || state.isPaused) return;

      if (key === 'backspace') {
        dispatch({ type: 'BACKSPACE' });
      } else if (key.length === 1 && /[a-z]/i.test(key)) {
        dispatch({ type: 'TYPE_CHAR', char: key });
      }
    },
    [state.screen, state.isPaused, dispatch]
  );

  const handleGameAreaClick = useCallback(
    (e: React.MouseEvent) => {
      // Don't toggle pause if clicking on buttons/keyboard/topbar
      const target = e.target as HTMLElement;
      if (target.closest('button, [class*="keyboard"], [class*="topbar"]')) {
        return;
      }
      dispatch({ type: 'TOGGLE_PAUSE' });
    },
    [dispatch]
  );

  return (
    <>
      <TopBar state={state} dispatch={dispatch} />
      <div
        className={styles.gameContainer}
        onClick={handleGameAreaClick}
        tabIndex={0}
      >
        <div className={styles.topSide}>
          {state.invaders.map((invader) => (
            <Invader
              key={invader.id}
              invader={invader}
              currentInput={state.currentInput}
              isTarget={invader.id === state.targetInvaderId}
            />
          ))}
          {state.bullets.map((bullet) => (
            <Bullet key={bullet.id} bullet={bullet} />
          ))}
        </div>
        <div className={styles.bottomSide}>
          <Rocket angle={state.rocketAngle} />
          <InputDisplay
            currentInput={state.currentInput}
            targetInvader={targetInvader}
            inputError={state.inputError}
          />
          <OnScreenKeyboard
            layout={KEYBOARD_ROWS}
            onKeyPress={handleKeyPress}
            activeKeys={activeKeys}
            hideForChallenge={state.challenge.active}
          />
        </div>
      </div>

      {state.isPaused && !state.challenge.active && (
        <PauseOverlay onResume={() => dispatch({ type: 'TOGGLE_PAUSE' })} />
      )}

      {state.challenge.active && (
        <ChallengeScreen challenge={state.challenge} dispatch={dispatch} />
      )}
    </>
  );
}
