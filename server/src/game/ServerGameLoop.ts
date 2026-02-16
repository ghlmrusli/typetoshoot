import { Server } from 'socket.io';
import {
  TICK_INTERVAL,
  GAME_FIELD_WIDTH,
  GAME_FIELD_HEIGHT,
  FULL_STATE_INTERVAL,
  MAX_INVADERS,
  SPAWN_INTERVAL_MS,
} from '../shared/constants';
import { ServerInvader, GameFullState, GameDelta, PlayerInfo, ServerToClientEvents, ClientToServerEvents } from '../shared/protocol';
import { GameRoomState, ServerPlayer } from './types';
import { InvaderSpawner } from './InvaderSpawner';
import { WordClaimManager } from './WordClaimManager';

export class ServerGameLoop {
  private interval: ReturnType<typeof setInterval> | null = null;
  private spawner: InvaderSpawner;
  private lastSpawnTime: number = 0;
  public wordClaimManager: WordClaimManager;

  constructor(
    private room: GameRoomState,
    private io: Server<ClientToServerEvents, ServerToClientEvents>
  ) {
    this.spawner = new InvaderSpawner();
    this.wordClaimManager = new WordClaimManager();
  }

  start(): void {
    this.lastSpawnTime = Date.now();
    this.spawner.reset();

    // Spawn initial invaders
    for (let i = 0; i < 3; i++) {
      const inv = this.spawner.spawn(this.room.invaders);
      inv.y = 50 + Math.random() * 200; // Stagger initial positions
      this.room.invaders.set(inv.id, inv);
    }

    this.interval = setInterval(() => this.tick(), TICK_INTERVAL);
  }

  stop(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  private tick(): void {
    if (this.room.phase !== 'playing') {
      this.stop();
      return;
    }

    this.room.tickCount++;
    this.room.lastActivity = Date.now();

    // Update time remaining
    this.room.timeRemaining -= TICK_INTERVAL / 1000;
    if (this.room.timeRemaining <= 0) {
      this.room.timeRemaining = 0;
      this.finishGame();
      return;
    }

    // Move invaders
    const toRemove: string[] = [];
    for (const [id, inv] of this.room.invaders) {
      inv.y += inv.speedY;
      inv.x += inv.speedX;

      // Bounce off walls
      if (inv.x < 50 || inv.x > GAME_FIELD_WIDTH - 50) {
        inv.speedX *= -1;
        inv.x = Math.max(50, Math.min(GAME_FIELD_WIDTH - 50, inv.x));
      }

      // Remove if past bottom (no penalty in MP - just remove)
      if (inv.y > GAME_FIELD_HEIGHT + 50) {
        // Release any lock on this invader
        if (inv.lockedBy) {
          const player = this.room.players.get(inv.lockedBy);
          if (player && player.currentLock === id) {
            player.currentLock = null;
            player.typingProgress = '';
          }
        }
        toRemove.push(id);
      }
    }

    for (const id of toRemove) {
      this.room.invaders.delete(id);
    }

    // Spawn new invaders
    const now = Date.now();
    const activeCount = this.room.invaders.size;
    if (now - this.lastSpawnTime > SPAWN_INTERVAL_MS && activeCount < MAX_INVADERS) {
      const inv = this.spawner.spawn(this.room.invaders);
      this.room.invaders.set(inv.id, inv);
      this.lastSpawnTime = now;
    }

    // Broadcast state
    if (this.room.tickCount % FULL_STATE_INTERVAL === 0) {
      this.broadcastFullState();
    } else {
      this.broadcastDelta();
    }
  }

  private broadcastFullState(): void {
    const state: GameFullState = {
      invaders: Array.from(this.room.invaders.values()),
      players: this.getPlayerInfoList(),
      timeRemaining: this.room.timeRemaining,
      phase: this.room.phase,
    };
    this.io.to(this.room.roomCode).emit('game:fullState', state);
  }

  private broadcastDelta(): void {
    const delta: GameDelta = {
      invaders: Array.from(this.room.invaders.values()).map(inv => ({
        id: inv.id,
        x: inv.x,
        y: inv.y,
      })),
      timeRemaining: this.room.timeRemaining,
    };
    this.io.to(this.room.roomCode).emit('game:delta', delta);
  }

  private finishGame(): void {
    this.room.phase = 'finished';
    this.stop();

    const players = this.getPlayerInfoList();
    let winnerId: string | null = null;

    if (players.length === 2) {
      if (players[0].score > players[1].score) {
        winnerId = players[0].socketId;
      } else if (players[1].score > players[0].score) {
        winnerId = players[1].socketId;
      }
      // null = tie
    } else if (players.length === 1) {
      winnerId = players[0].socketId;
    }

    this.io.to(this.room.roomCode).emit('game:finished', { players, winnerId });
  }

  forceFinish(winnerId: string | null): void {
    this.room.phase = 'finished';
    this.stop();
    const players = this.getPlayerInfoList();
    this.io.to(this.room.roomCode).emit('game:finished', { players, winnerId });
  }

  private getPlayerInfoList(): PlayerInfo[] {
    return Array.from(this.room.players.values()).map(p => ({
      socketId: p.socketId,
      name: p.name,
      score: p.score,
      ready: p.ready,
    }));
  }
}
