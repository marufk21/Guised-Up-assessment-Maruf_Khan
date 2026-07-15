import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

import { color, duration, radius, space } from '../design';

export function PostCardSkeleton() {
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: duration.skeleton, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: duration.skeleton, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [shimmer]);

  const opacity = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.7] });
  const sk = { backgroundColor: color.elevated, borderRadius: radius.md };

  return (
    <Animated.View style={[styles.card, { opacity }]}>
      {/* Author row */}
      <View style={styles.row}>
        <View style={[styles.avatar, { backgroundColor: '#2C2C2E' }]} />
        <View style={styles.meta}>
          <View style={[sk, { width: 120, height: 14, marginBottom: 6 }]} />
          <View style={[sk, { width: 60, height: 10 }]} />
        </View>
      </View>
      {/* Text lines */}
      <View style={[sk, { height: 14, marginTop: space[4], width: '100%' }]} />
      <View style={[sk, { height: 14, marginTop: space[2], width: '70%' }]} />
      <View style={[sk, { height: 14, marginTop: space[2], width: '50%' }]} />
      {/* Button placeholder */}
      <View style={[styles.actionRow, { marginTop: space[4] }]}>
        <View style={[sk, { width: 80, height: 38, borderRadius: radius.md }]} />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
    paddingHorizontal: space[5],
    paddingTop: space[5],
    paddingBottom: space[4] + 2,
    backgroundColor: color.card,
    borderRadius: radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: color.hairline,
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 44, height: 44, borderRadius: 22 },
  meta: { flex: 1, marginLeft: space[3] },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: space[3] },
});
