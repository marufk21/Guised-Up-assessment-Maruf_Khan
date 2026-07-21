import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { avatarColor, color, duration, initials, radius, space, touch, type } from '../design';
import type { Post } from '../types';
import { timeAgo } from '../utils/timeAgo';

interface PostCardProps {
  post: Post;
  isReacting: boolean;
  isReacted: boolean;
  reactionError?: string;
  onReact: (postId: number) => void;
}

const fontFix = Platform.select({ ios: {}, android: { includeFontPadding: false } });

export function PostCard({ post, isReacting, isReacted, reactionError, onReact }: PostCardProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const cardScale = useRef(new Animated.Value(1)).current;
  const btnScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    setImageFailed(false);
  }, [post.image_url]);

  const handlePressIn = useCallback(() => {
    Animated.spring(cardScale, { toValue: 0.985, useNativeDriver: true, speed: 50, bounciness: 4 }).start();
  }, [cardScale]);

  const handlePressOut = useCallback(() => {
    Animated.spring(cardScale, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 4 }).start();
  }, [cardScale]);

  const handleBtnPressIn = useCallback(() => {
    Animated.spring(btnScale, { toValue: 0.95, useNativeDriver: true, speed: 80, bounciness: 4 }).start();
  }, [btnScale]);

  const handleBtnPressOut = useCallback(() => {
    Animated.spring(btnScale, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 4 }).start();
  }, [btnScale]);

  const pal = avatarColor(post.user.name);
  const imageUrl = post.image_url;
  const hasImage = imageUrl != null && imageUrl.length > 0;
  const showImage = hasImage && !imageFailed;

  return (
    <Pressable onPressIn={handlePressIn} onPressOut={handlePressOut} accessibilityRole="none">
      <Animated.View style={[styles.card, { transform: [{ scale: cardScale }] }]}>
        {/* ── Author Row ── */}
        <View style={styles.authorRow}>
          <View style={[styles.avatar, { backgroundColor: pal.bg }]}>
            <Text style={[styles.avatarText, { color: pal.text }]}>
              {initials(post.user.name)}
            </Text>
          </View>

          <View style={styles.meta}>
            <Text style={styles.name} numberOfLines={1}>{post.user.name}</Text>
            <Text style={styles.time}>{timeAgo(post.created_at)}</Text>
          </View>

          {post.ranking != null && (
            <View style={styles.score}>
              <Text style={styles.scoreValue}>{Math.round(post.ranking.score * 100)}</Text>
              <Text style={styles.scorePct}>%</Text>
            </View>
          )}
        </View>

        {/* ── Body ── */}
        <Text style={styles.body}>{post.text}</Text>

        {/* ── Image ── */}
        {showImage && (
          <Image
            source={{ uri: imageUrl! }}
            style={styles.image}
            resizeMode="cover"
            onError={() => setImageFailed(true)}
            accessibilityLabel={`Image shared by ${post.user.name}`}
          />
        )}

        {hasImage && imageFailed && (
          <View style={styles.imgFail}>
            <Text style={styles.imgFailText}>Image unavailable</Text>
          </View>
        )}

        {/* ── Actions ── */}
        <View style={styles.actionRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={isReacted ? 'Remove reaction' : 'React to this post'}
            accessibilityState={{ disabled: isReacting }}
            disabled={isReacting}
            onPress={() => onReact(post.id)}
            onPressIn={handleBtnPressIn}
            onPressOut={handleBtnPressOut}
          >
            <Animated.View
              style={[
                styles.reactBtn,
                isReacted && styles.reactBtnActive,
                { transform: [{ scale: btnScale }] },
              ]}
            >
              {isReacting ? (
                <ActivityIndicator color={color.accent} size="small" />
              ) : (
                <Text style={[styles.reactIcon, isReacted && styles.reactIconActive]}>
                  {isReacted ? '♥' : '♡'}
                </Text>
              )}
              <Text style={[styles.reactLabel, isReacted && styles.reactLabelActive]}>
                {isReacting ? 'Sending' : isReacted ? 'Reacted' : 'React'}
              </Text>
            </Animated.View>
          </Pressable>

          {post.semantic_similarity != null && (
            <Text style={styles.similarity}>
              {(post.semantic_similarity * 100).toFixed(0)}% match
            </Text>
          )}
        </View>

        {reactionError != null && (
          <Text style={styles.reactionError}>{reactionError}</Text>
        )}
      </Animated.View>
    </Pressable>
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

  authorRow: { flexDirection: 'row', alignItems: 'center' },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 16, fontWeight: '700' },
  meta: { flex: 1, marginLeft: space[3] },
  name: {
    fontSize: type.label.size,
    fontWeight: type.label.weight,
    color: color.primary,
    letterSpacing: type.label.tracking,
    ...fontFix,
  },
  time: {
    fontSize: type.meta.size,
    fontWeight: type.meta.weight,
    color: color.secondary,
    marginTop: 2,
    ...fontFix,
  },
  score: {
    flexDirection: 'row', alignItems: 'baseline',
    backgroundColor: color.elevated, borderRadius: radius.sm,
    paddingHorizontal: space[2], paddingVertical: space[1],
    marginLeft: space[2],
  },
  scoreValue: { fontSize: type.meta.size, fontWeight: '700', color: color.accent, ...fontFix },
  scorePct: { fontSize: type.tiny.size, fontWeight: '700', color: color.accentMuted, marginLeft: 1, ...fontFix },

  body: {
    fontSize: type.body.size,
    lineHeight: type.body.leading,
    color: color.primary,
    marginTop: space[4] - 2,
    ...fontFix,
  },

  image: {
    width: '100%', aspectRatio: 16 / 10,
    borderRadius: radius.md, marginTop: space[4],
    backgroundColor: color.elevated,
  },
  imgFail: {
    marginTop: space[4], minHeight: 64,
    backgroundColor: color.elevated, borderRadius: radius.md,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: color.border, borderStyle: 'dashed',
  },
  imgFailText: { fontSize: type.meta.size, fontWeight: type.meta.weight, color: color.tertiary, ...fontFix },

  actionRow: { flexDirection: 'row', alignItems: 'center', marginTop: space[4], gap: space[3] },
  reactBtn: {
    flexDirection: 'row', alignItems: 'center', gap: space[2],
    paddingHorizontal: space[4], paddingVertical: space[2] + 1,
    borderRadius: radius.md, borderWidth: 1, borderColor: color.hairline,
    backgroundColor: color.elevated, minHeight: touch.min, minWidth: 88,
    justifyContent: 'center',
  },
  reactBtnActive: { backgroundColor: color.reactedBg, borderColor: 'rgba(244, 114, 182, 0.25)' },
  reactIcon: { fontSize: 16 },
  reactIconActive: { color: color.reacted },
  reactLabel: { fontSize: type.meta.size, fontWeight: '600', color: color.secondary, ...fontFix },
  reactLabelActive: { color: color.reacted },
  similarity: { fontSize: type.meta.size, fontWeight: type.meta.weight, color: color.tertiary, marginLeft: 'auto', ...fontFix },
  reactionError: { marginTop: space[2] + 2, fontSize: type.meta.size, fontWeight: type.meta.weight, color: color.error, ...fontFix },
});
