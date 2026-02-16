'use client';

import { useCallback } from 'react';
import { useSocket } from '@/hooks/useSocket';
import { useMultiplayerGameState } from '@/hooks/useMultiplayerGameState';
import { useMultiplayerKeyboardInput } from '@/hooks/useMultiplayerKeyboardInput';
import Lobby from './Lobby';
import RoomWaiting from './RoomWaiting';
import CountdownOverlay from './CountdownOverlay';
import MultiplayerGameScreen from './MultiplayerGameScreen';
import ResultsScreen from './ResultsScreen';

interface MultiplayerGameProps {
  onBack: () => void;
}

export default function MultiplayerGame({ onBack }: MultiplayerGameProps) {
  const { socket, connected, socketId } = useSocket();
  const { state, reset } = useMultiplayerGameState(socket);

  const { currentInput, inputError, handleKeyPress } = useMultiplayerKeyboardInput({
    socket,
    invaders: state.invaders,
    myLockedInvaderId: state.myLockedInvaderId,
    isPlaying: state.phase === 'playing',
  });

  const handleBack = useCallback(() => {
    if (socket) {
      socket.emit('room:leave');
    }
    reset();
    onBack();
  }, [socket, reset, onBack]);

  const handleLeaveLobby = useCallback(() => {
    reset();
  }, [reset]);

  const handlePlayAgain = useCallback(() => {
    if (socket) {
      socket.emit('room:playAgain');
    }
  }, [socket]);

  // No room yet -> show lobby
  if (!state.roomCode || state.phase === null) {
    return (
      <Lobby
        socket={socket}
        connected={connected}
        onBack={handleBack}
      />
    );
  }

  // Waiting for players / ready up
  if (state.phase === 'waiting') {
    return (
      <RoomWaiting
        socket={socket}
        socketId={socketId}
        roomCode={state.roomCode}
        players={state.players}
        onLeave={handleLeaveLobby}
      />
    );
  }

  // Countdown
  if (state.phase === 'countdown') {
    return <CountdownOverlay value={state.countdownValue} />;
  }

  // Game finished
  if (state.phase === 'finished') {
    return (
      <ResultsScreen
        players={state.players}
        winnerId={state.winnerId}
        mySocketId={socketId}
        opponentDisconnected={state.opponentDisconnected}
        onPlayAgain={handlePlayAgain}
        onBack={handleBack}
      />
    );
  }

  // Playing
  return (
    <MultiplayerGameScreen
      invaders={state.invaders}
      players={state.players}
      timeRemaining={state.timeRemaining}
      mySocketId={socketId}
      currentInput={currentInput}
      inputError={inputError}
      myLockedInvaderId={state.myLockedInvaderId}
      onKeyPress={handleKeyPress}
    />
  );
}
