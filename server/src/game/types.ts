import { ServerInvader, PlayerInfo, RoomPhase } from '../shared/protocol';

export interface ServerPlayer extends PlayerInfo {
  currentLock: string | null; // invader id currently locked
  typingProgress: string; // chars typed so far for locked invader
}

export interface GameRoomState {
  roomCode: string;
  phase: RoomPhase;
  players: Map<string, ServerPlayer>;
  invaders: Map<string, ServerInvader>;
  timeRemaining: number;
  tickCount: number;
  countdownValue: number;
  createdAt: number;
  lastActivity: number;
}
