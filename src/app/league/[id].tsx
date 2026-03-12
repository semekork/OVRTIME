import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { SharedTransition } from 'react-native-reanimated';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Icon } from '@/components/icon';
import { getLeagueById } from '@/utils/leagues';
import { toggleFavorite, isFavorite, type FavoriteMatch } from '@/utils/favorites';
import { useInterval } from '@/hooks/use-interval';
import { C } from '@/constants/theme';

const springTransition = SharedTransition.springify().damping(20).stiffness(200);

const ACCENT = C.accent;
const BG = C.bg;
const SURFACE = C.surface;
const BORDER = C.border;
const TEXT = C.text;
const TEXT_MUTED = C.textMuted;
const TEXT_SECONDARY = C.textSecondary;
const LIVE_COLOR = C.live;

type MatchEvent = {
  id: string;
  date: Date;
  statusState: string;
  statusShortDetail: string;
  clock: string;
  home: { team: string; abbrev: string; score: string; logo: string | null; color: string };
  away: { team: string; abbrev: string; score: string; logo: string | null; color: string };
};

type StandingsTeam = {
  id: string;
  rank: number;
  name: string;
  abbrev: string;
  logo: string | null;
  played: string;
  won: string;
  drawn: string;
  lost: string;
  gf: string;
  ga: string;
  gd: string;
  points: string;
  noteColor?: string;
};

