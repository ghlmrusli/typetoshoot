import { ServerInvader } from '../shared/protocol';
import { ServerPlayer } from './types';

export class WordClaimManager {
  tryLock(
    invaderId: string,
    socketId: string,
    invaders: Map<string, ServerInvader>,
    players: Map<string, ServerPlayer>
  ): { granted: boolean; reason?: string } {
    const invader = invaders.get(invaderId);
    if (!invader) {
      return { granted: false, reason: 'Invader not found' };
    }

    if (invader.lockedBy !== null) {
      if (invader.lockedBy === socketId) {
        return { granted: true }; // Already locked by this player
      }
      return { granted: false, reason: 'Already claimed by opponent' };
    }

    const player = players.get(socketId);
    if (!player) {
      return { granted: false, reason: 'Player not found' };
    }

    // Release any existing lock this player has
    if (player.currentLock) {
      this.releaseLock(socketId, invaders, players);
    }

    // Grant the lock
    invader.lockedBy = socketId;
    invader.typingProgress = 1; // First char already typed
    player.currentLock = invaderId;
    player.typingProgress = invader.word[0];

    return { granted: true };
  }

  advanceTyping(
    socketId: string,
    char: string,
    invaders: Map<string, ServerInvader>,
    players: Map<string, ServerPlayer>
  ): boolean {
    const player = players.get(socketId);
    if (!player || !player.currentLock) return false;

    const invader = invaders.get(player.currentLock);
    if (!invader || invader.lockedBy !== socketId) return false;

    const expectedChar = invader.word[player.typingProgress.length];
    if (char.toLowerCase() !== expectedChar?.toLowerCase()) {
      // Wrong character - release the lock
      this.releaseLock(socketId, invaders, players);
      return false;
    }

    player.typingProgress += char.toLowerCase();
    invader.typingProgress = player.typingProgress.length;
    return true;
  }

  tryComplete(
    invaderId: string,
    socketId: string,
    invaders: Map<string, ServerInvader>,
    players: Map<string, ServerPlayer>
  ): { completed: boolean; points: number; word: string } {
    const invader = invaders.get(invaderId);
    const player = players.get(socketId);

    if (!invader || !player) {
      return { completed: false, points: 0, word: '' };
    }

    if (invader.lockedBy !== socketId) {
      return { completed: false, points: 0, word: '' };
    }

    if (player.typingProgress !== invader.word) {
      return { completed: false, points: 0, word: '' };
    }

    const points = invader.word.length;
    player.score += points;
    player.currentLock = null;
    player.typingProgress = '';

    // Remove invader
    invaders.delete(invaderId);

    return { completed: true, points, word: invader.word };
  }

  releaseLock(
    socketId: string,
    invaders: Map<string, ServerInvader>,
    players: Map<string, ServerPlayer>
  ): string | null {
    const player = players.get(socketId);
    if (!player || !player.currentLock) return null;

    const invaderId = player.currentLock;
    const invader = invaders.get(invaderId);

    if (invader && invader.lockedBy === socketId) {
      invader.lockedBy = null;
      invader.typingProgress = 0;
    }

    player.currentLock = null;
    player.typingProgress = '';

    return invaderId;
  }
}
