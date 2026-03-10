import React, { useEffect, useState, useCallback } from 'react';
import {
  View, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { SymbolView } from 'expo-symbols';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useInterval } from '@/hooks/use-interval';

const ACCENT = '#FF6B00';
const BG = '#000000';
const SURFACE = '#111111';
const BORDER = '#1E1E1E';
const TEXT = '#FFFFFF';
const TEXT_MUTED = '#666666';
const TEXT_SECONDARY = '#999999';
const LIVE_COLOR = '#FF3B30';

type TeamInfo = {
  id: string; name: string; abbrev: string; logo: string | null; color: string; score: string;
  stats?: { name: string; value: string; homeValue?: string }[];
};

type MatchDetail = {
  id: string;
  homeAway: 'home' | 'away';
  statusState: string; statusDetail: string; clock: string;
  period: number;
  home: TeamInfo; away: TeamInfo;
  venue?: string; city?: string;
  broadcast?: string;
  headlines?: string;
  drives?: any[];
  leaders?: any[];
};

type H2HMatch = {
  date: string;
  home: { name: string; score: string; logo: string | null };
  away: { name: string; score: string; logo: string | null };
  competition: string;
};

async function fetchMatchDetail(leagueId: string, eventId: string): Promise<MatchDetail | null> {
  try {
    const res = await fetch(
      `https://site.api.espn.com/apis/site/v2/sports/soccer/${leagueId}/summary?event=${eventId}`
    );
    const data = await res.json();
    const comp = data.header?.competitions?.[0];
    if (!comp) return null;

    const getTeam = (homeAway: 'home' | 'away'): TeamInfo => {
      const c = comp.competitors.find((x: any) => x.homeAway === homeAway) || comp.competitors[0];
      return {
        id: c.team?.id || '',
        name: c.team?.displayName || c.team?.name || 'TBD',
        abbrev: c.team?.abbreviation || 'TBD',
        logo: c.team?.logo || null,
        color: c.team?.color || 'FFFFFF',
        score: c.score ?? '0',
      };
    };

    const home = getTeam('home');
    const away = getTeam('away');

    // Extract stats from boxscore
    const boxscore = data.boxscore;
    if (boxscore?.stats) {
      const homeStats = boxscore.stats.find((s: any) => s.team?.homeAway === 'home' || s.team?.id === home.id);
      const awayStats = boxscore.stats.find((s: any) => s.team?.homeAway === 'away' || s.team?.id === away.id);
      const statKeys = homeStats?.stats || [];
      home.stats = statKeys.map((s: any) => ({
        name: s.name,
        value: s.displayValue,
        homeValue: s.displayValue,
      }));
      if (awayStats?.stats) {
        awayStats.stats.forEach((s: any, i: number) => {
          if (home.stats && home.stats[i]) {
            home.stats[i] = {
              name: s.name,
              homeValue: home.stats[i].value,
              value: s.displayValue,
            };
          }
        });
      }
    }

    const status = data.header?.gameInfo || comp.status;
    return {
      id: eventId,
      homeAway: 'home',
      statusState: comp.status?.type?.state || '',
      statusDetail: comp.status?.type?.shortDetail || '',
      clock: comp.status?.displayClock || '',
      period: comp.status?.period || 0,
      home, away,
      venue: data.gameInfo?.venue?.fullName,
      city: data.gameInfo?.venue?.address?.city,
      broadcast: data.broadcasts?.[0]?.names?.[0],
      headlines: data.article?.headline || data.header?.competitions?.[0]?.notes?.[0]?.headline,
    };
  } catch (e) {
    console.error('fetchMatchDetail error', e);
    return null;
  }
}

