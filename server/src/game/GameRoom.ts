import { Server } from 'socket.io';
import { GameRoomState, ServerPlayer } from './types';
import { ServerGameLoop } from './ServerGameLoop';
import { RoomState, PlayerInfo, ServerToClientEvents, ClientToServerEvents } from '../shared/protocol';
import {
  GAME_DURATION_SECONDS,
  COUNTDOWN_SECONDS,
} from '../shared/constants';

export class GameRoom {
  public state: GameRoomState;
  private gameLoop: ServerGameLoop | null = null;
  private countdownTimer: ReturnType<typeof setInterval> | null = null;

  constructor(
    roomCode: string,
    private io: Server<ClientToServerEvents, ServerToClientEvents>
  ) {
    this.state = {
      roomCode,
      phase: 'waiting',
      players: new Map(),
      invaders: new Map(),
      timeRemaining: GAME_DURATION_SECONDS,
      tickCount: 0,
      countdownValue: COUNTDOWN_SECONDS,
      createdAt: Date.now(),
      lastActivity: Date.now(),
    };
  }

  addPlayer(socketId: string, name: string): boolean {
    if (this.state.players.size >= 2) return false;
    if (this.state.phase !== 'waiting') return false;

    const player: ServerPlayer = {
      socketId,
      name,
      score: 0,
      ready: false,
      currentLock: null,
      typingProgress: '',
    };

    this.state.players.set(socketId, player);
    this.state.lastActivity = Date.now();
    this.broadcastRoomState();
    return true;
  }

  removePlayer(socketId: string): void {
    this.state.players.delete(socketId);
    this.state.lastActivity = Date.now();

    if (this.state.phase === 'playing' || this.state.phase === 'countdown') {
      // If game in progress and a player leaves, the remaining player wins
      const remaining = Array.from(this.state.players.keys());
      if (this.countdownTimer) {
        clearInterval(this.countdownTimer);
        this.countdownTimer = null;
      }
      if (this.gameLoop) {
        this.gameLoop.forceFinish(remaining.length > 0 ? remaining[0] : null);
        this.gameLoop = null;
      } else {
        this.state.phase = 'finished';
        const players = this.getPlayerInfoList();
        this.io.to(this.state.roomCode).emit('game:finished', {
          players,
          winnerId: remaining.length > 0 ? remaining[0] : null,
        });
      }
      // Notify about disconnection
      this.io.to(this.state.roomCode).emit('player:disconnected', {
        socketId,
        playerName: 'Opponent',
      });
    } else {
      this.broadcastRoomState();
    }
  }

  setReady(socketId: string): void {
    const player = this.state.players.get(socketId);
    if (!player) return;

    player.ready = true;
    this.state.lastActivity = Date.now();
    this.broadcastRoomState();

    // Check if all players ready (need exactly 2)
    if (this.state.players.size === 2) {
      const allReady = Array.from(this.state.players.values()).every(p => p.ready);
      if (allReady) {
        this.startCountdown();
      }
    }
  }

  private startCountdown(): void {
    this.state.phase = 'countdown';
    this.state.countdownValue = COUNTDOWN_SECONDS;
    this.broadcastRoomState();
    this.io.to(this.state.roomCode).emit('room:countdown', COUNTDOWN_SECONDS);

    this.countdownTimer = setInterval(() => {
      this.state.countdownValue--;

      if (this.state.countdownValue <= 0) {
        if (this.countdownTimer) {
          clearInterval(this.countdownTimer);
          this.countdownTimer = null;
        }
        this.startGame();
      } else {
        this.io.to(this.state.roomCode).emit('room:countdown', this.state.countdownValue);
      }
    }, 1000);
  }

  private startGame(): void {
    this.state.phase = 'playing';
    this.state.timeRemaining = GAME_DURATION_SECONDS;
    this.state.invaders.clear();
    this.state.tickCount = 0;

    // Reset player scores
    for (const player of this.state.players.values()) {
      player.score = 0;
      player.currentLock = null;
      player.typingProgress = '';
      player.ready = false;
    }

    this.gameLoop = new ServerGameLoop(this.state, this.io);
    this.gameLoop.start();
    this.broadcastRoomState();
  }

