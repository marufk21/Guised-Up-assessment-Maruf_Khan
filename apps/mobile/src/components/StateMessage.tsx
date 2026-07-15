import { useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { color, duration, radius, space, touch, type } from '../design';

const fontFix = Platform.select({ ios: {}, android: { includeFontPadding: false } });

interface StateMessageProps {
  title: string;
  msg: string;
  action?: string;
  onAction?: () => void;
  loading?: boolean;
}

export function StateMessage({ title, msg, action, onAction, loading }: StateMessageProps) {
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fade, {
      toValue: 1,
      duration: duration.normal,
      useNativeDriver: true,
    }).start();
  }, [fade]);

  return (
    <Animated.View style={[styles.wrap, { opacity: fade }]}>
      {loading && (
        <ActivityIndicator color={color.accent} size="large" style={{ marginBottom: space[5] }} />
      )}
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.msg}>{msg}</Text>
      {action && onAction ? (
        <Pressable
          onPress={onAction}
          style={({ pressed }) => [styles.btn, pressed && styles.btnPressed]}
        >
          <Text style={styles.btnText}>{action}</Text>
        </Pressable>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 340,
    paddingHorizontal: space[7],
    paddingVertical: space[9],
  },
  title: {
    fontSize: type.title.size,
    fontWeight: type.title.weight,
    color: color.primary,
    textAlign: 'center',
    letterSpacing: type.title.tracking,
    ...fontFix,
  },
  msg: {
    fontSize: type.label.size,
    fontWeight: '400',
    color: color.secondary,
    textAlign: 'center',
    lineHeight: type.label.leading + 2,
    marginTop: space[2],
    maxWidth: 300,
    ...fontFix,
  },
  btn: {
    backgroundColor: color.accent,
    borderRadius: radius.md,
    minHeight: touch.min + 4,
    paddingHorizontal: space[6],
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: space[5],
  },
  btnPressed: { opacity: 0.8 },
  btnText: {
    fontSize: type.label.size,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
