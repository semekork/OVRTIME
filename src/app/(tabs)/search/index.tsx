import React, { useState, useCallback, useRef } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, ActivityIndicator, Platform, TextInput } from 'react-native';
import { useNavigation } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Icon } from '@/components/icon';
import { LEAGUES, FEATURED_LEAGUES, searchLeagues } from '@/utils/leagues';

const ACCENT = '#FF6B00';
const BG = '#000000';
const SURFACE = '#111111';
const BORDER = '#1E1E1E';
const TEXT = '#FFFFFF';
const TEXT_MUTED = '#666666';
const TEXT_SECONDARY = '#999999';

type SearchResult = {
  id: string;
  type: 'team' | 'league';
  name: string;
  shortName?: string;
  logo?: string;
  description?: string;
  leagueSlug?: string;
};

async function searchESPN(query: string): Promise<SearchResult[]> {
  if (!query.trim()) return [];
  const localLeagues = searchLeagues(query).map(
    (l): SearchResult => ({
      id: l.id,
      type: 'league',
      name: l.name,
      description: l.country,
      logo: l.logo || undefined,
      leagueSlug: l.id,
    }),
  );

  try {
    const url = `https://site.api.espn.com/apis/search/v2?query=${encodeURIComponent(query)}&limit=12&sport=soccer`;
    const res = await fetch(url);
    const data = await res.json();
    const espnResults: SearchResult[] = [];
    if (data?.hits?.hits) {
      for (const hit of data.hits.hits) {
        const src = hit._source || {};
        if (!src.displayName && !src.name) continue;
        espnResults.push({
          id: src.uid || hit._id,
          type: src.type === 'league' ? 'league' : 'team',
          name: src.displayName || src.name || '',
          shortName: src.abbreviation || src.shortDisplayName,
          logo: src.logos?.[0]?.href || src.logo,
          description: src.location || src.country || src.description,
        });
      }
    }
    const allNames = new Set(localLeagues.map((r) => r.name.toLowerCase()));
    const deduped = espnResults.filter((r) => !allNames.has(r.name.toLowerCase()));
    return [...localLeagues, ...deduped].slice(0, 20);
  } catch {
    return localLeagues;
  }
}