  handleTypingStart(socketId: string, invaderId: string): void {
    if (this.state.phase !== 'playing' || !this.gameLoop) return;

    const result = this.gameLoop.wordClaimManager.tryLock(
      invaderId,
      socketId,
      this.state.invaders,
      this.state.players
    );

    const socket = this.io.sockets.sockets.get(socketId);
    if (!socket) return;

    if (result.granted) {
      socket.emit('typing:lockGranted', { invaderId });
      // Notify opponent
      socket.to(this.state.roomCode).emit('typing:locked', { invaderId, bySocketId: socketId });
    } else {
      socket.emit('typing:lockDenied', { invaderId, reason: result.reason || 'Lock denied' });
    }
  }

  handleTypingChar(socketId: string, char: string): void {
    if (this.state.phase !== 'playing' || !this.gameLoop) return;

    const success = this.gameLoop.wordClaimManager.advanceTyping(
      socketId,
      char,
      this.state.invaders,
      this.state.players
    );

    if (!success) {
      // Lock was released due to wrong char
      const socket = this.io.sockets.sockets.get(socketId);
      if (socket) {
        socket.emit('typing:lockDenied', { invaderId: '', reason: 'Wrong character' });
      }
      // Notify opponent that lock is released
      const player = this.state.players.get(socketId);
      if (player) {
        // Lock already released by advanceTyping, but broadcast released event
        this.io.to(this.state.roomCode).emit('typing:released', { invaderId: '' });
      }
    }
  }

  handleTypingComplete(socketId: string, invaderId: string): void {
    if (this.state.phase !== 'playing' || !this.gameLoop) return;

    const result = this.gameLoop.wordClaimManager.tryComplete(
      invaderId,
      socketId,
      this.state.invaders,
      this.state.players
    );

    if (result.completed) {
      this.io.to(this.state.roomCode).emit('game:invaderKilled', {
        invaderId,
        killedBy: socketId,
        word: result.word,
        points: result.points,
      });
    }
  }

  handleTypingRelease(socketId: string): void {
    if (this.state.phase !== 'playing' || !this.gameLoop) return;

    const releasedId = this.gameLoop.wordClaimManager.releaseLock(
      socketId,
      this.state.invaders,
      this.state.players
    );

    if (releasedId) {
      this.io.to(this.state.roomCode).emit('typing:released', { invaderId: releasedId });
    }
  }

  resetForPlayAgain(socketId: string): void {
    const player = this.state.players.get(socketId);
    if (!player) return;

    player.ready = false;
    player.score = 0;
    player.currentLock = null;
    player.typingProgress = '';

    // If all players have requested play again, go back to waiting
    const allNotReady = Array.from(this.state.players.values()).every(p => !p.ready);
    if (allNotReady || this.state.phase === 'finished') {
      this.state.phase = 'waiting';
      this.state.invaders.clear();
      this.state.timeRemaining = GAME_DURATION_SECONDS;
      this.state.tickCount = 0;

      // Reset all players
      for (const p of this.state.players.values()) {
        p.score = 0;
        p.ready = false;
        p.currentLock = null;
        p.typingProgress = '';
      }

      this.broadcastRoomState();
    }
  }

  private broadcastRoomState(): void {
    const state: RoomState = {
      roomCode: this.state.roomCode,
      phase: this.state.phase,
      players: this.getPlayerInfoList(),
      countdownValue: this.state.countdownValue,
      timeRemaining: this.state.timeRemaining,
    };
    this.io.to(this.state.roomCode).emit('room:state', state);
  }

  private getPlayerInfoList(): PlayerInfo[] {
    return Array.from(this.state.players.values()).map(p => ({
      socketId: p.socketId,
      name: p.name,
      score: p.score,
      ready: p.ready,
    }));
  }

  get playerCount(): number {
    return this.state.players.size;
  }

  get isStale(): boolean {
    return Date.now() - this.state.lastActivity > 10 * 60 * 1000;
  }

  destroy(): void {
    if (this.gameLoop) {
      this.gameLoop.stop();
      this.gameLoop = null;
    }
    if (this.countdownTimer) {
      clearInterval(this.countdownTimer);
      this.countdownTimer = null;
    }
  }
}
