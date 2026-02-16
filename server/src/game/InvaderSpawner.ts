import { ServerInvader } from '../shared/protocol';
import {
  GAME_FIELD_WIDTH,
  INVADER_SPEED,
  INVADER_SPEED_VARIANCE,
  INVADER_HORIZONTAL_SPEED,
  UFO_CHANCE,
} from '../shared/constants';

// Word lists (subset for multiplayer - mixed category)
const WORDS = [
  'dog', 'cat', 'lion', 'tiger', 'bear', 'wolf', 'fox', 'deer',
  'rabbit', 'mouse', 'snake', 'frog', 'fish', 'bird', 'eagle',
  'hawk', 'owl', 'crow', 'duck', 'horse', 'cow', 'pig', 'sheep',
  'goat', 'chicken', 'elephant', 'rhino', 'hippo', 'monkey', 'whale',
  'rose', 'tulip', 'daisy', 'lily', 'orchid', 'violet', 'jasmine',
  'oak', 'pine', 'maple', 'birch', 'willow', 'palm', 'bamboo',
  'fern', 'moss', 'ivy', 'grass', 'wheat', 'rice', 'corn',
  'house', 'tree', 'water', 'fire', 'earth', 'wind', 'stone',
  'wood', 'glass', 'paper', 'book', 'pen', 'desk', 'chair',
  'door', 'window', 'wall', 'floor', 'roof', 'garden', 'park',
  'bridge', 'river', 'lake', 'ocean', 'mountain', 'valley', 'forest',
  'cloud', 'rain', 'snow', 'sun', 'moon', 'star', 'night', 'day',
  'atom', 'cell', 'gene', 'orbit', 'force', 'wave', 'laser', 'plasma',
  'coral', 'pearl', 'amber', 'crystal', 'prism', 'comet', 'nebula',
];

let idCounter = 0;

export class InvaderSpawner {
  private usedWords: Set<string> = new Set();

  spawn(existingInvaders: Map<string, ServerInvader>): ServerInvader {
    const activeWords = new Set<string>();
    for (const inv of existingInvaders.values()) {
      activeWords.add(inv.word);
    }

    const isUfo = Math.random() < UFO_CHANCE;
    let word: string;
    let emoji: string;

    if (isUfo) {
      let w1: string, w2: string;
      do {
        w1 = WORDS[Math.floor(Math.random() * WORDS.length)];
        w2 = WORDS[Math.floor(Math.random() * WORDS.length)];
        word = w1 + w2;
      } while (activeWords.has(word));
      emoji = '\u{1F6F8}';
    } else {
      const available = WORDS.filter(w => !activeWords.has(w));
      const pool = available.length > 0 ? available : WORDS;
      word = pool[Math.floor(Math.random() * pool.length)];
      emoji = '\u{1F47E}';
    }

    idCounter++;
    const id = `inv-${Date.now()}-${idCounter}`;
    const margin = 100; // keep away from edges
    const x = margin + Math.random() * (GAME_FIELD_WIDTH - 2 * margin);

    return {
      id,
      word,
      emoji,
      x,
      y: 0,
      speedY: INVADER_SPEED * (1 - INVADER_SPEED_VARIANCE / 2 + Math.random() * INVADER_SPEED_VARIANCE),
      speedX: (Math.random() - 0.5) * INVADER_HORIZONTAL_SPEED * 2,
      isUfo,
      lockedBy: null,
      typingProgress: 0,
    };
  }

  reset(): void {
    this.usedWords.clear();
  }
}
