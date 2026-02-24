import { useState, useRef, useCallback, useEffect } from 'react';
import { Animated } from 'react-native';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Direction, Point, GameFruit, Particle, GameStatus,
  FRUIT_TYPES, DIR_VECTORS, OPPOSITE_DIRS,
  INITIAL_SPEED, MIN_SPEED, SPEED_INCREMENT,
  INITIAL_SNAKE_LENGTH, MAX_FRUITS_ON_BOARD, GRID_COLS,
} from '@/constants/game';

const HIGH_SCORE_KEY = 'fruitsnake_highscore';

interface UseSnakeGameProps {
  boardWidth: number;
  boardHeight: number;
}

export function useSnakeGame({ boardWidth, boardHeight }: UseSnakeGameProps) {
  const cellSize = boardWidth > 0 ? Math.floor(boardWidth / GRID_COLS) : 1;
  const gridCols = GRID_COLS;
  const gridRows = cellSize > 0 && boardHeight > 0 ? Math.floor(boardHeight / cellSize) : 0;

  const [snake, setSnake] = useState<Point[]>([]);
  const [fruits, setFruits] = useState<GameFruit[]>([]);
  const [score, setScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(0);
  const [gameStatus, setGameStatus] = useState<GameStatus>('idle');
  const [particles, setParticles] = useState<Particle[]>([]);

  const snakeRef = useRef<Point[]>([]);
  const fruitsRef = useRef<GameFruit[]>([]);
  const directionRef = useRef<Direction>('RIGHT');
  const nextDirectionRef = useRef<Direction>('RIGHT');
  const scoreRef = useRef<number>(0);
  const speedRef = useRef<number>(INITIAL_SPEED);
  const gameStatusRef = useRef<GameStatus>('idle');
  const growCountRef = useRef<number>(0);
  const fruitIdRef = useRef<number>(0);
  const tickFnRef = useRef<() => void>(() => {});
  const gridColsRef = useRef<number>(gridCols);
  const gridRowsRef = useRef<number>(gridRows);
  const cellSizeRef = useRef<number>(cellSize);

  gridColsRef.current = gridCols;
  gridRowsRef.current = gridRows;
  cellSizeRef.current = cellSize;

  useEffect(() => {
    AsyncStorage.getItem(HIGH_SCORE_KEY).then(val => {
      if (val) {
        const parsed = parseInt(val, 10);
        if (!isNaN(parsed)) setHighScore(parsed);
      }
    }).catch(() => {});
  }, []);

  const spawnFruit = useCallback((currentSnake: Point[], currentFruits: GameFruit[]): GameFruit | null => {
    const cols = gridColsRef.current;
    const rows = gridRowsRef.current;
    if (cols === 0 || rows === 0) return null;

    const occupied = new Set<string>();
    currentSnake.forEach(p => occupied.add(`${p.x},${p.y}`));
    currentFruits.forEach(f => occupied.add(`${f.position.x},${f.position.y}`));

    const available: Point[] = [];
    for (let x = 0; x < cols; x++) {
      for (let y = 0; y < rows; y++) {
        if (!occupied.has(`${x},${y}`)) available.push({ x, y });
      }
    }

    if (available.length === 0) return null;
    const pos = available[Math.floor(Math.random() * available.length)];

    const totalWeight = FRUIT_TYPES.reduce((sum, f) => sum + f.spawnWeight, 0);
    let rand = Math.random() * totalWeight;
    let selectedType = FRUIT_TYPES[0];
    for (const ft of FRUIT_TYPES) {
      rand -= ft.spawnWeight;
      if (rand <= 0) { selectedType = ft; break; }
    }

    fruitIdRef.current++;
    return { id: `f${fruitIdRef.current}`, position: pos, type: selectedType };
  }, []);

  const triggerParticles = useCallback((gridX: number, gridY: number, color: string) => {
    const cs = cellSizeRef.current;
    const cx = gridX * cs + cs / 2;
    const cy = gridY * cs + cs / 2;
    const count = 8;
    const newParticles: Particle[] = [];

    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
      const anim = new Animated.Value(0);
      newParticles.push({
        id: `p${Date.now()}_${i}_${Math.random()}`,
        x: cx,
        y: cy,
        color,
        angle,
        speed: 20 + Math.random() * 25,
        animation: anim,
      });
      Animated.timing(anim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    }

    setParticles(prev => [...prev, ...newParticles]);
    const ids = new Set(newParticles.map(p => p.id));
    setTimeout(() => {
      setParticles(prev => prev.filter(p => !ids.has(p.id)));
    }, 450);
  }, []);

  const saveHighScore = useCallback((newScore: number) => {
    AsyncStorage.getItem(HIGH_SCORE_KEY).then(val => {
      const current = val ? parseInt(val, 10) : 0;
      if (newScore > current) {
        AsyncStorage.setItem(HIGH_SCORE_KEY, newScore.toString());
        setHighScore(newScore);
      }
    }).catch(() => {});
  }, []);

  const tick = () => {
    if (gameStatusRef.current !== 'playing') return;

    const s = snakeRef.current;
    if (s.length === 0) return;
    const f = fruitsRef.current;
    const dir = nextDirectionRef.current;
    directionRef.current = dir;

    const head = s[0];
    const vec = DIR_VECTORS[dir];
    const newHead: Point = { x: head.x + vec.x, y: head.y + vec.y };
    const cols = gridColsRef.current;
    const rows = gridRowsRef.current;

    if (newHead.x < 0 || newHead.x >= cols || newHead.y < 0 || newHead.y >= rows) {
      gameStatusRef.current = 'gameover';
      setGameStatus('gameover');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      saveHighScore(scoreRef.current);
      return;
    }

    const checkLen = growCountRef.current > 0 ? s.length : s.length - 1;
    for (let i = 0; i < checkLen; i++) {
      if (s[i].x === newHead.x && s[i].y === newHead.y) {
        gameStatusRef.current = 'gameover';
        setGameStatus('gameover');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        saveHighScore(scoreRef.current);
        return;
      }
    }

    let newSnake: Point[];
    if (growCountRef.current > 0) {
      newSnake = [newHead, ...s];
      growCountRef.current--;
    } else {
      newSnake = [newHead, ...s.slice(0, -1)];
    }

    const fi = f.findIndex(fr => fr.position.x === newHead.x && fr.position.y === newHead.y);
    let newFruits = [...f];

    if (fi >= 0) {
      const eaten = f[fi];
      scoreRef.current += eaten.type.points;
      setScore(scoreRef.current);
      growCountRef.current += eaten.type.points;
      speedRef.current = Math.max(MIN_SPEED, speedRef.current - SPEED_INCREMENT);

      newFruits.splice(fi, 1);
      while (newFruits.length < MAX_FRUITS_ON_BOARD) {
        const nf = spawnFruit(newSnake, newFruits);
        if (nf) newFruits.push(nf);
        else break;
      }

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      triggerParticles(eaten.position.x, eaten.position.y, eaten.type.color);
    }

    snakeRef.current = newSnake;
    fruitsRef.current = newFruits;
    setSnake(newSnake);
    setFruits(newFruits);
  };

  tickFnRef.current = tick;

  useEffect(() => {
    if (gameStatus !== 'playing') return;

    let frameId: number;
    let lastTick = 0;

    const loop = (timestamp: number) => {
      if (gameStatusRef.current !== 'playing') return;
      if (lastTick === 0) lastTick = timestamp;
      if (timestamp - lastTick >= speedRef.current) {
        tickFnRef.current();
        lastTick = timestamp;
      }
      frameId = requestAnimationFrame(loop);
    };

    frameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameId);
  }, [gameStatus]);

  const startGame = useCallback(() => {
    const cols = gridColsRef.current;
    const rows = gridRowsRef.current;
    if (cols === 0 || rows === 0) return;

    const startX = Math.floor(cols / 2);
    const startY = Math.floor(rows / 2);
    const initialSnake: Point[] = [];
    for (let i = 0; i < INITIAL_SNAKE_LENGTH; i++) {
      initialSnake.push({ x: startX - i, y: startY });
    }

    const initialFruits: GameFruit[] = [];
    for (let i = 0; i < MAX_FRUITS_ON_BOARD; i++) {
      const fruit = spawnFruit(initialSnake, initialFruits);
      if (fruit) initialFruits.push(fruit);
    }

    snakeRef.current = initialSnake;
    fruitsRef.current = initialFruits;
    directionRef.current = 'RIGHT';
    nextDirectionRef.current = 'RIGHT';
    scoreRef.current = 0;
    speedRef.current = INITIAL_SPEED;
    growCountRef.current = 0;
    gameStatusRef.current = 'playing';

    setSnake(initialSnake);
    setFruits(initialFruits);
    setScore(0);
    setParticles([]);
    setGameStatus('playing');
  }, [spawnFruit]);

  const pauseGame = useCallback(() => {
    gameStatusRef.current = 'paused';
    setGameStatus('paused');
  }, []);

  const resumeGame = useCallback(() => {
    gameStatusRef.current = 'playing';
    setGameStatus('playing');
  }, []);

  const changeDirection = useCallback((newDir: Direction) => {
    const current = directionRef.current;
    if (OPPOSITE_DIRS[current] !== newDir && current !== newDir) {
      nextDirectionRef.current = newDir;
      Haptics.selectionAsync();
    }
  }, []);

  useEffect(() => {
    return () => {
      gameStatusRef.current = 'idle';
    };
  }, []);

  return {
    snake,
    fruits,
    score,
    highScore,
    gameStatus,
    gridCols,
    gridRows,
    cellSize,
    particles,
    startGame,
    pauseGame,
    resumeGame,
    changeDirection,
  };
}
