import { GAME_FIELD_WIDTH, GAME_FIELD_HEIGHT } from './constants';

export function normalizedToScreenX(nx: number, screenWidth: number): number {
  return (nx / GAME_FIELD_WIDTH) * screenWidth;
}

export function normalizedToScreenY(ny: number, screenHeight: number): number {
  return (ny / GAME_FIELD_HEIGHT) * screenHeight;
}

export function screenToNormalizedX(sx: number, screenWidth: number): number {
  return (sx / screenWidth) * GAME_FIELD_WIDTH;
}

export function screenToNormalizedY(sy: number, screenHeight: number): number {
  return (sy / screenHeight) * GAME_FIELD_HEIGHT;
}
