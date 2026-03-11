import React, { useState, useCallback } from 'react';
import { StyleSheet, View, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Linking } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Icon } from '@/components/icon';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

const ACCENT = '#FF6B00';
const BG = '#000000';
const SURFACE = '#111111';
const BORDER = '#1E1E1E';
const TEXT = '#FFFFFF';
const TEXT_MUTED = '#666666';
const TEXT_SECONDARY = '#999999';

type NewsArticle = {
  id: string;
  headline: string;
  description: string;
  published: string;
  link: string;
  image: string | null;
  source: string;
  category: string;
};

const LEAGUE_SLUGS = [
  { id: 'eng.1', name: 'Premier League' },
  { id: 'esp.1', name: 'La Liga' },
  { id: 'ger.1', name: 'Bundesliga' },
  { id: 'ita.1', name: 'Serie A' },
  { id: 'fra.1', name: 'Ligue 1' },
  { id: 'uefa.champions', name: 'Champions League' },
  { id: 'usa.1', name: 'MLS' },
];

async function fetchNews(): Promise<NewsArticle[]> {
  const allArticles: NewsArticle[] = [];
  const seen = new Set<string>();

  const fetches = LEAGUE_SLUGS.slice(0, 5).map((l) =>
    fetch(`https://site.api.espn.com/apis/site/v2/sports/soccer/${l.id}/news?limit=10`)
      .then((r) => r.json())
      .then((data) => ({ data, league: l.name }))
      .catch(() => null),
  );

  const results = await Promise.all(fetches);

  for (const item of results) {
    if (!item || !item.data?.articles) continue;
    for (const a of item.data.articles) {
      if (seen.has(a.id)) continue;
      seen.add(a.id);
      allArticles.push({
        id: String(a.id),
        headline: a.headline || '',
        description: a.description || a.headline || '',
        published: a.published || '',
        link: a.links?.web?.href || '',
        image: a.images?.[0]?.url || null,
        source: a.byline || item.league,
        category: item.league,
      });
    }
  }

  // Sort by date descending
  allArticles.sort((a, b) => new Date(b.published).getTime() - new Date(a.published).getTime());
  return allArticles;
}

