export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

export interface Point {
  x: number;
  y: number;
}

export interface FruitType {
  id: string;
  name: string;
  color: string;
  glowColor: string;
  points: number;
  spawnWeight: number;
}

export interface GameFruit {
  id: string;
  position: Point;
  type: FruitType;
}

export interface Particle {
  id: string;
  x: number;
  y: number;
  color: string;
  angle: number;
  speed: number;
  animation: import('react-native').Animated.Value;
}

export type GameStatus = 'idle' | 'playing' | 'paused' | 'gameover';

export const FRUIT_TYPES: FruitType[] = [
  { id: 'apple', name: 'Apple', color: '#FF006E', glowColor: 'rgba(255,0,110,0.35)', points: 1, spawnWeight: 40 },
  { id: 'cherry', name: 'Cherry', color: '#FB5607', glowColor: 'rgba(251,86,7,0.35)', points: 2, spawnWeight: 25 },
  { id: 'grape', name: 'Grape', color: '#8338EC', glowColor: 'rgba(131,56,236,0.35)', points: 3, spawnWeight: 20 },
  { id: 'lime', name: 'Lime', color: '#80ED99', glowColor: 'rgba(128,237,153,0.35)', points: 2, spawnWeight: 10 },
  { id: 'golden', name: 'Star', color: '#FFBE0B', glowColor: 'rgba(255,190,11,0.35)', points: 5, spawnWeight: 5 },
];

export const DIR_VECTORS: Record<Direction, Point> = {
  UP: { x: 0, y: -1 },
  DOWN: { x: 0, y: 1 },
  LEFT: { x: -1, y: 0 },
  RIGHT: { x: 1, y: 0 },
};

export const OPPOSITE_DIRS: Record<Direction, Direction> = {
  UP: 'DOWN',
  DOWN: 'UP',
  LEFT: 'RIGHT',
  RIGHT: 'LEFT',
};

export const INITIAL_SPEED = 145;
export const MIN_SPEED = 55;
export const SPEED_INCREMENT = 2;
export const INITIAL_SNAKE_LENGTH = 4;
export const MAX_FRUITS_ON_BOARD = 3;
export const GRID_COLS = 18;

export function interpolateColor(c1: string, c2: string, t: number): string {
  const r1 = parseInt(c1.slice(1, 3), 16);
  const g1 = parseInt(c1.slice(3, 5), 16);
  const b1 = parseInt(c1.slice(5, 7), 16);
  const r2 = parseInt(c2.slice(1, 3), 16);
  const g2 = parseInt(c2.slice(3, 5), 16);
  const b2 = parseInt(c2.slice(5, 7), 16);
  const r = Math.round(r1 + (r2 - r1) * t);
  const g = Math.round(g1 + (g2 - g1) * t);
  const b = Math.round(b1 + (b2 - b1) * t);
  return `rgb(${r},${g},${b})`;
}
