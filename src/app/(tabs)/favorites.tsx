import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { SymbolView } from 'expo-symbols';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import {
  getFavorites,
  removeFavorite,
  favoritesEmitter,
  type FavoriteMatch,
} from '@/utils/favorites';

const ACCENT = '#FF6B00';
const BG = '#000000';
const SURFACE = '#111111';
const BORDER = '#1E1E1E';
const TEXT = '#FFFFFF';
const TEXT_MUTED = '#666666';
const TEXT_SECONDARY = '#999999';

function formatMatchStatus(match: FavoriteMatch): string {
  return new Date(match.date).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export default function FavoritesScreen() {
  const insets = useSafeAreaInsets();
  const [favorites, setFavorites] = useState<FavoriteMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadFavorites = useCallback(async () => {
    const data = await getFavorites();
    setFavorites(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadFavorites();
    const unsub = favoritesEmitter.subscribe(loadFavorites);
    return () => { unsub(); };
  }, [loadFavorites]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadFavorites();
    setRefreshing(false);
  };

  const handleUnfavorite = async (id: string) => {
    await removeFavorite(id);
  };

  // Group by league
  const grouped = React.useMemo(() => {
    const map = new Map<string, FavoriteMatch[]>();
    for (const match of favorites) {
      const key = match.league;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(match);
    }
    return Array.from(map.entries());
  }, [favorites]);

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <ThemedText style={styles.title}>Favorites</ThemedText>
        <ThemedText style={styles.subtitle}>
          {favorites.length} {favorites.length === 1 ? 'match' : 'matches'}
        </ThemedText>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator color={ACCENT} size="large" />
        </View>
      ) : favorites.length === 0 ? (
        <View style={styles.emptyState}>
          <SymbolView name="star" tintColor={TEXT_MUTED} size={52} />
          <ThemedText style={styles.emptyTitle}>No favorites yet</ThemedText>
          <ThemedText style={styles.emptySubtitle}>
            Tap the star on any match{'\n'}to save it here
          </ThemedText>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + 100 },
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={ACCENT}
            />
          }
        >
          {grouped.map(([league, matches]) => (
            <View key={league} style={styles.leagueSection}>
              {/* League header */}
              <View style={styles.leagueHeader}>
                {matches[0].leagueLogo && (
                  <Image
                    source={{ uri: matches[0].leagueLogo }}
                    style={styles.leagueLogo}
                    contentFit="contain"
                  />
                )}
                <ThemedText style={styles.leagueName}>{league}</ThemedText>
                <ThemedText style={styles.leagueCount}>{matches.length}</ThemedText>
              </View>

              {/* Matches */}
              <View style={styles.matchGroup}>
                {matches.map((match, idx) => (
                  <View
                    key={match.id}
                    style={[
                      styles.matchRow,
                      idx < matches.length - 1 && styles.matchRowBorder,
                    ]}
                  >
                    <View style={styles.matchDateTime}>
                      <ThemedText style={styles.matchDate}>
                        {formatMatchStatus(match)}
                      </ThemedText>
                    </View>

                    {/* Away team */}
                    <View style={styles.teamsSection}>
                      <View style={styles.teamRow}>
                        <View
                          style={[
                            styles.teamLogo,
                            { backgroundColor: `#${match.homeColor}` },
                          ]}
                        >
                          {match.homeLogo ? (
                            <Image
                              source={{ uri: match.homeLogo }}
                              style={{ width: '100%', height: '100%' }}
                              contentFit="contain"
                            />
                          ) : null}
                        </View>
                        <ThemedText style={styles.teamName}>
                          {match.homeTeam}
                        </ThemedText>
                      </View>

                      <View style={styles.vsRow}>
                        <ThemedText style={styles.vsText}>vs</ThemedText>
                      </View>

                      <View style={styles.teamRow}>
                        <View
                          style={[
                            styles.teamLogo,
                            { backgroundColor: `#${match.awayColor}` },
                          ]}
                        >
                          {match.awayLogo ? (
                            <Image
                              source={{ uri: match.awayLogo }}
                              style={{ width: '100%', height: '100%' }}
                              contentFit="contain"
                            />
                          ) : null}
                        </View>
                        <ThemedText style={styles.teamName}>
                          {match.awayTeam}
                        </ThemedText>
                      </View>
                    </View>

                    {/* Remove btn */}
                    <TouchableOpacity
                      style={styles.removeBtn}
                      onPress={() => handleUnfavorite(match.id)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <SymbolView name="star.fill" tintColor={ACCENT} size={18} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </View>
          ))}
        </ScrollView>
      )}
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
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  title: { fontSize: 22, fontWeight: '800', color: TEXT, letterSpacing: -0.5 },
  subtitle: { fontSize: 13, color: TEXT_MUTED, fontWeight: '500' },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 40,
  },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: TEXT },
  emptySubtitle: {
    fontSize: 14,
    color: TEXT_MUTED,
    textAlign: 'center',
    lineHeight: 21,
  },
  scrollContent: { paddingTop: 8, paddingBottom: 40 },
  leagueSection: { marginBottom: 16 },
  leagueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 10,
  },
  leagueLogo: { width: 20, height: 20 },
  leagueName: {
    fontSize: 13,
    fontWeight: '600',
    color: TEXT_SECONDARY,
    flex: 1,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  leagueCount: {
    fontSize: 12,
    color: TEXT_MUTED,
    fontWeight: '500',
  },
  matchGroup: {
    marginHorizontal: 16,
    backgroundColor: SURFACE,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: BORDER,
    overflow: 'hidden',
  },
  matchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  matchRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  matchDateTime: { width: 56 },
  matchDate: { fontSize: 11, color: TEXT_MUTED, fontWeight: '500', lineHeight: 16 },
  teamsSection: { flex: 1, gap: 6 },
  teamRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  teamLogo: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#1A1A1A',
    overflow: 'hidden',
  },
  teamName: { fontSize: 14, fontWeight: '600', color: TEXT },
  vsRow: { paddingLeft: 28 },
  vsText: { fontSize: 11, color: TEXT_MUTED, fontWeight: '500' },
  removeBtn: {
    padding: 4,
  },
});
