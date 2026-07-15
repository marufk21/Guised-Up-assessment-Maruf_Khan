import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { ApiError, createInteraction, fetchFeed, getConfigurationError, searchPosts } from '../api';
import { HeaderBrand } from '../components/HeaderBrand';
import { PostCard } from '../components/PostCard';
import { PostCardSkeleton } from '../components/PostCardSkeleton';
import { StateMessage } from '../components/StateMessage';
import { color, duration, layout, radius, space, touch, type } from '../design';
import type { FeedPaginationMeta, Post } from '../types';

// ── Helpers ────────────────────────────────────────────────────
type FirstPageMode = 'initial' | 'retry' | 'refresh';

function messageFor(error: unknown): string {
  return error instanceof ApiError ? error.message : 'Something went wrong. Try again.';
}

function appendUniquePosts(current: Post[], incoming: Post[]): Post[] {
  const ids = new Set(current.map((p) => p.id));
  return [...current, ...incoming.filter((p) => {
    if (ids.has(p.id)) return false;
    ids.add(p.id);
    return true;
  })];
}

// ── FeedScreen ─────────────────────────────────────────────────
export function FeedScreen() {
  const configErr = useMemo(() => getConfigurationError(), []);

  // Feed
  const [posts, setPosts] = useState<Post[]>([]);
  const [meta, setMeta] = useState<FeedPaginationMeta | null>(null);
  const [loading, setLoading] = useState(!configErr);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  // Refresh
  const [refreshing, setRefreshing] = useState(false);
  const [refreshErr, setRefreshErr] = useState<string | null>(null);

  // Pagination
  const [pageLoading, setPageLoading] = useState(false);
  const [pageErr, setPageErr] = useState<string | null>(null);

  // Search
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Post[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchErr, setSearchErr] = useState<string | null>(null);
  const [searchKey, setSearchKey] = useState(0);

  // Reaction
  const [reacting, setReacting] = useState<Set<number>>(new Set());
  const [reacted, setReacted] = useState<Set<number>>(new Set());
  const [reactErrs, setReactErrs] = useState<Map<number, string>>(new Map());

  // Refs
  const mounted = useRef(true);
  const didFirst = useRef(false);
  const firstCtrl = useRef<AbortController | null>(null);
  const pageCtrl = useRef<AbortController | null>(null);
  const searchCtrl = useRef<AbortController | null>(null);
  const seq = useRef(0);
  const loaded = useRef<Set<number>>(new Set());
  const reactingRef = useRef<Set<number>>(new Set());
  const reactedRef = useRef<Set<number>>(new Set());
  const rxCtrls = useRef<Map<number, AbortController>>(new Map());

  // Animation
  const headerFade = useRef(new Animated.Value(0)).current;

  const q = query.trim();
  const searchMode = q.length > 0;
  const showSkeleton = loading && !ready && !loadErr;

  // ── Load first page ──────────────────────────────────────────
  const loadFirst = useCallback(async (mode: FirstPageMode) => {
    if (configErr || firstCtrl.current) return;
    const ctrl = new AbortController();
    firstCtrl.current = ctrl;

    if (mode === 'refresh') {
      pageCtrl.current?.abort(); pageCtrl.current = null;
      setPageLoading(false); setRefreshing(true);
      setRefreshErr(null); setPageErr(null);
    } else {
      setLoading(true); setLoadErr(null);
    }

    try {
      const r = await fetchFeed(1, ctrl.signal);
      if (!mounted.current || ctrl.signal.aborted) return;
      setPosts(r.data); setMeta(r.meta);
      setRefreshErr(null); setPageErr(null);
      loaded.current = new Set([1]);
      setReady(true);
    } catch (e) {
      if (!mounted.current || ctrl.signal.aborted) return;
      if (mode === 'refresh') setRefreshErr(messageFor(e));
      else setLoadErr(messageFor(e));
    } finally {
      if (firstCtrl.current === ctrl) firstCtrl.current = null;
      if (mounted.current) mode === 'refresh' ? setRefreshing(false) : setLoading(false);
    }
  }, [configErr]);

  // ── Init ─────────────────────────────────────────────────────
  useEffect(() => {
    mounted.current = true;
    if (!didFirst.current && !configErr) {
      didFirst.current = true;
      void loadFirst('initial');
    }
    Animated.timing(headerFade, { toValue: 1, duration: duration.slow, useNativeDriver: true }).start();

    return () => {
      mounted.current = false;
      firstCtrl.current?.abort(); pageCtrl.current?.abort();
      searchCtrl.current?.abort();
      rxCtrls.current.forEach((c) => c.abort());
      rxCtrls.current.clear();
    };
  }, [configErr, loadFirst, headerFade]);

  // ── Search ───────────────────────────────────────────────────
  useEffect(() => {
    searchCtrl.current?.abort(); seq.current++;
    const s = seq.current;

    if (!searchMode || configErr) {
      setSearching(false); setSearchErr(null); setResults([]);
      return;
    }

    setSearching(true); setSearchErr(null); setResults([]);
    const t = setTimeout(() => {
      const ctrl = new AbortController(); searchCtrl.current = ctrl;
      searchPosts(q, ctrl.signal)
        .then((r) => { if (mounted.current && s === seq.current && !ctrl.signal.aborted) setResults(r.data); })
        .catch((e) => { if (mounted.current && s === seq.current && !ctrl.signal.aborted) { setSearchErr(messageFor(e)); setResults([]); } })
        .finally(() => { if (searchCtrl.current === ctrl) searchCtrl.current = null; if (mounted.current && s === seq.current && !ctrl.signal.aborted) setSearching(false); });
    }, 350);
    return () => { clearTimeout(t); searchCtrl.current?.abort(); };
  }, [configErr, searchMode, searchKey, q]);

  // ── Pagination ───────────────────────────────────────────────
  const nextPage = useCallback(async (retry = false) => {
    if (searchMode || !meta?.has_more_pages || pageLoading || (pageErr && !retry) || pageCtrl.current) return;
    const np = meta.current_page + 1;
    if (loaded.current.has(np)) return;

    const ctrl = new AbortController(); pageCtrl.current = ctrl;
    setPageErr(null); setPageLoading(true);

    try {
      const r = await fetchFeed(np, ctrl.signal);
      if (!mounted.current || ctrl.signal.aborted) return;
      setPosts((p) => appendUniquePosts(p, r.data));
      setMeta(r.meta); loaded.current.add(np); setPageErr(null);
    } catch (e) {
      if (mounted.current && !ctrl.signal.aborted) setPageErr(messageFor(e));
    } finally {
      if (pageCtrl.current === ctrl) pageCtrl.current = null;
      if (mounted.current && !ctrl.signal.aborted) setPageLoading(false);
    }
  }, [meta, searchMode, pageErr, pageLoading]);

  // ── Refresh ──────────────────────────────────────────────────
  const doRefresh = useCallback(() => {
    if (!searchMode && !loading && !refreshing) void loadFirst('refresh');
  }, [loading, searchMode, loadFirst, refreshing]);

  // ── React ────────────────────────────────────────────────────
  const doReact = useCallback(async (id: number) => {
    if (reactingRef.current.has(id) || reactedRef.current.has(id)) return;
    const ctrl = new AbortController();
    reactingRef.current.add(id); rxCtrls.current.set(id, ctrl);
    setReacting(new Set(reactingRef.current));
    setReactErrs((p) => { const n = new Map(p); n.delete(id); return n; });

    try {
      await createInteraction(id, ctrl.signal);
      if (!mounted.current || ctrl.signal.aborted) return;
      reactedRef.current.add(id);
      setReacted(new Set(reactedRef.current));
    } catch (e) {
      if (mounted.current && !ctrl.signal.aborted) setReactErrs((p) => new Map(p).set(id, messageFor(e)));
    } finally {
      reactingRef.current.delete(id); rxCtrls.current.delete(id);
      if (mounted.current) setReacting(new Set(reactingRef.current));
    }
  }, []);

  // ── Render helpers ───────────────────────────────────────────
  const data = searchMode ? results : posts;

  const renderEmpty = () => {
    if (configErr) return <StateMessage title="Setup Required" msg={configErr} />;
    if (searchMode) {
      if (searching) return <StateMessage title="Searching" msg="Matching posts by meaning, not keywords." loading />;
      if (searchErr) return <StateMessage title="Search Failed" msg={searchErr} action="Retry" onAction={() => setSearchKey((k) => k + 1)} />;
      return <StateMessage title="No Results" msg="Nothing matched that phrase. Try different words." />;
    }
    if (loading && !ready) return null;
    if (loadErr) return <StateMessage title="Couldn't Load Feed" msg={loadErr} action="Retry" onAction={() => void loadFirst('retry')} />;
    return <StateMessage title="All Quiet" msg="No posts yet. Stories will appear here soon." />;
  };

  const renderFooter = () => {
    if (searchMode) return null;
    if (pageLoading) return (
      <View style={styles.foot}>
        <ActivityIndicator color={color.accent} size="small" />
        <Text style={styles.footText}>Loading more posts</Text>
      </View>
    );
    if (pageErr) return (
      <View style={styles.footErr}>
        <Text style={styles.footErrText}>{pageErr}</Text>
        <Pressable onPress={() => void nextPage(true)} style={styles.footBtn}>
          <Text style={styles.footBtnText}>Retry</Text>
        </Pressable>
      </View>
    );
    return null;
  };

  const postAnimRefs = useRef<Map<number, Animated.Value>>(new Map());
  const renderPost = useCallback(({ item, index }: { item: Post; index: number }) => {
    if (!postAnimRefs.current.has(item.id)) {
      const anim = new Animated.Value(0);
      postAnimRefs.current.set(item.id, anim);
      Animated.timing(anim, {
        toValue: 1,
        duration: duration.normal,
        delay: Math.min(index * 30, 300),
        useNativeDriver: true,
      }).start();
    }
    const animVal = postAnimRefs.current.get(item.id)!;

    return (
      <Animated.View style={{ opacity: animVal, transform: [{ translateY: animVal.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }] }}>
        <PostCard
          post={item}
          isReacting={reacting.has(item.id)}
          isReacted={reacted.has(item.id)}
          reactionError={reactErrs.get(item.id)}
          onReact={doReact}
        />
      </Animated.View>
    );
  }, [reacting, reacted, reactErrs, doReact]);

  useEffect(() => {
    const currentIds = new Set(data.map((p) => p.id));
    postAnimRefs.current.forEach((_, id) => { if (!currentIds.has(id)) postAnimRefs.current.delete(id); });
  }, [data]);

  // ── Skeleton ─────────────────────────────────────────────────
  if (showSkeleton) {
    return (
      <View style={styles.screen}>
        <Animated.View style={[styles.hdr, { opacity: headerFade }]}>
          <HeaderBrand />
          <View style={styles.sbox}>
            <Text style={styles.sicon}>🔍</Text>
            <TextInput
              placeholder="Search anything..."
              placeholderTextColor={color.tertiary}
              editable={false}
              keyboardAppearance="dark"
              style={styles.sinput}
            />
          </View>
        </Animated.View>
        <View style={styles.skelList}>
          <PostCardSkeleton />
          <PostCardSkeleton />
          <PostCardSkeleton />
          <PostCardSkeleton />
        </View>
      </View>
    );
  }

  // ── Main ─────────────────────────────────────────────────────
  return (
    <FlatList
      data={data}
      keyExtractor={(p) => String(p.id)}
      renderItem={renderPost}
      ListHeaderComponent={
        <Animated.View style={[styles.hdr, { opacity: headerFade }]}>
          <HeaderBrand />
          <View style={styles.sbox}>
            <Text style={styles.sicon}>🔍</Text>
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search anything..."
              placeholderTextColor={color.tertiary}
              autoCapitalize="sentences"
              autoCorrect
              clearButtonMode="while-editing"
              returnKeyType="search"
              keyboardAppearance="dark"
              style={styles.sinput}
            />
          </View>

          {searchMode && !searching && !searchErr && (
            <Text style={styles.slabel}>Results for "{q}"</Text>
          )}

          {!searchMode && refreshErr && (
            <View style={styles.rerr}>
              <Text style={styles.rerrText}>{refreshErr}</Text>
              <Pressable onPress={doRefresh} style={styles.rerrBtn}>
                <Text style={styles.rerrBtnText}>Retry</Text>
              </Pressable>
            </View>
          )}
        </Animated.View>
      }
      ListEmptyComponent={renderEmpty}
      ListFooterComponent={renderFooter}
      contentContainerStyle={styles.listContent}
      keyboardDismissMode="on-drag"
      keyboardShouldPersistTaps="handled"
      onEndReached={() => void nextPage()}
      onEndReachedThreshold={0.35}
      refreshControl={
        <RefreshControl
          colors={[color.accent]}
          enabled={!searchMode}
          onRefresh={doRefresh}
          refreshing={!searchMode && refreshing}
          tintColor={color.accent}
          progressBackgroundColor={color.card}
        />
      }
      showsVerticalScrollIndicator={false}
      style={styles.screen}
    />
  );
}

