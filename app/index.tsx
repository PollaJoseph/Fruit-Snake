import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, Animated, TouchableOpacity,
  Dimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Play, Trophy, Zap } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import GameColors from '@/constants/colors';
import { FRUIT_TYPES } from '@/constants/game';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const SNAKE_DECO_POINTS = [
  { x: 0.12, y: 0.5 },
  { x: 0.22, y: 0.28 },
  { x: 0.34, y: 0.18 },
  { x: 0.46, y: 0.25 },
  { x: 0.56, y: 0.42 },
  { x: 0.64, y: 0.6 },
  { x: 0.74, y: 0.68 },
  { x: 0.84, y: 0.58 },
  { x: 0.92, y: 0.38 },
];

const SNAKE_COLORS = ['#00F5D4', '#00E0C0', '#00C8D4', '#00B0E8', '#009AF9', '#3380FF', '#6B6BFF', '#7B61FF'];

export default function MenuScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [highScore, setHighScore] = useState<number>(0);

  const titleAnim = useRef(new Animated.Value(0)).current;
  const subtitleAnim = useRef(new Animated.Value(0)).current;
  const cardAnim = useRef(new Animated.Value(0)).current;
  const snakeAnim = useRef(new Animated.Value(0)).current;
  const btnScale = useRef(new Animated.Value(1)).current;
  const btnGlow = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    AsyncStorage.getItem('fruitsnake_highscore').then(val => {
      if (val) {
        const parsed = parseInt(val, 10);
        if (!isNaN(parsed)) setHighScore(parsed);
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    Animated.stagger(120, [
      Animated.spring(snakeAnim, { toValue: 1, tension: 50, friction: 8, useNativeDriver: true }),
      Animated.spring(titleAnim, { toValue: 1, tension: 50, friction: 8, useNativeDriver: true }),
      Animated.spring(subtitleAnim, { toValue: 1, tension: 50, friction: 8, useNativeDriver: true }),
      Animated.spring(cardAnim, { toValue: 1, tension: 40, friction: 8, useNativeDriver: true }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(btnGlow, { toValue: 1, duration: 1500, useNativeDriver: true }),
        Animated.timing(btnGlow, { toValue: 0, duration: 1500, useNativeDriver: true }),
      ])
    ).start();
  }, [titleAnim, subtitleAnim, cardAnim, snakeAnim, btnGlow]);

  const handlePlay = () => {
    Animated.sequence([
      Animated.timing(btnScale, { toValue: 0.92, duration: 80, useNativeDriver: true }),
      Animated.timing(btnScale, { toValue: 1, duration: 80, useNativeDriver: true }),
    ]).start(() => {
      router.push('/game');
    });
  };

  const decoWidth = SCREEN_WIDTH * 0.75;
  const decoHeight = 80;

  const btnGlowOpacity = btnGlow.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <LinearGradient
        colors={['#0C0C20', '#0A0A14', '#08081A', '#0A0A14']}
        locations={[0, 0.3, 0.7, 1]}
        style={StyleSheet.absoluteFill}
      />

      <View style={[styles.content, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 20 }]}>
        <View style={styles.topSection}>
          <Animated.View
            style={[
              styles.snakeDeco,
              { width: decoWidth, height: decoHeight },
              {
                opacity: snakeAnim,
                transform: [
                  { translateY: snakeAnim.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) },
                ],
              },
            ]}
          >
            {SNAKE_DECO_POINTS.map((pt, i) => {
              const size = 14 - i * 0.6;
              const color = SNAKE_COLORS[i] || SNAKE_COLORS[SNAKE_COLORS.length - 1];
              return (
                <View
                  key={`deco_${i}`}
                  style={{
                    position: 'absolute' as const,
                    left: pt.x * decoWidth - size / 2,
                    top: pt.y * decoHeight - size / 2,
                    width: size,
                    height: size,
                    borderRadius: size / 2,
                    backgroundColor: color,
                    shadowColor: color,
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: 0.6,
                    shadowRadius: 8,
                  }}
                />
              );
            })}
          </Animated.View>

          <Animated.View
            style={{
              opacity: titleAnim,
              transform: [
                { translateY: titleAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) },
              ],
            }}
          >
            <Text style={styles.title}>FRUIT</Text>
            <Text style={styles.titleAccent}>SNAKE</Text>
          </Animated.View>

          <Animated.View
            style={{
              opacity: subtitleAnim,
              transform: [
                { translateY: subtitleAnim.interpolate({ inputRange: [0, 1], outputRange: [15, 0] }) },
              ],
            }}
          >
            <View style={styles.premiumBadge}>
              <Zap color={GameColors.neonGold} size={12} />
              <Text style={styles.premiumText}>PREMIUM</Text>
              <Zap color={GameColors.neonGold} size={12} />
            </View>
          </Animated.View>
        </View>

        <Animated.View
          style={[
            styles.menuCard,
            {
              opacity: cardAnim,
              transform: [
                { translateY: cardAnim.interpolate({ inputRange: [0, 1], outputRange: [40, 0] }) },
                { scale: cardAnim.interpolate({ inputRange: [0, 1], outputRange: [0.95, 1] }) },
              ],
            },
          ]}
        >
          {highScore > 0 && (
            <View style={styles.highScoreRow}>
              <Trophy color={GameColors.neonGold} size={18} />
              <Text style={styles.highScoreLabel}>BEST SCORE</Text>
              <Text style={styles.highScoreVal}>{highScore}</Text>
            </View>
          )}

          <Animated.View style={{ transform: [{ scale: btnScale }], width: '100%' }}>
            <TouchableOpacity
              style={styles.playBtn}
              onPress={handlePlay}
              activeOpacity={1}
              testID="play-button"
            >
              <Animated.View style={[styles.playBtnGlow, { opacity: btnGlowOpacity }]} />
              <Play color="#0A0A14" size={24} fill="#0A0A14" />
              <Text style={styles.playBtnText}>PLAY</Text>
            </TouchableOpacity>
          </Animated.View>

          <View style={styles.fruitPreview}>
            {FRUIT_TYPES.map((ft) => (
              <View key={ft.id} style={styles.fruitPreviewItem}>
                <View
                  style={[
                    styles.fruitDot,
                    { backgroundColor: ft.color, shadowColor: ft.color },
                  ]}
                />
                <Text style={styles.fruitPoints}>+{ft.points}</Text>
              </View>
            ))}
          </View>
        </Animated.View>

        <View style={styles.bottomHint}>
          <Text style={styles.hintText}>Swipe to control the snake</Text>
          <Text style={styles.hintText}>Eat fruits to grow & score</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: GameColors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  topSection: {
    alignItems: 'center',
    gap: 16,
    marginTop: 20,
  },
  snakeDeco: {
    marginBottom: 8,
  },
  title: {
    fontSize: 52,
    fontWeight: '200' as const,
    color: GameColors.text,
    letterSpacing: 14,
    textAlign: 'center',
  },
  titleAccent: {
    fontSize: 56,
    fontWeight: '900' as const,
    color: GameColors.neonTeal,
    letterSpacing: 10,
    textAlign: 'center',
    marginTop: -6,
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  premiumText: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: GameColors.neonGold,
    letterSpacing: 6,
  },
  menuCard: {
    backgroundColor: GameColors.glass,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: GameColors.glassBorder,
    paddingVertical: 32,
    paddingHorizontal: 28,
    alignItems: 'center',
    width: SCREEN_WIDTH - 48,
    maxWidth: 380,
    gap: 20,
  },
  highScoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,190,11,0.08)',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 18,
    width: '100%',
    justifyContent: 'center',
  },
  highScoreLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: GameColors.textSecondary,
    letterSpacing: 2,
  },
  highScoreVal: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: GameColors.neonGold,
  },
  playBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: GameColors.neonTeal,
    borderRadius: 20,
    paddingVertical: 18,
    gap: 10,
    width: '100%',
    overflow: 'hidden',
  },
  playBtnGlow: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
  },
  playBtnText: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: '#0A0A14',
    letterSpacing: 4,
  },
  fruitPreview: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    paddingTop: 4,
  },
  fruitPreviewItem: {
    alignItems: 'center',
    gap: 4,
  },
  fruitDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 5,
  },
  fruitPoints: {
    fontSize: 10,
    fontWeight: '600' as const,
    color: GameColors.textMuted,
  },
  bottomHint: {
    alignItems: 'center',
    gap: 4,
  },
  hintText: {
    fontSize: 12,
    color: GameColors.textMuted,
    letterSpacing: 0.5,
  },
});