const toLocalQueryDate = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}${m}${dd}`;
};

const generateDates = () => {
  const dates = [];
  const today = new Date();
  for (let i = -3; i <= 4; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    dates.push({
      label:
        i === 0
          ? 'Today'
          : i === -1
            ? 'Yesterday'
            : i === 1
              ? 'Tomorrow'
              : d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
      day: d.toLocaleDateString('en-US', { weekday: 'short' }),
      date: d.getDate().toString(),
      isToday: i === 0,
      queryDate: toLocalQueryDate(d),
    });
  }
  return dates;
};

export default function LeagueScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const league = getLeagueById(id);

  const AndroidBack = () => (
    <TouchableOpacity
      onPress={() => router.back()}
      style={{ paddingHorizontal: 12, paddingVertical: 8 }}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      <Icon sf="chevron.left" material="arrow-back" size={22} color={TEXT} />
    </TouchableOpacity>
  );
  const headerLeft = Platform.OS === 'android' ? () => <AndroidBack /> : undefined;
  const [dates] = useState(generateDates);
  const [selectedIdx, setSelectedIdx] = useState(3); // today
  const [viewMode, setViewMode] = useState<'matches' | 'standings'>('matches');
  const [events, setEvents] = useState<MatchEvent[]>([]);
  const [standings, setStandings] = useState<StandingsTeam[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingStandings, setLoadingStandings] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [favIds, setFavIds] = useState<Set<string>>(new Set());

  const selectedDate = dates[selectedIdx];

  const fetchLeageStandings = useCallback(async () => {
    try {
      setLoadingStandings(true);
      const res = await fetch(`https://site.api.espn.com/apis/v2/sports/soccer/${id}/standings`);
      const data = await res.json();
      const entries = data.children?.[0]?.standings?.entries || [];
      const parsed = entries.map((e: any) => {
        const getStat = (name: string) => e.stats?.find((s: any) => s.name === name)?.displayValue || '0';
        return {
          id: e.team.id,
          rank: parseInt(getStat('rank'), 10) || 0,
          name: e.team.displayName || e.team.name,
          abbrev: e.team.abbreviation,
          logo: e.team.logos?.[0]?.href || null,
          played: getStat('gamesPlayed'),
          won: getStat('wins'),
          drawn: getStat('ties'),
          lost: getStat('losses'),
          gf: getStat('pointsFor'),
          ga: getStat('pointsAgainst'),
          gd: getStat('pointDifferential'),
          points: getStat('points'),
          noteColor: e.note?.color,
        };
      });
      setStandings(parsed);
    } catch (e) {
      console.error('fetchStandings error', e);
    } finally {
      setLoadingStandings(false);
    }
  }, [id]);

  useEffect(() => {
    if (viewMode === 'standings' && standings.length === 0) {
      fetchLeageStandings();
    }
  }, [viewMode, fetchLeageStandings, standings.length]);

  const fetchEvents = useCallback(
    async (showLoader = false) => {
      if (showLoader) setLoading(true);
      try {
        const res = await fetch(
          `https://site.api.espn.com/apis/site/v2/sports/soccer/${id}/scoreboard?dates=${selectedDate.queryDate}`,
        );
        const data = await res.json();
        const raw: MatchEvent[] = (data.events || []).map((evt: any) => {
          const homeComp =
            evt.competitions[0].competitors.find((c: any) => c.homeAway === 'home') ||
            evt.competitions[0].competitors[0];
          const awayComp =
            evt.competitions[0].competitors.find((c: any) => c.homeAway === 'away') ||
            evt.competitions[0].competitors[1];
          return {
            id: evt.id,
            date: new Date(evt.date),
            statusState: evt.status.type.state,
            statusShortDetail: evt.status.type.shortDetail,
            clock: evt.status.displayClock,
            home: {
              team: homeComp?.team?.displayName || homeComp?.team?.name || 'TBD',
              abbrev: homeComp?.team?.abbreviation || 'TBD',
              score: homeComp?.score ?? '0',
              logo: homeComp?.team?.logo || null,
              color: homeComp?.team?.color || 'FFFFFF',
            },
            away: {
              team: awayComp?.team?.displayName || awayComp?.team?.name || 'TBD',
              abbrev: awayComp?.team?.abbreviation || 'TBD',
              score: awayComp?.score ?? '0',
              logo: awayComp?.team?.logo || null,
              color: awayComp?.team?.color || 'FFFFFF',
            },
          };
        });
        setEvents(raw);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    },
    [id, selectedDate.queryDate],
  );

  useEffect(() => {
    fetchEvents(true);
  }, [fetchEvents]);

  // Auto-poll every 5s when live matches exist
  const hasLive = events.some((e) => e.statusState === 'in');
  useInterval(
    () => {
      fetchEvents(false);
    },
    hasLive ? 5000 : null,
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchEvents(false);
    setRefreshing(false);
  };

  const handleToggleFav = async (evt: MatchEvent) => {
    const match: FavoriteMatch = {
      id: evt.id,
      homeTeam: evt.home.team,
      homeAbbrev: evt.home.abbrev,
      homeLogo: evt.home.logo,
      homeColor: evt.home.color,
      awayTeam: evt.away.team,
      awayAbbrev: evt.away.abbrev,
      awayLogo: evt.away.logo,
      awayColor: evt.away.color,
      league: league?.name || id,
      leagueLogo: league?.logo || null,
      date: evt.date.toISOString(),
    };
    const nowFav = await toggleFavorite(match);
    setFavIds((prev) => {
      const next = new Set(prev);
      if (nowFav) next.add(evt.id);
      else next.delete(evt.id);
      return next;
    });
  };

  // Group by status
  const live = events.filter((e) => e.statusState === 'in');
  const upcoming = events.filter((e) => e.statusState === 'pre');
  const finished = events.filter((e) => e.statusState === 'post');

  const renderMatch = (evt: MatchEvent, idx: number, total: number) => (
    <TouchableOpacity
      key={evt.id}
      style={[styles.matchRow, idx < total - 1 && styles.matchRowBorder]}
      activeOpacity={0.75}
      onPress={() => router.push(`/match/${evt.id}?leagueId=${id}`)}
    >
      {/* Status */}
      <View style={styles.matchStatus}>
        {evt.statusState === 'in' ? (
          <>
            <View style={styles.liveDot} />
            <ThemedText style={styles.liveTime}>{evt.clock}</ThemedText>
          </>
        ) : evt.statusState === 'post' ? (
          <ThemedText style={styles.finishedText}>FT</ThemedText>
        ) : (
          <ThemedText style={styles.upcomingTime}>
            {evt.date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
          </ThemedText>
        )}
      </View>

      {/* Teams */}
      <View style={styles.teamsCol}>
        <View style={styles.teamRow}>
          <View style={[styles.teamLogo, { overflow: 'hidden' }]}>
            {evt.home.logo && (
              <Image source={{ uri: evt.home.logo }} style={{ width: '100%', height: '100%' }} contentFit="contain" />
            )}
          </View>
          <ThemedText style={styles.teamName} numberOfLines={1}>
            {evt.home.team}
          </ThemedText>
          {evt.statusState !== 'pre' && (
            <ThemedText style={[styles.score, evt.statusState === 'in' && styles.scoreLive]}>
              {evt.home.score}
            </ThemedText>
          )}
        </View>
        <View style={styles.teamRow}>
          <View style={[styles.teamLogo, { overflow: 'hidden' }]}>
            {evt.away.logo && (
              <Image source={{ uri: evt.away.logo }} style={{ width: '100%', height: '100%' }} contentFit="contain" />
            )}
          </View>
          <ThemedText style={styles.teamName} numberOfLines={1}>
            {evt.away.team}
          </ThemedText>
          {evt.statusState !== 'pre' && (
            <ThemedText style={[styles.score, evt.statusState === 'in' && styles.scoreLive]}>
              {evt.away.score}
            </ThemedText>
          )}
        </View>
      </View>

      {/* Star */}
      <TouchableOpacity onPress={() => handleToggleFav(evt)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Icon
          sf={favIds.has(evt.id) ? 'star.fill' : 'star'}
          material={favIds.has(evt.id) ? 'star' : 'star-border'}
          color={favIds.has(evt.id) ? ACCENT : TEXT_MUTED}
          size={16}
        />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: () => (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              {league?.logo && (
                <Animated.View
                  sharedTransitionTag={`league-logo-${id}`}
                  sharedTransitionStyle={springTransition}
                  style={{ width: 24, height: 24 }}
                >
                  <Image source={{ uri: league.logo }} style={{ width: 24, height: 24 }} contentFit="contain" />
                </Animated.View>
              )}
              <ThemedText style={{ fontWeight: '700', fontSize: 17, color: TEXT }}>{league?.name || id}</ThemedText>
            </View>
          ),
          headerStyle: { backgroundColor: BG },
          headerTintColor: TEXT,
          headerBackTitle: '',
          headerLeft,
        }}
      />

      {/* View Toggle */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, viewMode === 'matches' && styles.tabActive]}
          onPress={() => setViewMode('matches')}
        >
          <ThemedText style={[styles.tabText, viewMode === 'matches' && styles.tabTextActive]}>Matches</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, viewMode === 'standings' && styles.tabActive]}
          onPress={() => setViewMode('standings')}
        >
          <ThemedText style={[styles.tabText, viewMode === 'standings' && styles.tabTextActive]}>Standings</ThemedText>
        </TouchableOpacity>
      </View>

      {viewMode === 'matches' ? (
        <>
          {/* Date selector */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.dateBar}
            contentInsetAdjustmentBehavior="automatic"
          >
        {dates.map((d, i) => (
          <TouchableOpacity
            key={d.queryDate}
            style={[styles.dateChip, i === selectedIdx && styles.dateChipActive]}
            onPress={() => setSelectedIdx(i)}
          >
            <ThemedText style={[styles.dateChipDate, i === selectedIdx && styles.dateChipTextActive]}>
              {d.date}
            </ThemedText>
            <ThemedText style={[styles.dateChipDay, i === selectedIdx && styles.dateChipTextActive]}>
              {d.day}
            </ThemedText>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={ACCENT} size="large" />
        </View>
      ) : events.length === 0 ? (
        <View style={styles.center}>
          <Icon sf="calendar.badge.exclamationmark" material="event-busy" size={44} color={TEXT_MUTED} />
          <ThemedText style={styles.emptyText}>No matches on this day</ThemedText>
        </View>
      ) : (
        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={ACCENT} />}
        >
          {live.length > 0 && (
            <View style={styles.section}>
              <ThemedText style={styles.sectionLabel}>● Live</ThemedText>
              <View style={styles.matchGroup}>{live.map((e, i) => renderMatch(e, i, live.length))}</View>
            </View>
          )}
          {upcoming.length > 0 && (
            <View style={styles.section}>
              <ThemedText style={styles.sectionLabel}>Upcoming</ThemedText>
              <View style={styles.matchGroup}>{upcoming.map((e, i) => renderMatch(e, i, upcoming.length))}</View>
            </View>
          )}
          {finished.length > 0 && (
            <View style={styles.section}>
              <ThemedText style={styles.sectionLabel}>Finished</ThemedText>
              <View style={styles.matchGroup}>{finished.map((e, i) => renderMatch(e, i, finished.length))}</View>
            </View>
          )}
        </ScrollView>
      )}
        </>
      ) : (
        /* Standings View */
        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
          showsVerticalScrollIndicator={false}
        >
          {loadingStandings && standings.length === 0 ? (
            <View style={styles.center}>
              <ActivityIndicator color={ACCENT} size="large" />
            </View>
          ) : standings.length === 0 ? (
            <View style={styles.center}>
              <Icon sf="table" material="table-chart" size={44} color={TEXT_MUTED} />
              <ThemedText style={styles.emptyText}>Standings not available</ThemedText>
            </View>
          ) : (
            <View style={styles.section}>
              <View style={styles.standingsHeader}>
                <ThemedText style={[styles.standingsHeaderText, { width: 28, textAlign: 'center' }]}>#</ThemedText>
                <ThemedText style={[styles.standingsHeaderText, { flex: 1 }]}>Team</ThemedText>
                <View style={styles.standingsStatsRow}>
                  <ThemedText style={styles.standingsHeaderText}>P</ThemedText>
                  <ThemedText style={styles.standingsHeaderText}>W</ThemedText>
                  <ThemedText style={styles.standingsHeaderText}>D</ThemedText>
                  <ThemedText style={styles.standingsHeaderText}>L</ThemedText>
                  <ThemedText style={styles.standingsHeaderText}>GD</ThemedText>
                  <ThemedText style={[styles.standingsHeaderText, { color: TEXT }]}>Pts</ThemedText>
                </View>
              </View>
              <View style={styles.matchGroup}>
                {standings.map((team, idx) => (
                  <View key={team.id} style={[styles.standingsRow, idx < standings.length - 1 && styles.matchRowBorder]}>
                    <View style={styles.standingsRankIndicator}>
                      <ThemedText style={styles.standingsRank}>{team.rank}</ThemedText>
                      {team.noteColor && (
                        <View style={[styles.standingsColorBadge, { backgroundColor: team.noteColor.startsWith('#') ? team.noteColor : `#${team.noteColor}` }]} />
                      )}
                    </View>
                    <View style={styles.standingsTeamInfo}>
                      <View style={[styles.teamLogo, { width: 16, height: 16 }]}>
                        {team.logo && <Image source={{ uri: team.logo }} style={{ width: '100%', height: '100%' }} contentFit="contain" />}
                      </View>
                      <ThemedText style={styles.standingsTeamName} numberOfLines={1}>{team.name}</ThemedText>
                    </View>
                    <View style={styles.standingsStatsRow}>
                      <ThemedText style={styles.standingsStat}>{team.played}</ThemedText>
                      <ThemedText style={styles.standingsStat}>{team.won}</ThemedText>
                      <ThemedText style={styles.standingsStat}>{team.drawn}</ThemedText>
                      <ThemedText style={styles.standingsStat}>{team.lost}</ThemedText>
                      <ThemedText style={styles.standingsStat}>{team.gd}</ThemedText>
                      <ThemedText style={[styles.standingsStat, { color: TEXT, fontWeight: '700' }]}>{team.points}</ThemedText>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}
        </ScrollView>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  dateBar: { paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  dateChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: 'center',
    gap: 2,
  },
  dateChipActive: { backgroundColor: ACCENT, borderColor: ACCENT },
  dateChipDate: { fontSize: 17, fontWeight: '700', color: TEXT },
  dateChipDay: { fontSize: 11, color: TEXT_MUTED, fontWeight: '500' },
  dateChipTextActive: { color: '#000' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingTop: 80 },
  emptyText: { fontSize: 15, color: TEXT_MUTED, fontWeight: '500' },
  section: { marginTop: 20 },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: TEXT_SECONDARY,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  matchGroup: {
    marginHorizontal: 16,
    backgroundColor: SURFACE,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: BORDER,
    overflow: 'hidden',
  },
  matchRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  matchRowBorder: { borderBottomWidth: 1, borderBottomColor: BORDER },
  matchStatus: { width: 44, alignItems: 'center', gap: 3 },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: LIVE_COLOR },
  liveTime: { fontSize: 12, fontWeight: '700', color: LIVE_COLOR },
  finishedText: { fontSize: 12, fontWeight: '600', color: TEXT_MUTED },
  upcomingTime: { fontSize: 12, fontWeight: '600', color: TEXT, textAlign: 'center' },
  teamsCol: { flex: 1, gap: 8 },
  teamRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  teamLogo: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#1A1A1A' },
  teamName: { flex: 1, fontSize: 14, fontWeight: '600', color: TEXT },
  score: { fontSize: 14, fontWeight: '800', color: TEXT, minWidth: 20, textAlign: 'right' },
  scoreLive: { color: LIVE_COLOR },
  tabContainer: { flexDirection: 'row', marginHorizontal: 16, marginTop: 12, backgroundColor: SURFACE, borderRadius: 8, padding: 4, borderWidth: 1, borderColor: BORDER },
  tab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 6 },
  tabActive: { backgroundColor: '#222' },
  tabText: { fontSize: 13, fontWeight: '600', color: TEXT_MUTED },
  tabTextActive: { color: TEXT },
  standingsHeader: { flexDirection: 'row', paddingHorizontal: 16, marginBottom: 8, alignItems: 'center' },
  standingsHeaderText: { fontSize: 11, fontWeight: '600', color: TEXT_SECONDARY, textTransform: 'uppercase' },
  standingsRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 16, gap: 8 },
  standingsRankIndicator: { width: 28, alignItems: 'center', justifyContent: 'center' },
  standingsRank: { fontSize: 13, fontWeight: '600', color: TEXT_MUTED },
  standingsColorBadge: { position: 'absolute', left: -10, top: '50%', marginTop: -4, width: 4, height: 8, borderRadius: 2 },
  standingsTeamInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  standingsTeamName: { fontSize: 14, fontWeight: '600', color: TEXT },
  standingsStatsRow: { flexDirection: 'row', alignItems: 'center', gap: 12, width: 140, justifyContent: 'flex-end' },
  standingsStat: { width: 20, textAlign: 'center', fontSize: 13, fontWeight: '500', color: TEXT_MUTED },
});
