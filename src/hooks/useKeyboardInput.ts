import { useEffect } from 'react';
import { GameState, GameAction } from '@/lib/types';

export function useKeyboardInput(
  state: GameState,
  dispatch: React.Dispatch<GameAction>
) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (state.screen === 'gameover') return;

      // Challenge mode input
      if (state.challenge.active) {
        if (e.key === 'Backspace') {
          dispatch({ type: 'CHALLENGE_BACKSPACE' });
        } else if (e.key.length === 1) {
          dispatch({ type: 'CHALLENGE_TYPE', char: e.key });
        }
        return;
      }

      // Spacebar to pause/unpause
      if (e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
        dispatch({ type: 'TOGGLE_PAUSE' });
        return;
      }

      if (state.isPaused) return;

      if (e.key === 'Backspace') {
        dispatch({ type: 'BACKSPACE' });
      } else if (e.key === 'Enter') {
        dispatch({ type: 'CLEAR_INPUT' });
      } else if (e.key.length === 1 && /[a-z]/i.test(e.key)) {
        dispatch({ type: 'TYPE_CHAR', char: e.key });
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [state.screen, state.isPaused, state.challenge.active, dispatch]);
}
