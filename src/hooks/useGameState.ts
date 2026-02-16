import { useReducer } from 'react';
import { GameState, GameAction, InvaderState, BulletState } from '@/lib/types';
import {
  DIFFICULTY_SETTINGS,
  SPEED_CAPS,
  INTERVAL_CAPS,
  DIFFICULTY_ORDER,
  CATEGORY_ORDER,
  BULLET_SPEED,
  FADE_START_PERCENT,
  FADE_END_PERCENT,
} from '@/lib/constants';
import { wordCategories } from '@/lib/words';

const initialState: GameState = {
  screen: 'start',
  score: 0,
  highestScore: 0,
  currentInput: '',
  invaders: [],
  bullets: [],
  targetInvaderId: null,
  isPaused: false,
  difficulty: 'easy',
  category: 'all',
  lastSpawn: 0,
  spawnInterval: 2500,
  invaderSpeed: 0.3,
  maxInvaders: 3,
  challenge: { active: false, sentence: '', input: '', timeLeft: 20 },
  completedChallenges: [],
  rocketAngle: -45,
  inputError: false,
  scoreAnimation: null,
  displayScore: 0,
};

function createInvader(state: GameState): InvaderState {
  const words = wordCategories[state.category];
  const usedWords = state.invaders.filter((z) => !z.isDying).map((z) => z.word);
  const isUfo = Math.random() < 0.2;

  let word: string;
  let emoji: string;

  if (isUfo) {
    let word1: string, word2: string;
    do {
      word1 = words[Math.floor(Math.random() * words.length)];
      word2 = words[Math.floor(Math.random() * words.length)];
      word = word1 + word2;
    } while (usedWords.includes(word));
    emoji = '\u{1F6F8}'; // UFO
  } else {
    let availableWords = words.filter((w) => !usedWords.includes(w));
    if (availableWords.length === 0) availableWords = words;
    word = availableWords[Math.floor(Math.random() * availableWords.length)];
    emoji = '\u{1F47E}'; // Alien
  }

  return {
    id: `inv-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    word,
    emoji,
    x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth - 100 : 300),
    y: 0,
    speedY: state.invaderSpeed * (0.8 + Math.random() * 0.4),
    speedX: (Math.random() - 0.5) * 0.3,
    isDying: false,
    isUfo,
  };
}

function calcRocketAngle(
  targetInvader: InvaderState | undefined
): number {
  if (!targetInvader || targetInvader.isDying) return -45;

  const shipX = typeof window !== 'undefined' ? window.innerWidth / 2 : 400;
  const deltaX = (targetInvader.x + 25) - shipX;

  if (deltaX < -100) return -75;
  if (deltaX > 100) return -15;
  const t = (deltaX + 100) / 200;
  return -75 + t * 60;
}

function createBullet(
  invader: InvaderState,
  rocketAngle: number
): BulletState {
  const w = typeof window !== 'undefined' ? window.innerWidth : 800;
  const h = typeof window !== 'undefined' ? window.innerHeight : 600;

  // Rocket center (roughly)
  const gunCenterX = w / 2;
  const gunCenterY = h * 0.7 + 40;

  // Calculate tip position
  const tipDistance = 50;
  const tipAngle = rocketAngle - 45;
  const angleRad = (tipAngle * Math.PI) / 180;

  const startX = gunCenterX + tipDistance * Math.cos(angleRad);
  const startY = gunCenterY + tipDistance * Math.sin(angleRad);

  const targetX = invader.x + 25;
  const targetY = invader.y + 40;

  const distance = Math.sqrt(
    Math.pow(targetX - startX, 2) + Math.pow(targetY - startY, 2)
  );

  const angle = Math.atan2(targetY - startY, targetX - startX);

  return {
    id: `bul-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    x: startX,
    y: startY,
    targetX,
    targetY,
    speedX: ((targetX - startX) / distance) * BULLET_SPEED,
    speedY: ((targetY - startY) / distance) * BULLET_SPEED,
    distanceTraveled: 0,
    maxDistance: distance,
    angle: (angle * 180) / Math.PI + 90,
  };
}

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'START_GAME': {
      const settings = DIFFICULTY_SETTINGS[action.difficulty];
      return {
        ...initialState,
        screen: 'playing',
        difficulty: action.difficulty,
        category: state.category,
        spawnInterval: settings.spawnInterval,
        invaderSpeed: settings.invaderSpeed,
        maxInvaders: settings.maxInvaders,
        highestScore: state.highestScore,
      };
    }

    case 'TICK': {
      if (state.isPaused || state.screen !== 'playing') return state;

      let newInvaders = [...state.invaders];
      let newScore = state.score;
      let gameOver = false;
      let scoreAnim = state.scoreAnimation;

      // Update invader positions
      const winW = typeof window !== 'undefined' ? window.innerWidth : 800;
      const winH = typeof window !== 'undefined' ? window.innerHeight : 600;
      const fadeStart = winH * FADE_START_PERCENT;
      const fadeEnd = winH * FADE_END_PERCENT;

      const reachedBottom: string[] = [];

      newInvaders = newInvaders
        .map((inv) => {
          if (inv.isDying) return inv;
          let newX = inv.x + inv.speedX;
          let newSpeedX = inv.speedX;
          if (newX < 0 || newX > winW - 100) {
            newSpeedX *= -1;
            newX = inv.x + newSpeedX;
          }
          const newY = inv.y + inv.speedY;

          if (newY >= fadeEnd) {
            reachedBottom.push(inv.id);
          }

          return { ...inv, x: newX, y: newY, speedX: newSpeedX };
        })
        .filter((inv) => inv.y < winH + 100);

      // Handle invaders reaching bottom
      for (const id of reachedBottom) {
        const inv = newInvaders.find((i) => i.id === id);
        if (inv && !inv.isDying) {
          const penalty = inv.word.length;
          newScore = Math.max(0, newScore - penalty);
          scoreAnim = 'decrease';
          newInvaders = newInvaders.map((i) =>
            i.id === id ? { ...i, isDying: true, deathTime: Date.now() } : i
          );
          if (newScore === 0) gameOver = true;
        }
      }

      // Update bullets
      let newBullets = state.bullets
        .map((b) => {
          const newX = b.x + b.speedX;
          const newY = b.y + b.speedY;
          const newDist =
            b.distanceTraveled +
            Math.sqrt(b.speedX * b.speedX + b.speedY * b.speedY);
          return { ...b, x: newX, y: newY, distanceTraveled: newDist };
        })
        .filter((b) => b.distanceTraveled < b.maxDistance + 50);

      // Spawn logic
      let newLastSpawn = state.lastSpawn;
      if (
        action.timestamp - state.lastSpawn > state.spawnInterval &&
        newInvaders.filter((z) => !z.isDying).length < state.maxInvaders
      ) {
        const newInv = createInvader(state);
        newInvaders = [...newInvaders, newInv];
        newLastSpawn = action.timestamp;
      }

      // Progressive difficulty
      let newSpeed = state.invaderSpeed;
      let newInterval = state.spawnInterval;
      if (newScore > 0 && newScore % 50 === 0) {
        newSpeed = Math.min(
          state.invaderSpeed + 0.05,
          SPEED_CAPS[state.difficulty]
        );
        newInterval = Math.max(
          state.spawnInterval - 50,
          INTERVAL_CAPS[state.difficulty]
        );
      }

      // Remove dead invaders after animation time
      const now = Date.now();
      newInvaders = newInvaders.filter(
        (inv) => !inv.isDying || !inv.deathTime || now - inv.deathTime < 500
      );

      // Update rocket angle
      const target = state.targetInvaderId
        ? newInvaders.find((i) => i.id === state.targetInvaderId)
        : undefined;
      const rocketAngle = calcRocketAngle(target);

      // Clear target if it's dying
      let targetId = state.targetInvaderId;
      if (target && target.isDying) {
        targetId = null;
      }

      if (gameOver) {
        return {
          ...state,
          screen: 'gameover',
          score: newScore,
          invaders: newInvaders,
          bullets: newBullets,
          lastSpawn: newLastSpawn,
          invaderSpeed: newSpeed,
          spawnInterval: newInterval,
          rocketAngle,
          targetInvaderId: targetId,
          scoreAnimation: scoreAnim,
          displayScore: newScore,
        };
      }

      return {
        ...state,
        score: newScore,
        invaders: newInvaders,
        bullets: newBullets,
        lastSpawn: newLastSpawn,
        invaderSpeed: newSpeed,
        spawnInterval: newInterval,
        rocketAngle,
        targetInvaderId: targetId,
        scoreAnimation: scoreAnim,
      };
    }

    case 'TYPE_CHAR': {
      if (state.isPaused || state.screen !== 'playing') return state;

      const newInput = state.currentInput + action.char.toLowerCase();

      // Check if any invader word starts with this input
      const hasMatch = state.invaders.some(
        (inv) => !inv.isDying && inv.word.startsWith(newInput)
      );

      if (!hasMatch) {
        return {
          ...state,
          currentInput: '',
          targetInvaderId: null,
          rocketAngle: -45,
          inputError: true,
        };
      }

      // Check for complete match
      const matchedInvader = state.invaders.find(
        (inv) => !inv.isDying && inv.word === newInput
      );

      if (matchedInvader) {
        const points = matchedInvader.word.length;
        const newScore = state.score + points;
        const newHighest = Math.max(newScore, state.highestScore);

        // Create bullet
        const rocketAngle = calcRocketAngle(matchedInvader);
        const bullet = createBullet(matchedInvader, rocketAngle);

        // Mark invader as dying
        const newInvaders = state.invaders.map((inv) =>
          inv.id === matchedInvader.id
            ? { ...inv, isDying: true, deathTime: Date.now() }
            : inv
        );

        return {
          ...state,
          currentInput: '',
          score: newScore,
          highestScore: newHighest,
          invaders: newInvaders,
          bullets: [...state.bullets, bullet],
          targetInvaderId: null,
          rocketAngle: -45,
          scoreAnimation: 'increase',
          displayScore: state.score,
        };
      }

      // Partial match — find target
      const target = state.invaders.find(
        (inv) => !inv.isDying && inv.word.startsWith(newInput)
      );
      const targetId = target ? target.id : null;
      const rocketAngle = target ? calcRocketAngle(target) : -45;

      return {
        ...state,
        currentInput: newInput,
        targetInvaderId: targetId,
        rocketAngle,
      };
    }

    case 'BACKSPACE': {
      if (state.isPaused || state.screen !== 'playing') return state;
      const newInput = state.currentInput.slice(0, -1);

      if (newInput.length > 0) {
        const target = state.invaders.find(
          (inv) => !inv.isDying && inv.word.startsWith(newInput)
        );
        const targetId = target ? target.id : null;
        const rocketAngle = target ? calcRocketAngle(target) : -45;
        return {
          ...state,
          currentInput: newInput,
          targetInvaderId: targetId,
          rocketAngle,
        };
      }

      return {
        ...state,
        currentInput: '',
        targetInvaderId: null,
        rocketAngle: -45,
      };
    }

    case 'CLEAR_INPUT':
      return {
        ...state,
        currentInput: '',
        targetInvaderId: null,
        rocketAngle: -45,
      };

    case 'TOGGLE_PAUSE':
      if (state.screen !== 'playing' || state.challenge.active) return state;
      return { ...state, isPaused: !state.isPaused };

    case 'RESTART':
      return {
        ...initialState,
        highestScore: state.highestScore,
        category: state.category,
      };

    case 'CYCLE_DIFFICULTY': {
      const idx = DIFFICULTY_ORDER.indexOf(state.difficulty);
      const next = DIFFICULTY_ORDER[(idx + 1) % DIFFICULTY_ORDER.length];
      const settings = DIFFICULTY_SETTINGS[next];
      return {
        ...state,
        difficulty: next,
        spawnInterval: settings.spawnInterval,
        invaderSpeed: settings.invaderSpeed,
        maxInvaders: settings.maxInvaders,
      };
    }

    case 'CYCLE_CATEGORY': {
      const idx = CATEGORY_ORDER.indexOf(state.category);
      const next = CATEGORY_ORDER[(idx + 1) % CATEGORY_ORDER.length];
      return { ...state, category: next };
    }

    case 'START_CHALLENGE':
      return {
        ...state,
        isPaused: true,
        challenge: {
          active: true,
          sentence: action.sentence,
          input: '',
          timeLeft: 20,
        },
        currentInput: '',
      };

    case 'CHALLENGE_TYPE': {
      const ch = state.challenge;
      const nextChar = ch.sentence[ch.input.length];
      if (action.char.toLowerCase() === nextChar?.toLowerCase()) {
        const newInput = ch.input + nextChar;
        if (newInput === ch.sentence) {
          // Challenge completed
          return {
            ...state,
            score: state.score + 50,
            highestScore: Math.max(state.score + 50, state.highestScore),
            displayScore: state.score,
            scoreAnimation: 'increase',
            isPaused: false,
            challenge: { active: false, sentence: '', input: '', timeLeft: 20 },
            currentInput: '',
          };
        }
        return {
          ...state,
          challenge: { ...ch, input: newInput },
        };
      }
      return state;
    }

    case 'CHALLENGE_BACKSPACE':
      return {
        ...state,
        challenge: {
          ...state.challenge,
          input: state.challenge.input.slice(0, -1),
        },
      };

    case 'CHALLENGE_TICK': {
      const newTime = state.challenge.timeLeft - 1;
      if (newTime <= 0) {
        // Challenge failed
        const newScore = Math.max(0, state.score - 50);
        return {
          ...state,
          score: newScore,
          displayScore: state.score,
          scoreAnimation: 'decrease',
          isPaused: false,
          challenge: { active: false, sentence: '', input: '', timeLeft: 20 },
          currentInput: '',
          screen: newScore === 0 ? 'gameover' : state.screen,
        };
      }
      return {
        ...state,
        challenge: { ...state.challenge, timeLeft: newTime },
      };
    }

    case 'GAME_OVER':
      return { ...state, screen: 'gameover' };

    case 'CLEAR_INPUT_ERROR':
      return { ...state, inputError: false };

    case 'CLEAR_SCORE_ANIMATION':
      return { ...state, scoreAnimation: null };

    case 'SET_DISPLAY_SCORE':
      return { ...state, displayScore: action.score };

    default:
      return state;
  }
}

export function useGameState() {
  return useReducer(gameReducer, initialState);
}

export { createInvader, calcRocketAngle, createBullet };