function runSearch(
  text: string,
  debounceRef: React.MutableRefObject<ReturnType<typeof setTimeout> | null>,
  setLoading: (v: boolean) => void,
  setResults: (v: SearchResult[]) => void,
  setSearched: (v: boolean) => void,
) {
  if (debounceRef.current) clearTimeout(debounceRef.current);
  if (!text.trim()) {
    setResults([]);
    setSearched(false);
    return;
  }
  debounceRef.current = setTimeout(async () => {
    setLoading(true);
    const r = await searchESPN(text);
    setResults(r);
    setSearched(true);
    setLoading(false);
  }, 350);
}

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const navigation = useNavigation();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // iOS: wire up native search bar from the Stack header
  React.useLayoutEffect(() => {
    if (Platform.OS !== 'ios') return;
    navigation.setOptions({
      headerSearchBarOptions: {
        placeholder: 'Search by team, league, or competition...',
        hideWhenScrolling: false,
        onChangeText: (e: { nativeEvent: { text: string } }) => {
          const text = e.nativeEvent.text;
          setQuery(text);
          runSearch(text, debounceRef, setLoading, setResults, setSearched);
        },
        onCancelButtonPress: () => {
          setQuery('');
          setResults([]);
          setSearched(false);
        },
      },
    });
  }, [navigation]);

  const goToLeague = (id: string) => {
    router.push(`/league/${id}`);
  };

  const showingResults = query.trim().length > 0;

  return (
    <ThemedView style={styles.container}>
      {/* Android: manual TextInput search bar */}
      {Platform.OS !== 'ios' && (
        <View style={[styles.androidSearchBar, { paddingTop: insets.top + 8 }]}>
          <View style={styles.androidSearchInputRow}>
            <Icon sf="magnifyingglass" material="search" size={18} color={TEXT_MUTED} />
            <TextInput
              style={styles.androidSearchInput}
              placeholder="Search leagues or teams..."
              placeholderTextColor={TEXT_MUTED}
              value={query}
              onChangeText={(text) => {
                setQuery(text);
                runSearch(text, debounceRef, setLoading, setResults, setSearched);
              }}
              returnKeyType="search"
              autoCorrect={false}
              autoCapitalize="none"
              clearButtonMode="while-editing"
            />
            {query.length > 0 && (
              <TouchableOpacity
                onPress={() => {
                  setQuery('');
                  setResults([]);
                  setSearched(false);
                }}
              >
                <Icon sf="xmark.circle.fill" material="cancel" size={18} color={TEXT_MUTED} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={ACCENT} size="large" />
          </View>
        ) : showingResults ? (
          results.length === 0 && searched ? (
            <View style={styles.emptyState}>
              <Icon sf="magnifyingglass" material="search-off" size={44} color={TEXT_MUTED} />
              <ThemedText style={styles.emptyTitle}>No results</ThemedText>
              <ThemedText style={styles.emptySubtitle}>Try a different team or league name</ThemedText>
            </View>
          ) : (
            <View style={styles.resultsList}>
              {results.map((item, idx) => (
                <TouchableOpacity
                  key={`${item.id}-${idx}`}
                  style={[styles.resultRow, idx < results.length - 1 && styles.resultRowBorder]}
                  activeOpacity={0.7}
                  onPress={() =>
                    item.leagueSlug
                      ? goToLeague(item.leagueSlug)
                      : item.type === 'league'
                        ? goToLeague(item.id)
                        : undefined
                  }
                >
                  <View style={styles.resultIcon}>
                    {item.logo ? (
                      <Image source={{ uri: item.logo }} style={styles.resultLogo} contentFit="contain" />
                    ) : (
                      <Icon
                        sf={item.type === 'league' ? 'trophy' : 'soccerball'}
                        material={item.type === 'league' ? 'emoji-events' : 'sports-soccer'}
                        size={20}
                        color={TEXT_MUTED}
                      />
                    )}
                  </View>
                  <View style={styles.resultInfo}>
                    <ThemedText style={styles.resultName}>{item.name}</ThemedText>
                    {item.description ? <ThemedText style={styles.resultDesc}>{item.description}</ThemedText> : null}
                  </View>
                  <View style={styles.resultTypeBadge}>
                    <ThemedText style={styles.resultTypeText}>{item.type === 'league' ? 'League' : 'Team'}</ThemedText>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )
        ) : (
          <>
            {['Europe', 'America', 'Asia', 'Africa', 'International'].map((continent) => {
              const cl = FEATURED_LEAGUES.filter(
                (l) => l.continent === continent || (continent === 'International' && l.continent === 'International'),
              );
              if (cl.length === 0) return null;
              return (
                <View key={continent} style={styles.section}>
                  <ThemedText style={styles.sectionTitle}>{continent}</ThemedText>
                  <View style={styles.resultsList}>
                    {cl.map((league, idx) => (
                      <TouchableOpacity
                        key={league.id}
                        style={[styles.resultRow, idx < cl.length - 1 && styles.resultRowBorder]}
                        activeOpacity={0.7}
                        onPress={() => goToLeague(league.id)}
                      >
                        <View style={styles.resultIcon}>
                          {league.logo ? (
                            <Image source={{ uri: league.logo }} style={styles.resultLogo} contentFit="contain" />
                          ) : (
                            <Icon sf="trophy" material="emoji-events" size={18} color={TEXT_MUTED} />
                          )}
                        </View>
                        <View style={styles.resultInfo}>
                          <ThemedText style={styles.resultName}>{league.name}</ThemedText>
                          <ThemedText style={styles.resultDesc}>{league.country}</ThemedText>
                        </View>
                        <Icon sf="chevron.right" material="chevron-right" size={14} color={TEXT_MUTED} />
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              );
            })}
          </>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  // Android search bar
  androidSearchBar: {
    backgroundColor: BG,
    paddingHorizontal: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  androidSearchInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: SURFACE,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
  },
  androidSearchInput: {
    flex: 1,
    fontSize: 16,
    color: TEXT,
    padding: 0,
  },
  // Scroll content
  scrollContent: { paddingBottom: 40, paddingTop: 8 },
  center: { alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    gap: 12,
    paddingHorizontal: 40,
  },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: TEXT },
  emptySubtitle: { fontSize: 14, color: TEXT_MUTED, textAlign: 'center', lineHeight: 21 },
  section: { marginBottom: 20 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: TEXT_SECONDARY,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 16,
    paddingVertical: 8,
    paddingTop: 12,
  },
  resultsList: {
    marginHorizontal: 16,
    backgroundColor: SURFACE,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: BORDER,
    overflow: 'hidden',
  },
  resultRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  resultRowBorder: { borderBottomWidth: 1, borderBottomColor: BORDER },
  resultIcon: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 8,
    overflow: 'hidden',
  },
  resultLogo: { width: 28, height: 28 },
  resultInfo: { flex: 1 },
  resultName: { fontSize: 15, fontWeight: '600', color: TEXT },
  resultDesc: { fontSize: 12, color: TEXT_MUTED, marginTop: 2 },
  resultTypeBadge: {
    backgroundColor: '#1A1A1A',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: BORDER,
  },
  resultTypeText: { fontSize: 11, color: TEXT_MUTED, fontWeight: '500' },
});
