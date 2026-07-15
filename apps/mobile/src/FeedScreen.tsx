import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { ApiError, createInteraction, fetchFeed, getConfigurationError, searchPosts } from './api';
import { PostCard } from './components/PostCard';
import type { FeedPaginationMeta, Post } from './types';

type FirstPageMode = 'initial' | 'retry' | 'refresh';

function messageFor(error: unknown): string {
  return error instanceof ApiError ? error.message : 'Something went wrong. Please try again.';
}

function appendUniquePosts(current: Post[], incoming: Post[]): Post[] {
  const knownIds = new Set(current.map((post) => post.id));
  const uniqueIncoming = incoming.filter((post) => {
    if (knownIds.has(post.id)) {
      return false;
    }

    knownIds.add(post.id);
    return true;
  });

  return [...current, ...uniqueIncoming];
}

interface StateMessageProps {
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  loading?: boolean;
}

function StateMessage({ title, message, actionLabel, onAction, loading = false }: StateMessageProps) {
  return (
    <View style={styles.stateContainer}>
      {loading ? (
        <View style={styles.loadingPill}>
          <ActivityIndicator color="#6366F1" size="large" />
        </View>
      ) : null}
      <Text style={styles.stateTitle}>{title}</Text>
      <Text style={styles.stateMessage}>{message}</Text>
      {actionLabel && onAction ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
          onPress={onAction}
          style={({ pressed }) => [styles.primaryButton, pressed && styles.primaryButtonPressed]}
        >
          <Text style={styles.primaryButtonText}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function FeedScreen() {
  const configurationError = useMemo(() => getConfigurationError(), []);
  const [posts, setPosts] = useState<Post[]>([]);
  const [feedMeta, setFeedMeta] = useState<FeedPaginationMeta | null>(null);
  const [initialLoading, setInitialLoading] = useState(configurationError === null);
  const [initialError, setInitialError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const [paginationLoading, setPaginationLoading] = useState(false);
  const [paginationError, setPaginationError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [searchResults, setSearchResults] = useState<Post[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchRetryKey, setSearchRetryKey] = useState(0);
  const [reactingIds, setReactingIds] = useState<Set<number>>(() => new Set());
  const [reactedIds, setReactedIds] = useState<Set<number>>(() => new Set());
  const [reactionErrors, setReactionErrors] = useState<Map<number, string>>(() => new Map());

  const mountedRef = useRef(true);
  const didRequestInitialRef = useRef(false);
  const firstPageControllerRef = useRef<AbortController | null>(null);
  const paginationControllerRef = useRef<AbortController | null>(null);
  const searchControllerRef = useRef<AbortController | null>(null);
  const searchSequenceRef = useRef(0);
  const loadedPagesRef = useRef<Set<number>>(new Set());
  const reactingIdsRef = useRef<Set<number>>(new Set());
  const reactedIdsRef = useRef<Set<number>>(new Set());
  const reactionControllersRef = useRef<Map<number, AbortController>>(new Map());

  const trimmedQuery = searchInput.trim();
  const isSearchMode = trimmedQuery.length > 0;

  const loadFirstPage = useCallback(async (mode: FirstPageMode) => {
    if (configurationError || firstPageControllerRef.current) {
      return;
    }

    const controller = new AbortController();
    firstPageControllerRef.current = controller;

    if (mode === 'refresh') {
      paginationControllerRef.current?.abort();
      paginationControllerRef.current = null;
      setPaginationLoading(false);
      setRefreshing(true);
      setRefreshError(null);
      setPaginationError(null);
    } else {
      setInitialLoading(true);
      setInitialError(null);
    }

    try {
      const response = await fetchFeed(1, controller.signal);

      if (!mountedRef.current || controller.signal.aborted) {
        return;
      }

      setPosts(response.data);
      setFeedMeta(response.meta);
      setRefreshError(null);
      setPaginationError(null);
      loadedPagesRef.current = new Set([1]);
    } catch (error: unknown) {
      if (!mountedRef.current || controller.signal.aborted) {
        return;
      }

      if (mode === 'refresh') {
        setRefreshError(messageFor(error));
      } else {
        setInitialError(messageFor(error));
      }
    } finally {
      if (firstPageControllerRef.current === controller) {
        firstPageControllerRef.current = null;
      }

      if (mountedRef.current) {
        mode === 'refresh' ? setRefreshing(false) : setInitialLoading(false);
      }
    }
  }, [configurationError]);

  useEffect(() => {
    mountedRef.current = true;

    if (!didRequestInitialRef.current && !configurationError) {
      didRequestInitialRef.current = true;
      void loadFirstPage('initial');
    }

    return () => {
      mountedRef.current = false;
      firstPageControllerRef.current?.abort();
      paginationControllerRef.current?.abort();
      searchControllerRef.current?.abort();
      reactionControllersRef.current.forEach((controller) => controller.abort());
      reactionControllersRef.current.clear();
    };
  }, [configurationError, loadFirstPage]);

  useEffect(() => {
    searchControllerRef.current?.abort();
    searchSequenceRef.current += 1;
    const sequence = searchSequenceRef.current;

    if (!isSearchMode || configurationError) {
      setSearchLoading(false);
      setSearchError(null);
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    setSearchError(null);
    setSearchResults([]);

    const timeout = setTimeout(() => {
      const controller = new AbortController();
      searchControllerRef.current = controller;

      void searchPosts(trimmedQuery, controller.signal)
        .then((response) => {
          if (mountedRef.current && sequence === searchSequenceRef.current && !controller.signal.aborted) {
            setSearchResults(response.data);
          }
        })
        .catch((error: unknown) => {
          if (mountedRef.current && sequence === searchSequenceRef.current && !controller.signal.aborted) {
            setSearchError(messageFor(error));
            setSearchResults([]);
          }
        })
        .finally(() => {
          if (searchControllerRef.current === controller) {
            searchControllerRef.current = null;
          }

          if (mountedRef.current && sequence === searchSequenceRef.current && !controller.signal.aborted) {
            setSearchLoading(false);
          }
        });
    }, 350);

    return () => {
      clearTimeout(timeout);
      searchControllerRef.current?.abort();
    };
  }, [configurationError, isSearchMode, searchRetryKey, trimmedQuery]);

  const loadNextPage = useCallback(async (isRetry = false) => {
    if (
      isSearchMode ||
      !feedMeta?.has_more_pages ||
      paginationLoading ||
      (paginationError && !isRetry) ||
      paginationControllerRef.current
    ) {
      return;
    }

    const nextPage = feedMeta.current_page + 1;
    if (loadedPagesRef.current.has(nextPage)) {
      return;
    }

    const controller = new AbortController();
    paginationControllerRef.current = controller;
    setPaginationError(null);
    setPaginationLoading(true);

    try {
      const response = await fetchFeed(nextPage, controller.signal);

      if (!mountedRef.current || controller.signal.aborted) {
        return;
      }

      setPosts((current) => appendUniquePosts(current, response.data));
      setFeedMeta(response.meta);
      loadedPagesRef.current.add(nextPage);
      setPaginationError(null);
    } catch (error: unknown) {
      if (mountedRef.current && !controller.signal.aborted) {
        setPaginationError(messageFor(error));
      }
    } finally {
      if (paginationControllerRef.current === controller) {
        paginationControllerRef.current = null;
      }

      if (mountedRef.current && !controller.signal.aborted) {
        setPaginationLoading(false);
      }
    }
  }, [feedMeta, isSearchMode, paginationError, paginationLoading]);

  const refreshFeed = useCallback(() => {
    if (!isSearchMode && !initialLoading && !refreshing) {
      void loadFirstPage('refresh');
    }
  }, [initialLoading, isSearchMode, loadFirstPage, refreshing]);

  const reactToPost = useCallback(async (postId: number) => {
    if (reactingIdsRef.current.has(postId) || reactedIdsRef.current.has(postId)) {
      return;
    }

    const controller = new AbortController();
    reactingIdsRef.current.add(postId);
    reactionControllersRef.current.set(postId, controller);
    setReactingIds(new Set(reactingIdsRef.current));
    setReactionErrors((current) => {
      const next = new Map(current);
      next.delete(postId);
      return next;
    });

    try {
      await createInteraction(postId, controller.signal);

      if (!mountedRef.current || controller.signal.aborted) {
        return;
      }

      reactedIdsRef.current.add(postId);
      setReactedIds(new Set(reactedIdsRef.current));
    } catch (error: unknown) {
      if (mountedRef.current && !controller.signal.aborted) {
        setReactionErrors((current) => new Map(current).set(postId, messageFor(error)));
      }
    } finally {
      reactingIdsRef.current.delete(postId);
      reactionControllersRef.current.delete(postId);

      if (mountedRef.current) {
        setReactingIds(new Set(reactingIdsRef.current));
      }
    }
  }, []);

  const listData = isSearchMode ? searchResults : posts;

  const renderEmptyState = () => {
    if (configurationError) {
      return (
        <StateMessage
          title="Configuration Needed"
          message={configurationError}
        />
      );
    }

    if (isSearchMode) {
      if (searchLoading) {
        return (
          <StateMessage
            title="Searching…"
            message="Finding posts that match the meaning of your words."
            loading
          />
        );
      }

      if (searchError) {
        return (
          <StateMessage
            title="Search Unavailable"
            message={searchError}
            actionLabel="Try Again"
            onAction={() => setSearchRetryKey((current) => current + 1)}
          />
        );
      }

      return (
        <StateMessage
          title="No Results"
          message="No posts match that phrase. Try a different search."
        />
      );
    }

    if (initialLoading) {
      return (
        <StateMessage
          title="Curating Your Feed"
          message="Finding the most authentic, relevant connections…"
          loading
        />
      );
    }

    if (initialError) {
      return (
        <StateMessage
          title="Feed Unavailable"
          message={initialError}
          actionLabel="Retry"
          onAction={() => void loadFirstPage('retry')}
        />
      );
    }

    return (
      <StateMessage
        title="Your Feed is Quiet"
        message="No posts yet. When people share, their stories will appear here."
      />
    );
  };

  const renderFooter = () => {
    if (isSearchMode) {
      return null;
    }

    if (paginationLoading) {
      return (
        <View style={styles.footerRow}>
          <ActivityIndicator color="#6366F1" size="small" />
          <Text style={styles.footerText}>Loading more…</Text>
        </View>
      );
    }

    if (paginationError) {
      return (
        <View style={styles.footerError}>
          <Text style={styles.footerErrorText}>{paginationError}</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Retry loading more posts"
            onPress={() => void loadNextPage(true)}
            style={styles.footerRetryBtn}
          >
            <Text style={styles.footerRetryText}>Retry</Text>
          </Pressable>
        </View>
      );
    }

    return null;
  };

  return (
    <FlatList
      data={listData}
      keyExtractor={(post) => String(post.id)}
      renderItem={({ item }) => (
        <PostCard
          post={item}
          isReacting={reactingIds.has(item.id)}
          isReacted={reactedIds.has(item.id)}
          reactionError={reactionErrors.get(item.id)}
          onReact={reactToPost}
        />
      )}
      ListHeaderComponent={
        <View style={styles.header}>
          {/* Branding */}
          <View style={styles.brandRow}>
            <View style={styles.logoMark} />
            <Text style={styles.eyebrow}>GUISED UP</Text>
          </View>
          <Text style={styles.title}>Real Connections</Text>
          <Text style={styles.subtitle}>
            Stories ranked by authenticity, not popularity.
          </Text>

          {/* Search */}
          <View style={styles.searchContainer}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              accessibilityLabel="Search posts using natural language"
              autoCapitalize="sentences"
              autoCorrect
              clearButtonMode="while-editing"
              onChangeText={setSearchInput}
              placeholder={'Try "travel stories from last week"'}
              placeholderTextColor="#94A3B8"
              returnKeyType="search"
              style={styles.searchInput}
              value={searchInput}
            />
          </View>

          {isSearchMode && !searchLoading && !searchError ? (
            <View style={styles.searchBadge}>
              <Text style={styles.searchBadgeText}>
                Results for "{trimmedQuery}"
              </Text>
            </View>
          ) : null}

          {!isSearchMode && refreshError ? (
            <View style={styles.inlineError}>
              <Text style={styles.inlineErrorText}>{refreshError}</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Retry refreshing feed"
                onPress={refreshFeed}
                style={styles.inlineRetry}
              >
                <Text style={styles.inlineRetryText}>Retry</Text>
              </Pressable>
            </View>
          ) : null}
        </View>
      }
      ListEmptyComponent={renderEmptyState}
      ListFooterComponent={renderFooter}
      contentContainerStyle={styles.listContent}
      keyboardDismissMode="on-drag"
      keyboardShouldPersistTaps="handled"
      onEndReached={() => void loadNextPage()}
      onEndReachedThreshold={0.35}
      refreshControl={
        <RefreshControl
          colors={['#6366F1']}
          enabled={!isSearchMode}
          onRefresh={refreshFeed}
          refreshing={!isSearchMode && refreshing}
          tintColor="#6366F1"
        />
      }
      showsVerticalScrollIndicator={false}
      style={styles.screen}
    />
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: '#FAFAFE',
    flex: 1,
  },
  listContent: {
    flexGrow: 1,
    paddingBottom: 32,
    paddingHorizontal: 16,
  },
  header: {
    paddingBottom: 8,
    paddingTop: 48,
  },
  brandRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  logoMark: {
    backgroundColor: '#6366F1',
    borderRadius: 6,
    height: 18,
    width: 18,
  },
  eyebrow: {
    color: '#6366F1',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 2,
  },
  title: {
    color: '#0F172A',
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -0.8,
    marginTop: 12,
  },
  subtitle: {
    color: '#64748B',
    fontSize: 16,
    fontWeight: '500',
    letterSpacing: -0.2,
    lineHeight: 22,
    marginTop: 6,
  },
  searchContainer: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    marginTop: 24,
    paddingHorizontal: 16,
    // iOS shadow
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    // Android
    elevation: 1,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 10,
  },
  searchInput: {
    color: '#0F172A',
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    minHeight: 52,
    paddingVertical: 14,
  },
  searchBadge: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchBadgeText: {
    color: '#6366F1',
    fontSize: 13,
    fontWeight: '600',
  },
  inlineError: {
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  inlineErrorText: {
    color: '#DC2626',
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
  },
  inlineRetry: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  inlineRetryText: {
    color: '#6366F1',
    fontSize: 13,
    fontWeight: '700',
  },
  stateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 360,
    paddingHorizontal: 28,
    paddingVertical: 48,
  },
  loadingPill: {
    backgroundColor: '#EEF2FF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
  },
  stateTitle: {
    color: '#0F172A',
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  stateMessage: {
    color: '#64748B',
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 22,
    marginTop: 8,
    textAlign: 'center',
    maxWidth: 320,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: '#6366F1',
    borderRadius: 14,
    justifyContent: 'center',
    marginTop: 24,
    minHeight: 48,
    paddingHorizontal: 28,
  },
  primaryButtonPressed: {
    backgroundColor: '#4F46E5',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  footerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'center',
    paddingVertical: 20,
  },
  footerText: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '500',
  },
  footerError: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  footerErrorText: {
    color: '#DC2626',
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
  footerRetryBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    minHeight: 44,
    minWidth: 80,
  },
  footerRetryText: {
    color: '#6366F1',
    fontSize: 14,
    fontWeight: '700',
  },
});
