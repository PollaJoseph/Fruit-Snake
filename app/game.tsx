import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, Animated, PanResponder,
  TouchableOpacity, BackHandler, Dimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Pause, Play, RotateCcw, Home, Trophy } from 'lucide-react-native';
import { useSnakeGame } from '@/hooks/useSnakeGame';
import { interpolateColor, type Direction } from '@/constants/game';
import GameColors from '@/constants/colors';

function GameContent({ width, height }: { width: number; height: number }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const game = useSnakeGame({ boardWidth: width, boardHeight: height });
  const {
    snake, fruits, score, highScore, gameStatus, cellSize, particles,
    startGame, pauseGame, resumeGame, changeDirection,
  } = game;

  const hasStarted = useRef(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;
  const fruitPulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!hasStarted.current && width > 0 && height > 0) {
      hasStarted.current = true;
      setTimeout(() => startGame(), 200);
    }
  }, [width, height, startGame]);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(fruitPulse, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(fruitPulse, { toValue: 0, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, [fruitPulse]);

  useEffect(() => {
    if (gameStatus === 'gameover' || gameStatus === 'paused') {
      overlayAnim.setValue(0);
      Animated.timing(overlayAnim, { toValue: 1, duration: 250, useNativeDriver: true }).start();
    }
  }, [gameStatus, overlayAnim]);

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
  }, [fadeAnim]);

  useEffect(() => {
    const handler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (gameStatus === 'playing') {
        pauseGame();
        return true;
      }
      return false;
    });
    return () => handler.remove();
  }, [gameStatus, pauseGame]);

  const swipeHandled = useRef(false);
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => { swipeHandled.current = false; },
      onPanResponderMove: (_, gs) => {
        if (swipeHandled.current) return;
        const { dx, dy } = gs;
        const absDx = Math.abs(dx);
        const absDy = Math.abs(dy);
        if (Math.max(absDx, absDy) < 12) return;
        swipeHandled.current = true;
        let dir: Direction;
        if (absDx > absDy) {
          dir = dx > 0 ? 'RIGHT' : 'LEFT';
        } else {
          dir = dy > 0 ? 'DOWN' : 'UP';
        }
        changeDirection(dir);
      },
      onPanResponderRelease: () => { swipeHandled.current = false; },
    })
  ).current;

  const fruitScale = fruitPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.8, 1.1],
  });

  const handleRestart = useCallback(() => {
    hasStarted.current = false;
    setTimeout(() => {
      hasStarted.current = true;
      startGame();
    }, 100);
  }, [startGame]);

  const handleQuit = useCallback(() => {
    router.back();
  }, [router]);

  const boardWidth = game.gridCols * cellSize;
  const boardHeight = game.gridRows * cellSize;
  const isNewHighScore = gameStatus === 'gameover' && score > 0 && score >= highScore;

  const snakeElements = useMemo(() => {
    return snake.map((seg, i) => {
      const isHead = i === 0;
      const progress = snake.length > 1 ? i / (snake.length - 1) : 0;
      const color = interpolateColor('#00F5D4', '#7B61FF', progress);
      const size = isHead ? cellSize - 1 : cellSize - 2;
      const offset = isHead ? 0.5 : 1;

      return (
        <View
          key={`s${i}`}
          style={{
            position: 'absolute' as const,
            left: seg.x * cellSize + offset,
            top: seg.y * cellSize + offset,
            width: size,
            height: size,
            borderRadius: isHead ? size * 0.45 : size * 0.3,
            backgroundColor: color,
          }}
        />
      );
    });
  }, [snake, cellSize]);

  const headGlow = useMemo(() => {
    if (snake.length === 0) return null;
    const head = snake[0];
    const glowSize = cellSize + 10;
    return (
      <View
        style={{
          position: 'absolute' as const,
          left: head.x * cellSize - 5,
          top: head.y * cellSize - 5,
          width: glowSize,
          height: glowSize,
          borderRadius: glowSize / 2,
          backgroundColor: 'rgba(0,245,212,0.15)',
        }}
      />
    );
  }, [snake, cellSize]);

  const fruitElements = useMemo(() => {
    return fruits.map(fruit => {
      const glowSize = cellSize + 8;
      return (
        <View key={fruit.id}>
          <View
            style={{
              position: 'absolute' as const,
              left: fruit.position.x * cellSize - 4,
              top: fruit.position.y * cellSize - 4,
              width: glowSize,
              height: glowSize,
              borderRadius: glowSize / 2,
              backgroundColor: fruit.type.glowColor,
            }}
          />
          <Animated.View
            style={{
              position: 'absolute' as const,
              left: fruit.position.x * cellSize + 2,
              top: fruit.position.y * cellSize + 2,
              width: cellSize - 4,
              height: cellSize - 4,
              borderRadius: (cellSize - 4) / 2,
              backgroundColor: fruit.type.color,
              transform: [{ scale: fruitScale }],
            }}
          />
        </View>
      );
    });
  }, [fruits, cellSize, fruitScale]);

  const particleElements = useMemo(() => {
    return particles.map(p => {
      const translateX = p.animation.interpolate({
        inputRange: [0, 1],
        outputRange: [0, Math.cos(p.angle) * p.speed],
      });
      const translateY = p.animation.interpolate({
        inputRange: [0, 1],
        outputRange: [0, Math.sin(p.angle) * p.speed],
      });
      const opacity = p.animation.interpolate({
        inputRange: [0, 0.6, 1],
        outputRange: [1, 0.4, 0],
      });
      const scale = p.animation.interpolate({
        inputRange: [0, 1],
        outputRange: [1.2, 0.2],
      });

      return (
        <Animated.View
          key={p.id}
          style={{
            position: 'absolute' as const,
            left: p.x - 3,
            top: p.y - 3,
            width: 6,
            height: 6,
            borderRadius: 3,
            backgroundColor: p.color,
            opacity,
            transform: [{ translateX }, { translateY }, { scale }],
          }}
        />
      );
    });
  }, [particles]);

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <StatusBar style="light" />

      <LinearGradient
        colors={['#0A0A14', '#08081A', '#0A0A14']}
        style={StyleSheet.absoluteFill}
      />

      <View style={[styles.scoreBar, { paddingTop: insets.top + 4 }]}>
        <View style={styles.scoreSection}>
          <Text style={styles.scoreLabel}>SCORE</Text>
          <Text style={styles.scoreValue}>{score}</Text>
        </View>
        <TouchableOpacity
          style={styles.pauseButton}
          onPress={gameStatus === 'playing' ? pauseGame : undefined}
          activeOpacity={0.7}
          testID="pause-button"
        >
          <Pause color={GameColors.textSecondary} size={20} />
        </TouchableOpacity>
        <View style={styles.scoreSection}>
          <Text style={styles.scoreLabel}>BEST</Text>
          <Text style={styles.highScoreValue}>{highScore}</Text>
        </View>
      </View>

      <View style={styles.boardWrapper}>
        <View
          style={[
            styles.boardContainer,
            { width: boardWidth, height: boardHeight },
          ]}
          {...panResponder.panHandlers}
        >
          <View style={styles.boardBorder}>
            <LinearGradient
              colors={['rgba(0,245,212,0.08)', 'rgba(123,97,255,0.08)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
          </View>

          {headGlow}
          {snakeElements}
          {fruitElements}
          {particleElements}
        </View>
      </View>

      <View style={[styles.controlHint, { paddingBottom: insets.bottom + 8 }]}>
        <Text style={styles.controlHintText}>Swipe to control</Text>
      </View>

      {gameStatus === 'paused' && (
        <Animated.View style={[styles.overlay, { opacity: overlayAnim }]}>
          <BlurView intensity={40} tint="dark" style={styles.overlayBlur}>
            <View style={styles.overlayCard}>
              <Text style={styles.overlayTitle}>PAUSED</Text>
              <View style={styles.overlayButtons}>
                <TouchableOpacity
                  style={styles.primaryBtn}
                  onPress={resumeGame}
                  activeOpacity={0.8}
                  testID="resume-button"
                >
                  <Play color="#0A0A14" size={20} />
                  <Text style={styles.primaryBtnText}>RESUME</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.secondaryBtn}
                  onPress={handleQuit}
                  activeOpacity={0.8}
                  testID="quit-button"
                >
                  <Home color={GameColors.textSecondary} size={18} />
                  <Text style={styles.secondaryBtnText}>MENU</Text>
                </TouchableOpacity>
              </View>
            </View>
          </BlurView>
        </Animated.View>
      )}

      {gameStatus === 'gameover' && (
        <Animated.View style={[styles.overlay, { opacity: overlayAnim }]}>
          <BlurView intensity={40} tint="dark" style={styles.overlayBlur}>
            <View style={styles.overlayCard}>
              <Text style={styles.gameOverTitle}>GAME OVER</Text>

              {isNewHighScore && (
                <View style={styles.newHighScoreBadge}>
                  <Trophy color={GameColors.neonGold} size={16} />
                  <Text style={styles.newHighScoreText}>NEW BEST!</Text>
                </View>
              )}

              <Text style={styles.finalScoreLabel}>SCORE</Text>
              <Text style={styles.finalScore}>{score}</Text>

              <View style={styles.overlayButtons}>
                <TouchableOpacity
                  style={styles.primaryBtn}
                  onPress={handleRestart}
                  activeOpacity={0.8}
                  testID="restart-button"
                >
                  <RotateCcw color="#0A0A14" size={18} />
                  <Text style={styles.primaryBtnText}>PLAY AGAIN</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.secondaryBtn}
                  onPress={handleQuit}
                  activeOpacity={0.8}
                >
                  <Home color={GameColors.textSecondary} size={18} />
                  <Text style={styles.secondaryBtnText}>MENU</Text>
                </TouchableOpacity>
              </View>
            </View>
          </BlurView>
        </Animated.View>
      )}
    </Animated.View>
  );
}

