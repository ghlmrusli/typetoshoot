import { Difficulty, Category } from './types';

export const DIFFICULTY_SETTINGS: Record<Difficulty, {
  spawnInterval: number;
  invaderSpeed: number;
  maxInvaders: number;
}> = {
  easy: { spawnInterval: 2500, invaderSpeed: 0.3, maxInvaders: 3 },
  medium: { spawnInterval: 1800, invaderSpeed: 0.5, maxInvaders: 5 },
  hard: { spawnInterval: 1200, invaderSpeed: 0.8, maxInvaders: 7 },
  superhard: { spawnInterval: 800, invaderSpeed: 1.2, maxInvaders: 10 },
};

export const SPEED_CAPS: Record<Difficulty, number> = {
  easy: 0.8,
  medium: 1.2,
  hard: 1.8,
  superhard: 2.5,
};

export const INTERVAL_CAPS: Record<Difficulty, number> = {
  easy: 1500,
  medium: 1000,
  hard: 700,
  superhard: 400,
};

export const DIFFICULTY_NAMES: Record<Difficulty, string> = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
  superhard: 'Superb',
};

export const DIFFICULTY_DESCRIPTIONS: Record<Difficulty, string> = {
  easy: 'Slow invaders, more time',
  medium: 'Balanced challenge',
  hard: 'Fast invaders, quick typing',
  superhard: 'Expert typers only!',
};

export const DIFFICULTY_ORDER: Difficulty[] = ['easy', 'medium', 'hard', 'superhard'];

export const CATEGORY_NAMES: Record<Category, string> = {
  all: 'All',
  animals: 'Animals',
  plants: 'Plants',
  science: 'Science',
};

export const CATEGORY_ORDER: Category[] = ['all', 'animals', 'plants', 'science'];

export const CHALLENGE_SENTENCES = [
  'Jovial zebras quickly vexed my big friend Chuck.',
  'Pack my box with five dozen liquor jugs.',
  'The quick brown fox jumps over the lazy dog.',
  'Crazy Fredrick bought many very exquisite opal jewels.',
  "A wizard's job is to vex chumps quickly in fog.",
  'Sympathizing would fix Quaker objectives justly.',
];

export const CHALLENGE_MILESTONES = [200, 300, 400, 500, 600, 700];

export const CHALLENGE_DURATION = 20;

export const PAUSE_MESSAGES = [
  'Take a deep breath',
  'Stretch your fingers',
  'Are you ready?',
  'You can do this!',
  'This is easy, right?',
];

export const KEYBOARD_ROWS = [
  ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
  ['z', 'x', 'c', 'v', 'b', 'n', 'm'],
];

export const CHALLENGE_KEYBOARD_ROWS = [
  ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
  ['z', 'x', 'c', 'v', 'b', 'n', 'm', 'backspace'],
  [' '],
];

export const BULLET_SPEED = 49.5;
export const BULLET_BEAM_LENGTH = 40;
export const UFO_CHANCE = 0.2;
export const FADE_START_PERCENT = 0.65;
export const FADE_END_PERCENT = 0.70;

// Multiplayer constants (must match server)
export const GAME_FIELD_WIDTH = 1000;
export const GAME_FIELD_HEIGHT = 1000;
export const GAME_DURATION_SECONDS = 120;
