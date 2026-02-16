'use client';

import { useEffect, useCallback, useRef, useState } from 'react';
import { Socket } from 'socket.io-client';
import { ServerInvader, ClientToServerEvents, ServerToClientEvents } from '@/lib/socketEvents';

type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

interface UseMultiplayerKeyboardInputProps {
  socket: TypedSocket | null;
  invaders: ServerInvader[];
  myLockedInvaderId: string | null;
  isPlaying: boolean;
}

export function useMultiplayerKeyboardInput({
  socket,
  invaders,
  myLockedInvaderId,
  isPlaying,
}: UseMultiplayerKeyboardInputProps) {
  const [currentInput, setCurrentInput] = useState('');
  const [inputError, setInputError] = useState(false);
  const inputRef = useRef('');
  const lockedRef = useRef<string | null>(null);

  // Keep refs in sync
  useEffect(() => {
    lockedRef.current = myLockedInvaderId;
    if (!myLockedInvaderId) {
      setCurrentInput('');
      inputRef.current = '';
    }
  }, [myLockedInvaderId]);

  const handleChar = useCallback(
    (char: string) => {
      if (!socket || !isPlaying) return;

      const lowerChar = char.toLowerCase();

      if (!lockedRef.current) {
        // Not locked yet — try to find an invader starting with this char
        const match = invaders.find(
          inv => !inv.lockedBy && inv.word.startsWith(lowerChar)
        );

        if (match) {
          socket.emit('typing:start', { invaderId: match.id });
          setCurrentInput(lowerChar);
          inputRef.current = lowerChar;
        } else {
          // No match — show error
          setInputError(true);
          setTimeout(() => setInputError(false), 300);
        }
      } else {
        // Already locked — send char
        const newInput = inputRef.current + lowerChar;
        const lockedInvader = invaders.find(inv => inv.id === lockedRef.current);

        if (lockedInvader && lockedInvader.word.startsWith(newInput)) {
          socket.emit('typing:char', { char: lowerChar });
          inputRef.current = newInput;
          setCurrentInput(newInput);

          // Check if complete
          if (newInput === lockedInvader.word) {
            socket.emit('typing:complete', { invaderId: lockedInvader.id });
            inputRef.current = '';
            setCurrentInput('');
          }
        } else {
          // Wrong char — release lock
          socket.emit('typing:release');
          inputRef.current = '';
          setCurrentInput('');
          setInputError(true);
          setTimeout(() => setInputError(false), 300);
        }
      }
    },
    [socket, invaders, isPlaying]
  );

  const handleBackspace = useCallback(() => {
    if (!socket || !isPlaying) return;

    if (inputRef.current.length > 0) {
      // Release the lock entirely on backspace
      socket.emit('typing:release');
      inputRef.current = '';
      setCurrentInput('');
    }
  }, [socket, isPlaying]);

  // Physical keyboard handler
  useEffect(() => {
    if (!isPlaying) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      if (e.key === 'Backspace') {
        e.preventDefault();
        handleBackspace();
      } else if (e.key === 'Escape') {
        handleBackspace();
      } else if (e.key.length === 1 && /[a-zA-Z]/.test(e.key)) {
        e.preventDefault();
        handleChar(e.key);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isPlaying, handleChar, handleBackspace]);

  // On-screen keyboard handler
  const handleKeyPress = useCallback(
    (key: string) => {
      if (key === 'backspace') {
        handleBackspace();
      } else if (key.length === 1 && /[a-zA-Z]/.test(key)) {
        handleChar(key);
      }
    },
    [handleChar, handleBackspace]
  );

  return { currentInput, inputError, handleKeyPress };
}