// ── Styles ──────────────────────────────────────────────────────
const fontFix = Platform.select({ ios: {}, android: { includeFontPadding: false } });

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.bg },
  listContent: { flexGrow: 1, paddingBottom: space[8], paddingHorizontal: layout.pagePadding },
  skelList: { paddingHorizontal: layout.pagePadding, paddingTop: space[2] },

  hdr: { paddingTop: layout.headerTop, paddingBottom: space[1] },

  // Search
  sbox: {
    flexDirection: 'row', alignItems: 'center',
    marginTop: space[6], backgroundColor: color.elevated,
    borderRadius: radius.lg, paddingHorizontal: space[4],
    borderWidth: 1, borderColor: color.hairline,
  },
  sicon: { fontSize: 16, marginRight: space[2] },
  sinput: { flex: 1, fontSize: type.label.size - 1, fontWeight: '400', color: color.primary, minHeight: 50, paddingVertical: space[4] - 2, ...fontFix },
  slabel: { fontSize: type.meta.size, fontWeight: type.meta.weight, color: color.accent, marginTop: space[3], ...fontFix },

  // Refresh error
  rerr: {
    flexDirection: 'row', alignItems: 'center', gap: space[2],
    backgroundColor: color.errorBg, borderRadius: radius.md,
    paddingHorizontal: space[4], paddingVertical: space[2] + 2, marginTop: space[4],
  },
  rerrText: { flex: 1, fontSize: type.meta.size, fontWeight: type.meta.weight, color: color.error },
  rerrBtn: { minHeight: touch.min, justifyContent: 'center', paddingHorizontal: space[2] },
  rerrBtnText: { fontSize: type.meta.size, fontWeight: '700', color: color.accent },

  // Footer
  foot: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space[2], paddingVertical: space[5] },
  footText: { fontSize: type.meta.size, fontWeight: type.meta.weight, color: color.tertiary, ...fontFix },
  footErr: { alignItems: 'center', paddingVertical: space[5] },
  footErrText: { fontSize: type.meta.size, fontWeight: type.meta.weight, color: color.error, textAlign: 'center' },
  footBtn: { minHeight: touch.min, minWidth: 80, alignItems: 'center', justifyContent: 'center', marginTop: space[1] },
  footBtnText: { fontSize: type.meta.size, fontWeight: '700', color: color.accent },
});
