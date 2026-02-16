import { useEffect, useRef } from 'react';

export function useGameLoop(
  callback: (timestamp: number) => void,
  active: boolean
) {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    if (!active) return;

    let frameId: number;
    const loop = (timestamp: number) => {
      callbackRef.current(timestamp);
      frameId = requestAnimationFrame(loop);
    };
    frameId = requestAnimationFrame(loop);

    return () => cancelAnimationFrame(frameId);
  }, [active]);
}
