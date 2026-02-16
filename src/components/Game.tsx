'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useGameState } from '@/hooks/useGameState';
import { useGameLoop } from '@/hooks/useGameLoop';
import { useKeyboardInput } from '@/hooks/useKeyboardInput';
import { useAudio } from '@/hooks/useAudio';
import { CHALLENGE_MILESTONES, CHALLENGE_SENTENCES } from '@/lib/constants';
import { GameMode } from '@/lib/types';
import StartScreen from './StartScreen';
import GameScreen from './GameScreen';
import GameOverScreen from './GameOverScreen';
import MultiplayerGame from './multiplayer/MultiplayerGame';

export default function Game() {
  const [gameMode, setGameMode] = useState<GameMode | null>(null);
  const [state, dispatch] = useGameState();
  const { playErrorSound, playSuccessSound, playShootSound } = useAudio();
  const prevScoreRef = useRef(state.score);
  const prevBulletCountRef = useRef(state.bullets.length);
  const prevInputErrorRef = useRef(state.inputError);
  const challengeCheckRef = useRef(state.completedChallenges);

  // Wire keyboard (only for SP)
  useKeyboardInput(state, dispatch);

  // Game loop (only for SP)
  useGameLoop(
    useCallback(
      (timestamp: number) => {
        dispatch({ type: 'TICK', timestamp });
      },
      [dispatch]
    ),
    state.screen === 'playing' && !state.isPaused
  );

  // Sound effects: shoot
  useEffect(() => {
    if (state.bullets.length > prevBulletCountRef.current) {
      playShootSound();
    }
    prevBulletCountRef.current = state.bullets.length;
  }, [state.bullets.length, playShootSound]);

  // Sound effects: error
  useEffect(() => {
    if (state.inputError && !prevInputErrorRef.current) {
      playErrorSound();
      const timeout = setTimeout(() => dispatch({ type: 'CLEAR_INPUT_ERROR' }), 300);
      return () => clearTimeout(timeout);
    }
    prevInputErrorRef.current = state.inputError;
  }, [state.inputError, playErrorSound, dispatch]);

  // Sound effects: success
  useEffect(() => {
    if (state.scoreAnimation === 'increase' && state.score > prevScoreRef.current) {
      const diff = state.score - prevScoreRef.current;
      if (diff !== 50) {
        playSuccessSound();
      }
    }
    prevScoreRef.current = state.score;
  }, [state.score, state.scoreAnimation, playSuccessSound]);

  // Challenge milestone detection
  useEffect(() => {
    if (state.screen !== 'playing' || state.challenge.active) return;

    for (const milestone of CHALLENGE_MILESTONES) {
      if (
        state.score >= milestone &&
        !state.completedChallenges.includes(milestone) &&
        !challengeCheckRef.current.includes(milestone)
      ) {
        challengeCheckRef.current = [...state.completedChallenges, milestone];
        const sentence =
          CHALLENGE_SENTENCES[
            Math.floor(Math.random() * CHALLENGE_SENTENCES.length)
          ];
        dispatch({ type: 'START_CHALLENGE', sentence });
        break;
      }
    }
  }, [state.score, state.screen, state.challenge.active, state.completedChallenges, dispatch]);

  // --- Multiplayer mode ---
  if (gameMode === 'multiplayer') {
    return (
      <MultiplayerGame
        onBack={() => setGameMode(null)}
      />
    );
  }

  // --- Single-player mode ---
  if (state.screen === 'start') {
    return (
      <StartScreen
        onSelectDifficulty={(difficulty) => {
          setGameMode('singleplayer');
          dispatch({ type: 'START_GAME', difficulty });
        }}
        onMultiplayer={() => setGameMode('multiplayer')}
      />
    );
  }

  if (state.screen === 'gameover') {
    return (
      <>
        <GameScreen state={state} dispatch={dispatch} />
        <GameOverScreen
          highestScore={state.highestScore}
          onRestart={() => dispatch({ type: 'RESTART' })}
        />
      </>
    );
  }

  return <GameScreen state={state} dispatch={dispatch} />;
}