async function fetchH2H(homeTeamId: string, awayTeamId: string, leagueId: string): Promise<H2HMatch[]> {
  try {
    // ESPN doesn't have a direct H2H endpoint, so we search recent league matches to find meetings
    const res = await fetch(
      `https://site.api.espn.com/apis/site/v2/sports/soccer/${leagueId}/scoreboard?limit=200`
    );
    const data = await res.json();
    const h2h: H2HMatch[] = [];
    for (const evt of (data.events || [])) {
      const comps = evt.competitions?.[0]?.competitors || [];
      const ids = comps.map((c: any) => c.team?.id);
      if (ids.includes(homeTeamId) && ids.includes(awayTeamId)) {
        const home = comps.find((c: any) => c.homeAway === 'home');
        const away = comps.find((c: any) => c.homeAway === 'away');
        h2h.push({
          date: new Date(evt.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          home: { name: home?.team?.abbreviation || '?', score: home?.score || '0', logo: home?.team?.logo || null },
          away: { name: away?.team?.abbreviation || '?', score: away?.score || '0', logo: away?.team?.logo || null },
          competition: data.leagues?.[0]?.name || leagueId,
        });
      }
    }
    return h2h.slice(0, 10);
  } catch {
    return [];
  }
}

const MAIN_STATS = [
  'Shots on Target', 'Shots', 'Fouls', 'Yellow Cards', 'Red Cards',
  'Offsides', 'Corner Kicks', 'Ball Possession',
];

export default function MatchScreen() {
  const { id: eventId, leagueId } = useLocalSearchParams<{ id: string; leagueId: string }>();
  const insets = useSafeAreaInsets();
  const [match, setMatch] = useState<MatchDetail | null>(null);
  const [h2h, setH2H] = useState<H2HMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'summary' | 'stats' | 'h2h'>('summary');

  const load = useCallback(async (initial = false) => {
    if (initial) setLoading(true);
    const detail = await fetchMatchDetail(leagueId || 'eng.1', eventId);
    setMatch(detail);
    if (initial && detail) {
      const h2hData = await fetchH2H(detail.home.id, detail.away.id, leagueId || 'eng.1');
      setH2H(h2hData);
    }
    if (initial) setLoading(false);
  }, [eventId, leagueId]);

  useEffect(() => { load(true); }, [load]);

  const isLive = match?.statusState === 'in';
  useInterval(() => { load(false); }, isLive ? 5000 : null);

  if (loading || !match) {
    return (
      <ThemedView style={styles.container}>
        <Stack.Screen options={{ headerShown: true, headerTitle: 'Match', headerStyle: { backgroundColor: BG }, headerTintColor: TEXT, headerBackTitle: '' }} />
        <View style={styles.center}><ActivityIndicator color={ACCENT} size="large" /></View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: `${match.home.abbrev} vs ${match.away.abbrev}`,
          headerStyle: { backgroundColor: BG },
          headerTintColor: TEXT,
          headerTitleStyle: { fontWeight: '700', fontSize: 16 },
          headerBackTitle: '',
        }}
      />
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Score Hero */}
        <View style={styles.hero}>
          {/* Status badge */}
          <View style={styles.heroBadge}>
            {isLive ? (
              <View style={styles.liveBadge}>
                <View style={styles.liveDot} />
                <ThemedText style={styles.liveBadgeText}>{match.clock} — {match.statusDetail}</ThemedText>
              </View>
            ) : (
              <ThemedText style={styles.statusText}>{match.statusDetail}</ThemedText>
            )}
          </View>

          {/* Teams + score */}
          <View style={styles.heroTeams}>
            {/* Home */}
            <View style={styles.heroTeam}>
              <View style={styles.heroLogoRing}>
                {match.home.logo ? (
                  <Image source={{ uri: match.home.logo }} style={styles.heroLogo} contentFit="contain" />
                ) : (
                  <ThemedText style={styles.logoChar}>{match.home.abbrev[0]}</ThemedText>
                )}
              </View>
              <ThemedText style={styles.heroTeamName} numberOfLines={2}>{match.home.name}</ThemedText>
            </View>

            {/* Score */}
            <View style={styles.heroScore}>
              {match.statusState === 'pre' ? (
                <ThemedText style={styles.vsText}>vs</ThemedText>
              ) : (
                <ThemedText style={styles.scoreText}>
                  {match.home.score} — {match.away.score}
                </ThemedText>
              )}
              {match.statusState !== 'pre' && isLive && (
                <ThemedText style={styles.periodText}>
                  {match.period === 1 ? '1st Half' : match.period === 2 ? '2nd Half' : `Period ${match.period}`}
                </ThemedText>
              )}
            </View>

            {/* Away */}
            <View style={styles.heroTeam}>
              <View style={styles.heroLogoRing}>
                {match.away.logo ? (
                  <Image source={{ uri: match.away.logo }} style={styles.heroLogo} contentFit="contain" />
                ) : (
                  <ThemedText style={styles.logoChar}>{match.away.abbrev[0]}</ThemedText>
                )}
              </View>
              <ThemedText style={styles.heroTeamName} numberOfLines={2}>{match.away.name}</ThemedText>
            </View>
          </View>

          {/* Venue / broadcast */}
          {(match.venue || match.broadcast) && (
            <View style={styles.heroMeta}>
              {match.venue ? (
                <ThemedText style={styles.heroMetaText}>{match.venue}{match.city ? `, ${match.city}` : ''}</ThemedText>
              ) : null}
              {match.broadcast ? (
                <ThemedText style={styles.heroBroadcast}>📺 {match.broadcast}</ThemedText>
              ) : null}
            </View>
          )}
        </View>

        {/* Tab bar */}
        <View style={styles.tabBar}>
          {(['summary', 'stats', 'h2h'] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
              onPress={() => setActiveTab(tab)}
            >
              <ThemedText style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab === 'h2h' ? 'H2H' : tab.charAt(0).toUpperCase() + tab.slice(1)}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab content */}
        {activeTab === 'summary' && (
          <View style={styles.tabContent}>
            {match.headlines ? (
              <View style={styles.card}>
                <ThemedText style={styles.cardTitle}>Match Preview</ThemedText>
                <ThemedText style={styles.cardBody}>{match.headlines}</ThemedText>
              </View>
            ) : (
              <View style={styles.card}>
                <ThemedText style={styles.cardBody}>
                  {match.statusState === 'pre'
                    ? `${match.home.name} host ${match.away.name} at ${match.venue || 'their home ground'}.`
                    : match.statusState === 'in'
                    ? `This match is currently in progress.`
                    : `Full-time: ${match.home.name} ${match.home.score}–${match.away.score} ${match.away.name}`
                  }
                </ThemedText>
              </View>
            )}
          </View>
        )}

        {activeTab === 'stats' && (
          <View style={styles.tabContent}>
            {match.home.stats && match.home.stats.length > 0 ? (
              <View style={styles.statsCard}>
                {match.home.stats
                  .filter((s) => MAIN_STATS.some((k) => s.name?.toLowerCase().includes(k.toLowerCase())))
                  .map((stat, i) => (
                    <View key={i} style={[styles.statRow, i > 0 && { borderTopWidth: 1, borderTopColor: BORDER }]}>
                      <ThemedText style={styles.statValue}>{stat.homeValue}</ThemedText>
                      <ThemedText style={styles.statName}>{stat.name}</ThemedText>
                      <ThemedText style={styles.statValue}>{stat.value}</ThemedText>
                    </View>
                  ))
                }
              </View>
            ) : (
              <View style={styles.center}>
                <SymbolView name="chart.bar" tintColor={TEXT_MUTED} size={44} />
                <ThemedText style={styles.emptyText}>
                  {match.statusState === 'pre' ? 'Stats available once the match starts' : 'Stats not available'}
                </ThemedText>
              </View>
            )}
          </View>
        )}

        {activeTab === 'h2h' && (
          <View style={styles.tabContent}>
            {h2h.length === 0 ? (
              <View style={styles.center}>
                <SymbolView name="person.2" tintColor={TEXT_MUTED} size={44} />
                <ThemedText style={styles.emptyText}>No recent head-to-head data</ThemedText>
              </View>
            ) : (
              <View style={styles.statsCard}>
                <View style={styles.h2hHeader}>
                  <View style={styles.h2hTeamHeader}>
                    {match.home.logo && <Image source={{ uri: match.home.logo }} style={styles.h2hLogo} contentFit="contain" />}
                    <ThemedText style={styles.h2hTeamLabel}>{match.home.abbrev}</ThemedText>
                  </View>
                  <ThemedText style={styles.h2hHeaderLabel}>Recent Meetings</ThemedText>
                  <View style={styles.h2hTeamHeader}>
                    <ThemedText style={styles.h2hTeamLabel}>{match.away.abbrev}</ThemedText>
                    {match.away.logo && <Image source={{ uri: match.away.logo }} style={styles.h2hLogo} contentFit="contain" />}
                  </View>
                </View>
                {h2h.map((m, i) => {
                  const homeWon = Number(m.home.score) > Number(m.away.score);
                  const awayWon = Number(m.away.score) > Number(m.home.score);
                  return (
                    <View key={i} style={[styles.h2hRow, i > 0 && { borderTopWidth: 1, borderTopColor: BORDER }]}>
                      <ThemedText style={[styles.h2hScore, homeWon && styles.h2hWinner]}>{m.home.score}</ThemedText>
                      <View style={styles.h2hMid}>
                        <ThemedText style={styles.h2hDate}>{m.date}</ThemedText>
                        <ThemedText style={styles.h2hComp}>{m.competition}</ThemedText>
                      </View>
                      <ThemedText style={[styles.h2hScore, awayWon && styles.h2hWinner]}>{m.away.score}</ThemedText>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingVertical: 60 },
  emptyText: { fontSize: 14, color: TEXT_MUTED, textAlign: 'center', paddingHorizontal: 32 },
  // Hero
  hero: { backgroundColor: SURFACE, borderBottomWidth: 1, borderBottomColor: BORDER, padding: 20 },
  heroBadge: { alignItems: 'center', marginBottom: 16 },
  liveBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#1A0000', borderWidth: 1, borderColor: '#3A0000', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4 },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: LIVE_COLOR },
  liveBadgeText: { fontSize: 13, fontWeight: '700', color: LIVE_COLOR },
  statusText: { fontSize: 13, fontWeight: '600', color: TEXT_MUTED },
  heroTeams: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heroTeam: { flex: 1, alignItems: 'center', gap: 10 },
  heroLogoRing: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#0A0A0A', borderWidth: 2, borderColor: BORDER, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  heroLogo: { width: 56, height: 56 },
  logoChar: { fontSize: 24, fontWeight: '800', color: TEXT },
  heroTeamName: { fontSize: 13, fontWeight: '600', color: TEXT, textAlign: 'center', lineHeight: 18 },
  heroScore: { alignItems: 'center', paddingHorizontal: 8 },
  scoreText: { fontSize: 36, fontWeight: '800', color: TEXT, letterSpacing: 2 },
  vsText: { fontSize: 22, fontWeight: '700', color: TEXT_MUTED },
  periodText: { fontSize: 12, color: LIVE_COLOR, fontWeight: '600', marginTop: 4 },
  heroMeta: { alignItems: 'center', marginTop: 16, gap: 4 },
  heroMetaText: { fontSize: 12, color: TEXT_MUTED },
  heroBroadcast: { fontSize: 12, color: TEXT_SECONDARY },
  // Tabs
  tabBar: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: BORDER, marginTop: 4 },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: ACCENT },
  tabText: { fontSize: 14, fontWeight: '500', color: TEXT_MUTED },
  tabTextActive: { color: ACCENT, fontWeight: '700' },
  tabContent: { paddingTop: 16 },
  // Cards
  card: { marginHorizontal: 16, backgroundColor: SURFACE, borderRadius: 10, borderWidth: 1, borderColor: BORDER, padding: 16, marginBottom: 12 },
  cardTitle: { fontSize: 13, fontWeight: '600', color: TEXT_SECONDARY, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 8 },
  cardBody: { fontSize: 14, color: TEXT, lineHeight: 21 },
  // Stats
  statsCard: { marginHorizontal: 16, backgroundColor: SURFACE, borderRadius: 10, borderWidth: 1, borderColor: BORDER, overflow: 'hidden' },
  statRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  statValue: { width: 48, fontSize: 14, fontWeight: '700', color: TEXT, textAlign: 'center' },
  statName: { flex: 1, fontSize: 13, color: TEXT_SECONDARY, textAlign: 'center' },
  // H2H
  h2hHeader: { flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderBottomColor: BORDER },
  h2hTeamHeader: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 },
  h2hHeaderLabel: { flex: 1, fontSize: 12, fontWeight: '600', color: TEXT_SECONDARY, textAlign: 'center', textTransform: 'uppercase', letterSpacing: 0.4 },
  h2hTeamLabel: { fontSize: 13, fontWeight: '700', color: TEXT },
  h2hLogo: { width: 20, height: 20 },
  h2hRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  h2hScore: { width: 32, fontSize: 16, fontWeight: '700', color: TEXT_MUTED, textAlign: 'center' },
  h2hWinner: { color: TEXT, fontWeight: '800' },
  h2hMid: { flex: 1, alignItems: 'center', gap: 2 },
  h2hDate: { fontSize: 12, color: TEXT_SECONDARY },
  h2hComp: { fontSize: 11, color: TEXT_MUTED },
});
