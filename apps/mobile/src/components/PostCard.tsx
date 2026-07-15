import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';

import type { Post } from '../types';
import { timeAgo } from '../utils/timeAgo';

const AVATAR_COLORS = ['#6366F1', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#3B82F6'];

interface PostCardProps {
  post: Post;
  isReacting: boolean;
  isReacted: boolean;
  reactionError?: string;
  onReact: (postId: number) => void;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return '?';
  }

  return parts
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
}

function avatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export function PostCard({
  post,
  isReacting,
  isReacted,
  reactionError,
  onReact,
}: PostCardProps) {
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [post.image_url]);

  const color = avatarColor(post.user.name);

  return (
    <View style={styles.card}>
      {/* Author row */}
      <View style={styles.authorRow}>
        <View style={[styles.avatar, { backgroundColor: color }]}>
          <Text style={styles.avatarText}>{initials(post.user.name)}</Text>
        </View>
        <View style={styles.authorText}>
          <Text style={styles.authorName}>{post.user.name}</Text>
          <Text style={styles.timestamp}>{timeAgo(post.created_at)}</Text>
        </View>
        {/* Subtle ranking indicator */}
        {post.ranking ? (
          <View style={styles.scoreBadge}>
            <Text style={styles.scoreText}>{Math.round(post.ranking.score * 100)}%</Text>
          </View>
        ) : null}
      </View>

      {/* Post text */}
      <Text style={styles.postText}>{post.text}</Text>

      {/* Image */}
      {post.image_url && !imageFailed ? (
        <Image
          accessibilityLabel={`Image shared by ${post.user.name}`}
          source={{ uri: post.image_url }}
          style={styles.image}
          resizeMode="cover"
          onError={() => setImageFailed(true)}
        />
      ) : null}

      {post.image_url && imageFailed ? (
        <View style={styles.imageError}>
          <Text style={styles.imageErrorText}>📷 Image unavailable</Text>
        </View>
      ) : null}

      {/* Action row */}
      <View style={styles.actionRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={isReacted ? `Reacted to ${post.user.name}'s post` : `React to ${post.user.name}'s post`}
          accessibilityState={{ disabled: isReacted || isReacting, busy: isReacting }}
          disabled={isReacted || isReacting}
          onPress={() => onReact(post.id)}
          style={({ pressed }) => [
            styles.reactionButton,
            isReacted && styles.reactionButtonActive,
            pressed && !isReacted && styles.reactionButtonPressed,
          ]}
        >
          <Text style={styles.reactionIcon}>{isReacted ? '💛' : '🤍'}</Text>
          {isReacting ? (
            <ActivityIndicator color="#6366F1" size="small" />
          ) : null}
          <Text
            style={[
              styles.reactionText,
              isReacted && styles.reactionTextActive,
            ]}
          >
            {isReacting ? 'Reacting…' : isReacted ? 'Reacted' : 'React'}
          </Text>
        </Pressable>

        {/* Semantic similarity if available */}
        {post.semantic_similarity !== undefined ? (
          <Text style={styles.similarityLabel}>
            {(post.semantic_similarity * 100).toFixed(0)}% match
          </Text>
        ) : null}
      </View>

      {reactionError ? (
        <Text style={styles.reactionError}>{reactionError}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginBottom: 16,
    padding: 20,
    // iOS shadow
    shadowColor: '#1E1B4B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    // Android shadow
    elevation: 3,
  },
  authorRow: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  avatar: {
    alignItems: 'center',
    borderRadius: 24,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  authorText: {
    flex: 1,
    marginLeft: 14,
  },
  authorName: {
    color: '#1E1B4B',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  timestamp: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '500',
    marginTop: 2,
  },
  scoreBadge: {
    backgroundColor: '#F0F0FF',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  scoreText: {
    color: '#6366F1',
    fontSize: 12,
    fontWeight: '700',
  },
  postText: {
    color: '#334155',
    fontSize: 16,
    lineHeight: 25,
    marginTop: 16,
    letterSpacing: 0.1,
  },
  image: {
    aspectRatio: 16 / 10,
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    marginTop: 16,
    width: '100%',
  },
  imageError: {
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    justifyContent: 'center',
    marginTop: 16,
    minHeight: 80,
  },
  imageErrorText: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '500',
  },
  actionRow: {
    alignItems: 'center',
    flexDirection: 'row',
    marginTop: 16,
    gap: 12,
  },
  reactionButton: {
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    minHeight: 42,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  reactionButtonActive: {
    backgroundColor: '#FFF7ED',
    borderColor: '#FED7AA',
  },
  reactionButtonPressed: {
    backgroundColor: '#EEF2FF',
    borderColor: '#C7D2FE',
  },
  reactionIcon: {
    fontSize: 16,
  },
  reactionText: {
    color: '#64748B',
    fontSize: 14,
    fontWeight: '600',
  },
  reactionTextActive: {
    color: '#C2410C',
  },
  similarityLabel: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 'auto',
  },
  reactionError: {
    color: '#DC2626',
    fontSize: 13,
    fontWeight: '500',
    marginTop: 10,
  },
});