export default function GameScreen() {
  const [boardSize, setBoardSize] = useState({ width: 0, height: 0 });
  const screenWidth = Dimensions.get('window').width;

  return (
    <View style={styles.container}>
      <View
        style={styles.measureArea}
        onLayout={(e) => {
          const { width: w, height: h } = e.nativeEvent.layout;
          if (w > 0 && h > 0) {
            setBoardSize({ width: Math.min(w, screenWidth), height: h });
          }
        }}
      >
        {boardSize.width > 0 && boardSize.height > 0 && (
          <GameContent width={boardSize.width} height={boardSize.height} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: GameColors.background,
  },
  measureArea: {
    flex: 1,
  },
  scoreBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 12,
  },
  scoreSection: {
    alignItems: 'center',
    minWidth: 70,
  },
  scoreLabel: {
    fontSize: 10,
    fontWeight: '600' as const,
    letterSpacing: 2,
    color: GameColors.textMuted,
    marginBottom: 2,
  },
  scoreValue: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: GameColors.neonTeal,
  },
  highScoreValue: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: GameColors.textSecondary,
  },
  pauseButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: GameColors.glass,
    borderWidth: 1,
    borderColor: GameColors.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boardWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boardContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  boardBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  controlHint: {
    alignItems: 'center',
    paddingTop: 8,
  },
  controlHintText: {
    fontSize: 12,
    color: GameColors.textMuted,
    letterSpacing: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
  },
  overlayBlur: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlayCard: {
    backgroundColor: GameColors.glass,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: GameColors.glassBorder,
    paddingVertical: 36,
    paddingHorizontal: 40,
    alignItems: 'center',
    minWidth: 260,
  },
  overlayTitle: {
    fontSize: 28,
    fontWeight: '800' as const,
    color: GameColors.text,
    letterSpacing: 4,
    marginBottom: 24,
  },
  gameOverTitle: {
    fontSize: 26,
    fontWeight: '800' as const,
    color: GameColors.danger,
    letterSpacing: 3,
    marginBottom: 12,
  },
  newHighScoreBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,190,11,0.12)',
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 14,
    marginBottom: 16,
    gap: 6,
  },
  newHighScoreText: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: GameColors.neonGold,
    letterSpacing: 1,
  },
  finalScoreLabel: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: GameColors.textMuted,
    letterSpacing: 2,
    marginBottom: 4,
  },
  finalScore: {
    fontSize: 52,
    fontWeight: '800' as const,
    color: GameColors.text,
    marginBottom: 28,
  },
  overlayButtons: {
    gap: 12,
    width: '100%',
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: GameColors.neonTeal,
    borderRadius: 16,
    paddingVertical: 14,
    gap: 8,
  },
  primaryBtnText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#0A0A14',
    letterSpacing: 1,
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: GameColors.glass,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: GameColors.glassBorder,
    paddingVertical: 12,
    gap: 8,
  },
  secondaryBtnText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: GameColors.textSecondary,
    letterSpacing: 1,
  },
});
