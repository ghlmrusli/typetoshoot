export type Difficulty = 'easy' | 'medium' | 'hard' | 'superhard';
export type Category = 'all' | 'animals' | 'plants' | 'science';
export type Screen = 'start' | 'playing' | 'gameover';
export type GameMode = 'singleplayer' | 'multiplayer';
export type MultiplayerScreen = 'lobby' | 'waiting' | 'countdown' | 'playing' | 'results';

export interface InvaderState {
  id: string;
  word: string;
  emoji: string;
  x: number;
  y: number;
  speedY: number;
  speedX: number;
  isDying: boolean;
  isUfo: boolean;
  deathTime?: number;
}

export interface BulletState {
  id: string;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  speedX: number;
  speedY: number;
  distanceTraveled: number;
  maxDistance: number;
  angle: number;
}

export interface ChallengeState {
  active: boolean;
  sentence: string;
  input: string;
  timeLeft: number;
}

export interface GameState {
  screen: Screen;
  score: number;
  highestScore: number;
  currentInput: string;
  invaders: InvaderState[];
  bullets: BulletState[];
  targetInvaderId: string | null;
  isPaused: boolean;
  difficulty: Difficulty;
  category: Category;
  lastSpawn: number;
  spawnInterval: number;
  invaderSpeed: number;
  maxInvaders: number;
  challenge: ChallengeState;
  completedChallenges: number[];
  rocketAngle: number;
  inputError: boolean;
  scoreAnimation: 'increase' | 'decrease' | null;
  displayScore: number;
}

export type GameAction =
  | { type: 'START_GAME'; difficulty: Difficulty }
  | { type: 'TICK'; timestamp: number }
  | { type: 'SPAWN_INVADER'; invader: InvaderState }
  | { type: 'TYPE_CHAR'; char: string }
  | { type: 'BACKSPACE' }
  | { type: 'CLEAR_INPUT' }
  | { type: 'TOGGLE_PAUSE' }
  | { type: 'GAME_OVER' }
  | { type: 'RESTART' }
  | { type: 'CYCLE_DIFFICULTY' }
  | { type: 'CYCLE_CATEGORY' }
  | { type: 'SHOOT'; invaderId: string; bulletId: string; bullet: BulletState }
  | { type: 'INVADER_REACHED_BOTTOM'; invaderId: string }
  | { type: 'REMOVE_INVADER'; invaderId: string }
  | { type: 'REMOVE_BULLET'; bulletId: string }
  | { type: 'START_CHALLENGE'; sentence: string }
  | { type: 'CHALLENGE_TYPE'; char: string }
  | { type: 'CHALLENGE_BACKSPACE' }
  | { type: 'COMPLETE_CHALLENGE' }
  | { type: 'FAIL_CHALLENGE' }
  | { type: 'CHALLENGE_TICK' }
  | { type: 'CLEAR_INPUT_ERROR' }
  | { type: 'CLEAR_SCORE_ANIMATION' }
  | { type: 'SET_DISPLAY_SCORE'; score: number };
