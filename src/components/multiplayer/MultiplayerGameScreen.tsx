'use client';

import { useMemo, useCallback, useRef, useState, useEffect } from 'react';
import { ServerInvader, PlayerInfo } from '@/lib/socketEvents';
import { InvaderState } from '@/lib/types';
import { KEYBOARD_ROWS } from '@/lib/constants';
import { normalizedToScreenX, normalizedToScreenY } from '@/lib/coordinates';
import Invader from '../Invader';
import Rocket from '../Rocket';
import InputDisplay from '../InputDisplay';
import OnScreenKeyboard from '../OnScreenKeyboard';
import MultiplayerTopBar from './MultiplayerTopBar';
import styles from '@/styles/MultiplayerGameScreen.module.css';

interface MultiplayerGameScreenProps {
  invaders: ServerInvader[];
  players: PlayerInfo[];
  timeRemaining: number;
  mySocketId: string | null;
  currentInput: string;
  inputError: boolean;
  myLockedInvaderId: string | null;
  onKeyPress: (key: string) => void;
}

export default function MultiplayerGameScreen({
  invaders,
  players,
  timeRemaining,
  mySocketId,
  currentInput,
  inputError,
  myLockedInvaderId,
  onKeyPress,
}: MultiplayerGameScreenProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [screenSize, setScreenSize] = useState({ width: 800, height: 600 });

  useEffect(() => {
    const update = () => {
      setScreenSize({ width: window.innerWidth, height: window.innerHeight });
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  // Convert server invaders to screen-space InvaderState for rendering
  const screenInvaders: (InvaderState & { lockedBy: string | null })[] = useMemo(() => {
    // Use 70% of screen height for the play area (topSide)
    const playAreaHeight = screenSize.height * 0.7;
    return invaders.map(inv => ({
      id: inv.id,
      word: inv.word,
      emoji: inv.emoji,
      x: normalizedToScreenX(inv.x, screenSize.width) - 30, // offset for centering
      y: normalizedToScreenY(inv.y, playAreaHeight),
      speedY: inv.speedY,
      speedX: inv.speedX,
      isDying: false,
      isUfo: inv.isUfo,
      lockedBy: inv.lockedBy,
    }));
  }, [invaders, screenSize]);

  // Find the invader I'm targeting
  const targetInvader = myLockedInvaderId
    ? screenInvaders.find(inv => inv.id === myLockedInvaderId)
    : undefined;

  const activeKeys = useMemo(() => {
    const keys = new Set<string>();
    if (currentInput) {
      for (const ch of currentInput) {
        keys.add(ch);
      }
    }
    return keys;
  }, [currentInput]);

  return (
    <>
      <MultiplayerTopBar
        players={players}
        timeRemaining={timeRemaining}
        mySocketId={mySocketId}
      />
      <div className={styles.gameContainer} ref={containerRef}>
        <div className={styles.topSide}>
          {screenInvaders.map((inv) => (
            <Invader
              key={inv.id}
              invader={inv}
              currentInput={inv.id === myLockedInvaderId ? currentInput : ''}
              isTarget={inv.id === myLockedInvaderId}
              lockedBy={inv.lockedBy}
              mySocketId={mySocketId}
            />
          ))}
        </div>
        <div className={styles.bottomSide}>
          <div className={styles.rocketArea}>
            <div className={styles.rocketLeft}>
              <Rocket angle={-45} />
            </div>
            <div className={styles.rocketRight}>
              <Rocket angle={-45} />
            </div>
          </div>
          <InputDisplay
            currentInput={currentInput}
            targetInvader={targetInvader}
            inputError={inputError}
          />
          <OnScreenKeyboard
            layout={KEYBOARD_ROWS}
            onKeyPress={onKeyPress}
            activeKeys={activeKeys}
            hideForChallenge={false}
          />
        </div>
      </div>
    </>
  );
}