function timeAgo(dateStr: string): string {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function NewsScreen() {
  const insets = useSafeAreaInsets();
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [filter, setFilter] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchNews();
      setArticles(data);
      setLoaded(true);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load on first mount
  React.useEffect(() => {
    load();
  }, [load]);

  const categories = React.useMemo(() => {
    const cats = new Set(articles.map((a) => a.category));
    return Array.from(cats);
  }, [articles]);

  const filtered = filter ? articles.filter((a) => a.category === filter) : articles;

  const openArticle = (url: string) => {
    if (url) Linking.openURL(url);
  };

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <ThemedText style={styles.title}>News</ThemedText>
        <TouchableOpacity onPress={load} style={styles.refreshBtn} disabled={loading}>
          {loading ? (
            <ActivityIndicator color={ACCENT} size="small" />
          ) : (
            <Icon sf="arrow.clockwise" material="refresh" size={18} color={TEXT_MUTED} />
          )}
        </TouchableOpacity>
      </View>

      {/* Category Filter */}
      {categories.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterBar} contentInsetAdjustmentBehavior="automatic">
          <TouchableOpacity
            style={[styles.filterChip, !filter && styles.filterChipActive]}
            onPress={() => setFilter(null)}
          >
            <ThemedText style={[styles.filterText, !filter && styles.filterTextActive]}>All</ThemedText>
          </TouchableOpacity>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.filterChip, filter === cat && styles.filterChipActive]}
              onPress={() => setFilter(cat === filter ? null : cat)}
            >
              <ThemedText style={[styles.filterText, filter === cat && styles.filterTextActive]}>{cat}</ThemedText>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Content */}
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
      >
        {loading && articles.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={ACCENT} size="large" />
          </View>
        ) : filtered.length === 0 ? (
          <View style={styles.emptyState}>
            <Icon sf="newspaper" material="article" size={48} color={TEXT_MUTED} />
            <ThemedText style={styles.emptyText}>No news available</ThemedText>
          </View>
        ) : (
          <>
            {/* Hero card */}
            {filtered[0] && (
              <TouchableOpacity
                style={styles.heroCard}
                onPress={() => openArticle(filtered[0].link)}
                activeOpacity={0.85}
              >
                {filtered[0].image ? (
                  <Image source={{ uri: filtered[0].image }} style={styles.heroImage} contentFit="cover" />
                ) : (
                  <View style={styles.heroImagePlaceholder} />
                )}
                <View style={styles.heroContent}>
                  <View style={styles.heroCategoryRow}>
                    <View style={styles.categoryBadge}>
                      <ThemedText style={styles.categoryBadgeText}>{filtered[0].category}</ThemedText>
                    </View>
                    <ThemedText style={styles.heroTime}>{timeAgo(filtered[0].published)}</ThemedText>
                  </View>
                  <ThemedText style={styles.heroHeadline} numberOfLines={3}>
                    {filtered[0].headline}
                  </ThemedText>
                  <ThemedText style={styles.heroDesc} numberOfLines={2}>
                    {filtered[0].description}
                  </ThemedText>
                </View>
              </TouchableOpacity>
            )}

            {/* Article list */}
            <View style={styles.articleList}>
              {filtered.slice(1).map((article, idx) => (
                <TouchableOpacity
                  key={article.id}
                  style={[styles.articleRow, idx < filtered.length - 2 && styles.articleRowBorder]}
                  onPress={() => openArticle(article.link)}
                  activeOpacity={0.75}
                >
                  <View style={styles.articleInfo}>
                    <View style={styles.articleMeta}>
                      <ThemedText style={styles.articleCategory}>{article.category}</ThemedText>
                      <ThemedText style={styles.articleTime}>{timeAgo(article.published)}</ThemedText>
                    </View>
                    <ThemedText style={styles.articleHeadline} numberOfLines={2}>
                      {article.headline}
                    </ThemedText>
                    <ThemedText style={styles.articleDesc} numberOfLines={1}>
                      {article.description}
                    </ThemedText>
                  </View>
                  {article.image && (
                    <Image source={{ uri: article.image }} style={styles.articleThumb} contentFit="cover" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  title: { fontSize: 22, fontWeight: '800', color: TEXT, letterSpacing: -0.5 },
  refreshBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBar: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: SURFACE,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  filterChipActive: {
    backgroundColor: ACCENT,
    borderColor: ACCENT,
  },
  filterText: {
    fontSize: 13,
    fontWeight: '500',
    color: TEXT_MUTED,
    lineHeight: 27,
  },
  filterTextActive: {
    color: '#000',
    fontWeight: '600',
  },
  scrollContent: { paddingBottom: 40 },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 300,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    gap: 16,
  },
  emptyText: { fontSize: 15, color: TEXT_MUTED, fontWeight: '500' },
  heroCard: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 16,
    backgroundColor: SURFACE,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: BORDER,
    overflow: 'hidden',
  },
  heroImage: { width: '100%', height: 200 },
  heroImagePlaceholder: { width: '100%', height: 200, backgroundColor: '#1A1A1A' },
  heroContent: { padding: 14 },
  heroCategoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryBadge: {
    backgroundColor: '#1A0A00',
    borderWidth: 1,
    borderColor: '#3A1500',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  categoryBadgeText: { fontSize: 11, fontWeight: '600', color: ACCENT },
  heroTime: { fontSize: 12, color: TEXT_MUTED },
  heroHeadline: {
    fontSize: 17,
    fontWeight: '700',
    color: TEXT,
    lineHeight: 24,
    marginBottom: 6,
  },
  heroDesc: { fontSize: 13, color: TEXT_SECONDARY, lineHeight: 19 },
  articleList: {
    marginHorizontal: 16,
    backgroundColor: SURFACE,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: BORDER,
    overflow: 'hidden',
  },
  articleRow: {
    flexDirection: 'row',
    padding: 14,
    gap: 12,
    alignItems: 'flex-start',
  },
  articleRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  articleInfo: { flex: 1 },
  articleMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  articleCategory: { fontSize: 11, fontWeight: '600', color: ACCENT },
  articleTime: { fontSize: 11, color: TEXT_MUTED },
  articleHeadline: {
    fontSize: 14,
    fontWeight: '600',
    color: TEXT,
    lineHeight: 20,
    marginBottom: 4,
  },
  articleDesc: { fontSize: 12, color: TEXT_SECONDARY },
  articleThumb: {
    width: 72,
    height: 72,
    borderRadius: 6,
    backgroundColor: '#1A1A1A',
    flexShrink: 0,
  },
});
