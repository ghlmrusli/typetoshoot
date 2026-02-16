import { Server } from 'socket.io';
import { GameRoom } from '../game/GameRoom';
import { ROOM_CODE_LENGTH, ROOM_CLEANUP_MS } from '../shared/constants';
import { ServerToClientEvents, ClientToServerEvents } from '../shared/protocol';

const rooms = new Map<string, GameRoom>();
const playerToRoom = new Map<string, string>(); // socketId -> roomCode

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude confusing chars
  let code: string;
  do {
    code = '';
    for (let i = 0; i < ROOM_CODE_LENGTH; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
  } while (rooms.has(code));
  return code;
}

export function createRoom(io: Server<ClientToServerEvents, ServerToClientEvents>): GameRoom {
  const code = generateRoomCode();
  const room = new GameRoom(code, io);
  rooms.set(code, room);
  return room;
}

export function getRoom(roomCode: string): GameRoom | undefined {
  return rooms.get(roomCode.toUpperCase());
}

export function deleteRoom(roomCode: string): void {
  const room = rooms.get(roomCode);
  if (room) {
    room.destroy();
    rooms.delete(roomCode);
  }
}

export function setPlayerRoom(socketId: string, roomCode: string): void {
  playerToRoom.set(socketId, roomCode);
}

export function getPlayerRoom(socketId: string): string | undefined {
  return playerToRoom.get(socketId);
}

export function removePlayerFromRoom(socketId: string): void {
  const roomCode = playerToRoom.get(socketId);
  if (!roomCode) return;

  playerToRoom.delete(socketId);
  const room = rooms.get(roomCode);
  if (room) {
    room.removePlayer(socketId);
    // Clean up empty rooms
    if (room.playerCount === 0) {
      deleteRoom(roomCode);
    }
  }
}

export function startCleanupInterval(): ReturnType<typeof setInterval> {
  return setInterval(() => {
    for (const [code, room] of rooms) {
      if (room.isStale) {
        console.log(`Cleaning up stale room: ${code}`);
        room.destroy();
        rooms.delete(code);
      }
    }
  }, ROOM_CLEANUP_MS);
}

export function getRoomCount(): number {
  return rooms.size;
}
