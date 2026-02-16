// Client-side copy of protocol types (mirrors server/src/shared/protocol.ts)

export interface ServerInvader {
  id: string;
  word: string;
  emoji: string;
  x: number;
  y: number;
  speedY: number;
  speedX: number;
  isUfo: boolean;
  lockedBy: string | null;
  typingProgress: number;
}

export interface PlayerInfo {
  socketId: string;
  name: string;
  score: number;
  ready: boolean;
}

export type RoomPhase = 'waiting' | 'countdown' | 'playing' | 'finished';

export interface RoomState {
  roomCode: string;
  phase: RoomPhase;
  players: PlayerInfo[];
  countdownValue: number;
  timeRemaining: number;
}

export interface GameFullState {
  invaders: ServerInvader[];
  players: PlayerInfo[];
  timeRemaining: number;
  phase: RoomPhase;
}

export interface GameDelta {
  invaders: Array<{ id: string; x: number; y: number }>;
  timeRemaining: number;
}

export interface InvaderKilled {
  invaderId: string;
  killedBy: string;
  word: string;
  points: number;
}

export interface ClientToServerEvents {
  'room:create': (data: { playerName: string }, callback: (response: { roomCode: string } | { error: string }) => void) => void;
  'room:join': (data: { roomCode: string; playerName: string }, callback: (response: { success: boolean } | { error: string }) => void) => void;
  'room:ready': () => void;
  'room:leave': () => void;
  'typing:start': (data: { invaderId: string }) => void;
  'typing:char': (data: { char: string }) => void;
  'typing:complete': (data: { invaderId: string }) => void;
  'typing:release': () => void;
  'room:playAgain': () => void;
}

export interface ServerToClientEvents {
  'room:state': (state: RoomState) => void;
  'room:countdown': (value: number) => void;
  'room:error': (message: string) => void;
  'game:fullState': (state: GameFullState) => void;
  'game:delta': (delta: GameDelta) => void;
  'game:invaderKilled': (data: InvaderKilled) => void;
  'game:finished': (data: { players: PlayerInfo[]; winnerId: string | null }) => void;
  'typing:lockGranted': (data: { invaderId: string }) => void;
  'typing:lockDenied': (data: { invaderId: string; reason: string }) => void;
  'typing:locked': (data: { invaderId: string; bySocketId: string }) => void;
  'typing:released': (data: { invaderId: string }) => void;
  'player:disconnected': (data: { socketId: string; playerName: string }) => void;
}
