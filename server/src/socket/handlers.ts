import { Server, Socket } from 'socket.io';
import { ClientToServerEvents, ServerToClientEvents } from '../shared/protocol';
import {
  createRoom,
  getRoom,
  setPlayerRoom,
  getPlayerRoom,
  removePlayerFromRoom,
} from './roomManager';

type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents>;
type TypedServer = Server<ClientToServerEvents, ServerToClientEvents>;

export function registerHandlers(io: TypedServer, socket: TypedSocket): void {
  // ---- Room events ----

  socket.on('room:create', (data, callback) => {
    const { playerName } = data;
    if (!playerName || playerName.trim().length === 0) {
      callback({ error: 'Player name is required' });
      return;
    }

    // Leave any existing room
    removePlayerFromRoom(socket.id);

    const room = createRoom(io);
    const added = room.addPlayer(socket.id, playerName.trim());
    if (!added) {
      callback({ error: 'Failed to create room' });
      return;
    }

    socket.join(room.state.roomCode);
    setPlayerRoom(socket.id, room.state.roomCode);
    callback({ roomCode: room.state.roomCode });
  });

  socket.on('room:join', (data, callback) => {
    const { roomCode, playerName } = data;
    if (!playerName || playerName.trim().length === 0) {
      callback({ error: 'Player name is required' });
      return;
    }
    if (!roomCode) {
      callback({ error: 'Room code is required' });
      return;
    }

    // Leave any existing room
    removePlayerFromRoom(socket.id);

    const room = getRoom(roomCode);
    if (!room) {
      callback({ error: 'Room not found' });
      return;
    }

    const added = room.addPlayer(socket.id, playerName.trim());
    if (!added) {
      callback({ error: 'Room is full or game already started' });
      return;
    }

    socket.join(room.state.roomCode);
    setPlayerRoom(socket.id, room.state.roomCode);
    callback({ success: true });
  });

  socket.on('room:ready', () => {
    const roomCode = getPlayerRoom(socket.id);
    if (!roomCode) return;

    const room = getRoom(roomCode);
    if (!room) return;

    room.setReady(socket.id);
  });

  socket.on('room:leave', () => {
    removePlayerFromRoom(socket.id);
  });

  // ---- Typing events ----

  socket.on('typing:start', (data) => {
    const roomCode = getPlayerRoom(socket.id);
    if (!roomCode) return;

    const room = getRoom(roomCode);
    if (!room) return;

    room.handleTypingStart(socket.id, data.invaderId);
  });

  socket.on('typing:char', (data) => {
    const roomCode = getPlayerRoom(socket.id);
    if (!roomCode) return;

    const room = getRoom(roomCode);
    if (!room) return;

    room.handleTypingChar(socket.id, data.char);
  });

  socket.on('typing:complete', (data) => {
    const roomCode = getPlayerRoom(socket.id);
    if (!roomCode) return;

    const room = getRoom(roomCode);
    if (!room) return;

    room.handleTypingComplete(socket.id, data.invaderId);
  });

  socket.on('typing:release', () => {
    const roomCode = getPlayerRoom(socket.id);
    if (!roomCode) return;

    const room = getRoom(roomCode);
    if (!room) return;

    room.handleTypingRelease(socket.id);
  });

  // ---- Play again ----

  socket.on('room:playAgain', () => {
    const roomCode = getPlayerRoom(socket.id);
    if (!roomCode) return;

    const room = getRoom(roomCode);
    if (!room) return;

    room.resetForPlayAgain(socket.id);
  });

  // ---- Disconnect ----

  socket.on('disconnect', () => {
    removePlayerFromRoom(socket.id);
  });
}
