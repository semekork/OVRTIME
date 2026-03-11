import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Platform,
  Alert,
  Animated,
} from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Icon } from '@/components/icon';
import { useInterval } from '@/hooks/use-interval';
import { getLeagueById } from '@/utils/leagues';
import { startMatchActivity, updateMatchActivity, endMatchActivity, hasActiveActivity } from '@/utils/liveActivity';

const ACCENT = '#FF6B00';
const BG = '#000000';
const SURFACE = '#111111';
const BORDER = '#1E1E1E';
const TEXT = '#FFFFFF';
const TEXT_MUTED = '#666666';
const TEXT_SECONDARY = '#999999';
const LIVE_COLOR = '#FF3B30';

type TeamInfo = {
  id: string;
  name: string;
  abbrev: string;
  logo: string | null;
  color: string;
  score: string;
  stats?: { name: string; homeValue: string; awayValue: string }[];
};

type KeyEvent = {
  id: string;
  clock: string;
  text: string;
  type: 'goal' | 'yellow' | 'red' | 'substitution' | 'other';
  team: 'home' | 'away' | 'unknown';
};

type Player = {
  name: string;
  position: string;
  number: string;
};

type Lineups = {
  home: Player[];
  away: Player[];
  homeFormation?: string;
  awayFormation?: string;
};

type MatchDetail = {
  id: string;
  statusState: string;
  statusDetail: string;
  clock: string;
  period: number;
  home: TeamInfo;
  away: TeamInfo;
  venue?: string;
  city?: string;
  broadcast?: string;
  headlines?: string;
  keyEvents: KeyEvent[];
  lineups: Lineups | null;
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
      `https://site.api.espn.com/apis/site/v2/sports/soccer/${leagueId}/summary?event=${eventId}`,
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

    // Extract stats — keep home and away values separate
    const boxscore = data.boxscore;
    if (boxscore?.stats) {
      const homeStats = boxscore.stats.find((s: any) => s.team?.id === home.id || s.team?.homeAway === 'home');
      const awayStats = boxscore.stats.find((s: any) => s.team?.id === away.id || s.team?.homeAway === 'away');

      const homeArr: any[] = homeStats?.stats || [];
      const awayArr: any[] = awayStats?.stats || [];

      home.stats = homeArr.map((s: any, i: number) => ({
        name: s.name,
        homeValue: s.displayValue,
        awayValue: awayArr[i]?.displayValue ?? '0',
      }));
    }

    // Key events (plays)
    const keyEvents: KeyEvent[] = [];
    const plays: any[] = data.plays || [];
    for (const play of plays) {
      const typeText: string = play.type?.text?.toLowerCase() || '';
      const homeTeamId = home.id;
      const teamId = play.team?.id;
      const side: 'home' | 'away' | 'unknown' = teamId === homeTeamId ? 'home' : teamId ? 'away' : 'unknown';
      let type: KeyEvent['type'] = 'other';
      if (typeText.includes('goal') || typeText.includes('score')) type = 'goal';
      else if (typeText.includes('yellow')) type = 'yellow';
      else if (typeText.includes('red')) type = 'red';
      else if (typeText.includes('sub')) type = 'substitution';
      else continue; // skip non-key events

      keyEvents.push({
        id: play.id?.toString() || `${keyEvents.length}`,
        clock: play.clock?.displayValue || '',
        text: play.text || play.type?.text || '',
        type,
        team: side,
      });
    }

    // Lineups (rosters)
    let lineups: Lineups | null = null;
    const rosters: any[] = data.rosters || [];
    if (rosters.length >= 2) {
      const homeRoster = rosters.find((r: any) => r.team?.id === home.id) || rosters[0];
      const awayRoster = rosters.find((r: any) => r.team?.id === away.id) || rosters[1];

      const parseRoster = (roster: any): Player[] =>
        (roster?.roster || [])
          .filter((p: any) => p.starter || p.position)
          .slice(0, 11)
          .map((p: any) => ({
            name: p.athlete?.displayName || p.athlete?.shortName || '?',
            position: p.position?.abbreviation || p.position?.name || '',
            number: p.jersey || '',
          }));

      lineups = {
        home: parseRoster(homeRoster),
        away: parseRoster(awayRoster),
        homeFormation: homeRoster?.formation,
        awayFormation: awayRoster?.formation,
      };
    }

    return {
      id: eventId,
      statusState: comp.status?.type?.state || '',
      statusDetail: comp.status?.type?.shortDetail || '',
      clock: comp.status?.displayClock || '',
      period: comp.status?.period || 0,
      home,
      away,
      venue: data.gameInfo?.venue?.fullName,
      city: data.gameInfo?.venue?.address?.city,
      broadcast: data.broadcasts?.[0]?.names?.[0],
      headlines: data.article?.headline || data.header?.competitions?.[0]?.notes?.[0]?.headline,
      keyEvents,
      lineups,
    };
  } catch (e) {
    console.error('fetchMatchDetail error', e);
    return null;
  }
}

async function fetchH2H(homeTeamId: string, awayTeamId: string, leagueId: string): Promise<H2HMatch[]> {
  try {
    const res = await fetch(`https://site.api.espn.com/apis/site/v2/sports/soccer/${leagueId}/scoreboard?limit=200`);
    const data = await res.json();
    const h2h: H2HMatch[] = [];
    for (const evt of data.events || []) {
      const comps = evt.competitions?.[0]?.competitors || [];
      const ids = comps.map((c: any) => c.team?.id);
      if (ids.includes(homeTeamId) && ids.includes(awayTeamId)) {
        const h = comps.find((c: any) => c.homeAway === 'home');
        const a = comps.find((c: any) => c.homeAway === 'away');
        h2h.push({
          date: new Date(evt.date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          }),
          home: {
            name: h?.team?.abbreviation || '?',
            score: h?.score || '0',
            logo: h?.team?.logo || null,
          },
          away: {
            name: a?.team?.abbreviation || '?',
            score: a?.score || '0',
            logo: a?.team?.logo || null,
          },
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
  'Shots on Target',
  'Shots',
  'Fouls',
  'Yellow Cards',
  'Red Cards',
  'Offsides',
  'Corner Kicks',
  'Ball Possession',
];

const EVENT_ICONS: Record<KeyEvent['type'], { sf: string; material: string; color: string }> = {
  goal: { sf: 'soccerball', material: 'sports-soccer', color: '#4ADE80' },
  yellow: { sf: 'rectangle.fill', material: 'square', color: '#FACC15' },
  red: { sf: 'rectangle.fill', material: 'square', color: LIVE_COLOR },
  substitution: { sf: 'arrow.left.arrow.right', material: 'swap-horiz', color: TEXT_SECONDARY },
  other: { sf: 'circle.fill', material: 'circle', color: TEXT_MUTED },
};

type Tab = 'summary' | 'stats' | 'events' | 'lineups' | 'h2h';
const TABS: { key: Tab; label: string }[] = [
  { key: 'summary', label: 'Summary' },
  { key: 'stats', label: 'Stats' },
  { key: 'events', label: 'Events' },
  { key: 'lineups', label: 'Lineups' },
  { key: 'h2h', label: 'H2H' },
];

export default function MatchScreen() {
  const { id: eventId, leagueId } = useLocalSearchParams<{ id: string; leagueId: string }>();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [match, setMatch] = useState<MatchDetail | null>(null);
  const [h2h, setH2H] = useState<H2HMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('summary');

  const load = useCallback(
    async (initial = false) => {
      if (initial) setLoading(true);
      const detail = await fetchMatchDetail(leagueId || 'eng.1', eventId);
      setMatch(detail);
      if (initial && detail) {
        const h2hData = await fetchH2H(detail.home.id, detail.away.id, leagueId || 'eng.1');
        setH2H(h2hData);
      }
      if (initial) setLoading(false);
    },
    [eventId, leagueId],
  );

  useEffect(() => {
    load(true);
  }, [load]);

  const isLive = match?.statusState === 'in';
  const isPost = match?.statusState === 'post';
  useInterval(
    () => {
      load(false);
    },
    isLive ? 5000 : null,
  );

  // Live Activity wiring (iOS only)
  const [laActive, setLaActive] = useState(false);
  const leagueName = getLeagueById(leagueId || 'eng.1')?.shortName || (leagueId || 'eng.1').toUpperCase();
  const autoStartedRef = useRef(false);

  // Pulsing animation for the live dot
  const pulseAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (!isLive) return;
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.3, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [isLive, pulseAnim]);

  // Keep track of previous match state to detect transitions
  const prevStatusRef = useRef<string | null>(null);

  useEffect(() => {
    if (Platform.OS !== 'ios' || !match) return;

    const props = {
      homeTeam: match.home.name,
      homeAbbrev: match.home.abbrev,
      homeScore: match.home.score,
      awayTeam: match.away.name,
      awayAbbrev: match.away.abbrev,
      awayScore: match.away.score,
      clock: match.clock,
      statusDetail: match.statusDetail,
      leagueName,
      isLive: match.statusState === 'in',
    };

    if (isLive) {
      if (hasActiveActivity(eventId)) {
        // Update existing activity with fresh data
        updateMatchActivity(eventId, props);
      } else if (!autoStartedRef.current) {
        // Auto-start Live Activity the first time we detect a live match
        autoStartedRef.current = true;
        startMatchActivity(eventId, props).then(() => setLaActive(true));
      }
    }

    // Auto-end if match just transitioned from live → finished
    if (isPost && prevStatusRef.current === 'in' && hasActiveActivity(eventId)) {
      endMatchActivity(eventId);
      setLaActive(false);
    }

    prevStatusRef.current = match.statusState;
    setLaActive(hasActiveActivity(eventId));
  }, [match, eventId, isLive, isPost, leagueName]);

  // Cleanup: only end the activity if one is actually running
  useEffect(() => {
    return () => {
      if (Platform.OS === 'ios' && hasActiveActivity(eventId)) {
        endMatchActivity(eventId);
      }
    };
  }, [eventId]);

  const handleToggleLiveActivity = async () => {
    if (Platform.OS !== 'ios' || !match) return;
    if (laActive) {
      await endMatchActivity(eventId);
      setLaActive(false);
      autoStartedRef.current = false;
    } else {
      if (!isLive) {
        Alert.alert('Live Activity', 'Live Activities are only available for matches currently in progress.', [
          { text: 'OK' },
        ]);
        return;
      }
      await startMatchActivity(eventId, {
        homeTeam: match.home.name,
        homeAbbrev: match.home.abbrev,
        homeScore: match.home.score,
        awayTeam: match.away.name,
        awayAbbrev: match.away.abbrev,
        awayScore: match.away.score,
        clock: match.clock,
        statusDetail: match.statusDetail,
        leagueName,
        isLive: true,
      });
      setLaActive(true);
    }
  };

  // Android back button component
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

  if (loading || !match) {
    return (
      <ThemedView style={styles.container}>
        <Stack.Screen
          options={{
            headerShown: true,
            headerTitle: 'Match',
            headerStyle: { backgroundColor: BG },
            headerTintColor: TEXT,
            headerBackTitle: '',
            headerLeft,
          }}
        />
        <View style={styles.center}>
          <ActivityIndicator color={ACCENT} size="large" />
        </View>
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
          headerLeft,
        }}
      />
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 80 }} showsVerticalScrollIndicator={false} contentInsetAdjustmentBehavior="automatic">
        {/* Score Hero */}
        <View style={styles.hero}>
          <View style={styles.heroBadge}>
            {isLive ? (
              <View style={styles.liveBadge}>
                <Animated.View style={[styles.liveDot, { opacity: pulseAnim }]} />
                <ThemedText style={styles.liveBadgeText}>
                  {match.clock}' — {match.statusDetail}
                </ThemedText>
              </View>
            ) : (
              <ThemedText style={styles.statusText}>{match.statusDetail}</ThemedText>
            )}
          </View>

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
              <ThemedText style={styles.heroTeamName} numberOfLines={2}>
                {match.home.name}
              </ThemedText>
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
              {isLive && (
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
              <ThemedText style={styles.heroTeamName} numberOfLines={2}>
                {match.away.name}
              </ThemedText>
            </View>
          </View>

          {(match.venue || match.broadcast) && (
            <View style={styles.heroMeta}>
              {match.venue ? (
                <ThemedText style={styles.heroMetaText}>
                  {match.venue}
                  {match.city ? `, ${match.city}` : ''}
                </ThemedText>
              ) : null}
              {match.broadcast ? <ThemedText style={styles.heroBroadcast}>📺 {match.broadcast}</ThemedText> : null}
            </View>
          )}

          {/* Live Activity toggle — iOS only */}
          {Platform.OS === 'ios' && (
            <TouchableOpacity
              style={[styles.laButton, laActive && styles.laButtonActive, !isLive && styles.laButtonDisabled]}
              onPress={handleToggleLiveActivity}
              activeOpacity={isLive ? 0.75 : 0.5}
            >
              <Icon
                sf={laActive ? 'livephoto.slash' : 'livephoto'}
                material="live-tv"
                size={14}
                color={laActive ? BG : isLive ? ACCENT : TEXT_MUTED}
              />
              <ThemedText
                style={[
                  styles.laButtonText,
                  laActive && styles.laButtonTextActive,
                  !isLive && styles.laButtonTextDisabled,
                ]}
              >
                {laActive
                  ? 'Stop Live Activity'
                  : isLive
                    ? 'Add to Dynamic Island'
                    : isPost
                      ? 'Match ended'
                      : 'Starts when live'}
              </ThemedText>
            </TouchableOpacity>
          )}
        </View>

        {/* Tab bar */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabBarScroll} contentInsetAdjustmentBehavior="automatic">
          <View style={styles.tabBar}>
            {TABS.map((tab) => (
              <TouchableOpacity
                key={tab.key}
                style={[styles.tab, activeTab === tab.key && styles.tabActive]}
                onPress={() => setActiveTab(tab.key)}
              >
                <ThemedText style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
                  {tab.label}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

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
                      : `Full-time: ${match.home.name} ${match.home.score}–${match.away.score} ${match.away.name}`}
                </ThemedText>
              </View>
            )}

            {/* Quick stat highlights in summary */}
            {match.home.stats && match.home.stats.length > 0 && (
              <View style={styles.card}>
                <ThemedText style={styles.cardTitle}>Key Stats</ThemedText>
                <View style={styles.quickStats}>
                  {match.home.stats
                    .filter((s) =>
                      ['Ball Possession', 'Shots on Target', 'Shots'].some((k) =>
                        s.name?.toLowerCase().includes(k.toLowerCase()),
                      ),
                    )
                    .slice(0, 3)
                    .map((stat, i) => (
                      <View key={i} style={styles.quickStatItem}>
                        <ThemedText style={styles.quickStatValue}>{stat.homeValue}</ThemedText>
                        <ThemedText style={styles.quickStatName}>{stat.name}</ThemedText>
                        <ThemedText style={styles.quickStatValue}>{stat.awayValue}</ThemedText>
                      </View>
                    ))}
                </View>
              </View>
            )}
          </View>
        )}

        {activeTab === 'stats' && (
          <View style={styles.tabContent}>
            {match.home.stats && match.home.stats.length > 0 ? (
              <View style={styles.statsCard}>
                {/* Header */}
                <View style={styles.statHeader}>
                  <View style={styles.statTeamHeaderSide}>
                    {match.home.logo && (
                      <Image source={{ uri: match.home.logo }} style={styles.statHeaderLogo} contentFit="contain" />
                    )}
                    <ThemedText style={styles.statHeaderTeam}>{match.home.abbrev}</ThemedText>
                  </View>
                  <ThemedText style={styles.statHeaderCenter}>Stats</ThemedText>
                  <View style={[styles.statTeamHeaderSide, { justifyContent: 'flex-end' }]}>
                    <ThemedText style={styles.statHeaderTeam}>{match.away.abbrev}</ThemedText>
                    {match.away.logo && (
                      <Image source={{ uri: match.away.logo }} style={styles.statHeaderLogo} contentFit="contain" />
                    )}
                  </View>
                </View>
                {match.home.stats
                  .filter((s) => MAIN_STATS.some((k) => s.name?.toLowerCase().includes(k.toLowerCase())))
                  .map((stat, i) => {
                    const homeNum = parseFloat(stat.homeValue) || 0;
                    const awayNum = parseFloat(stat.awayValue) || 0;
                    const total = homeNum + awayNum;
                    const homeBar = total > 0 ? homeNum / total : 0.5;
                    return (
                      <View key={i} style={[styles.statRow, i > 0 && { borderTopWidth: 1, borderTopColor: BORDER }]}>
                        <ThemedText style={styles.statValue}>{stat.homeValue}</ThemedText>
                        <View style={styles.statBarContainer}>
                          <ThemedText style={styles.statName}>{stat.name}</ThemedText>
                          <View style={styles.statBar}>
                            <View style={[styles.statBarFill, { flex: homeBar }]} />
                            <View style={[styles.statBarAway, { flex: 1 - homeBar }]} />
                          </View>
                        </View>
                        <ThemedText style={styles.statValue}>{stat.awayValue}</ThemedText>
                      </View>
                    );
                  })}
              </View>
            ) : (
              <View style={styles.center}>
                <Icon sf="chart.bar" material="bar-chart" size={44} color={TEXT_MUTED} />
                <ThemedText style={styles.emptyText}>
                  {match.statusState === 'pre' ? 'Stats available once the match starts' : 'Stats not available'}
                </ThemedText>
              </View>
            )}
          </View>
        )}

        {activeTab === 'events' && (
          <View style={styles.tabContent}>
            {match.keyEvents.length === 0 ? (
              <View style={styles.center}>
                <Icon sf="clock" material="history" size={44} color={TEXT_MUTED} />
                <ThemedText style={styles.emptyText}>
                  {match.statusState === 'pre' ? 'Events will appear once the match starts' : 'No key events available'}
                </ThemedText>
              </View>
            ) : (
              <View style={styles.statsCard}>
                {/* Column labels */}
                <View style={styles.eventsHeader}>
                  <ThemedText style={[styles.eventsHeaderTeam]}>{match.home.abbrev}</ThemedText>
                  <View style={styles.eventsHeaderMid} />
                  <ThemedText style={[styles.eventsHeaderTeam, { textAlign: 'right' }]}>{match.away.abbrev}</ThemedText>
                </View>
                {match.keyEvents.map((evt, i) => {
                  const icon = EVENT_ICONS[evt.type];
                  const isHome = evt.team === 'home';
                  const isAway = evt.team === 'away';
                  return (
                    <View
                      key={evt.id}
                      style={[styles.eventRow, i > 0 && { borderTopWidth: 1, borderTopColor: BORDER }]}
                    >
                      <View style={styles.eventSide}>
                        {isHome && (
                          <ThemedText style={styles.eventText} numberOfLines={2}>
                            {evt.text}
                          </ThemedText>
                        )}
                      </View>
                      <View style={styles.eventMid}>
                        <Icon sf={icon.sf} material={icon.material} size={14} color={icon.color} />
                        <ThemedText style={styles.eventClock}>{evt.clock}'</ThemedText>
                      </View>
                      <View style={[styles.eventSide, { alignItems: 'flex-end' }]}>
                        {isAway && (
                          <ThemedText style={[styles.eventText, { textAlign: 'right' }]} numberOfLines={2}>
                            {evt.text}
                          </ThemedText>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        )}

        {activeTab === 'lineups' && (
          <View style={styles.tabContent}>
            {!match.lineups || (match.lineups.home.length === 0 && match.lineups.away.length === 0) ? (
              <View style={styles.center}>
                <Icon sf="person.2" material="people" size={44} color={TEXT_MUTED} />
                <ThemedText style={styles.emptyText}>
                  {match.statusState === 'pre' ? 'Lineups not yet announced' : 'Lineups not available'}
                </ThemedText>
              </View>
            ) : (
              <>
                <View style={styles.lineupsHeader}>
                  <View style={styles.lineupsTeamHeader}>
                    {match.home.logo && (
                      <Image source={{ uri: match.home.logo }} style={styles.lineupHeaderLogo} contentFit="contain" />
                    )}
                    <ThemedText style={styles.lineupsTeamName}>{match.home.abbrev}</ThemedText>
                    {match.lineups.homeFormation && (
                      <ThemedText style={styles.formationBadge}>{match.lineups.homeFormation}</ThemedText>
                    )}
                  </View>
                  <View style={styles.lineupsTeamHeader}>
                    {match.lineups.awayFormation && (
                      <ThemedText style={styles.formationBadge}>{match.lineups.awayFormation}</ThemedText>
                    )}
                    <ThemedText style={styles.lineupsTeamName}>{match.away.abbrev}</ThemedText>
                    {match.away.logo && (
                      <Image source={{ uri: match.away.logo }} style={styles.lineupHeaderLogo} contentFit="contain" />
                    )}
                  </View>
                </View>

                <View style={styles.statsCard}>
                  {Array.from({
                    length: Math.max(match.lineups.home.length, match.lineups.away.length),
                  }).map((_, i) => {
                    const hp = match.lineups!.home[i];
                    const ap = match.lineups!.away[i];
                    return (
                      <View key={i} style={[styles.lineupRow, i > 0 && { borderTopWidth: 1, borderTopColor: BORDER }]}>
                        <View style={styles.lineupPlayerSide}>
                          {hp && (
                            <>
                              <ThemedText style={styles.lineupNumber}>{hp.number}</ThemedText>
                              <ThemedText style={styles.lineupName} numberOfLines={1}>
                                {hp.name}
                              </ThemedText>
                              <ThemedText style={styles.lineupPos}>{hp.position}</ThemedText>
                            </>
                          )}
                        </View>
                        <View style={styles.lineupDivider} />
                        <View style={[styles.lineupPlayerSide, { alignItems: 'flex-end' }]}>
                          {ap && (
                            <>
                              <ThemedText style={styles.lineupPos}>{ap.position}</ThemedText>
                              <ThemedText style={styles.lineupName} numberOfLines={1}>
                                {ap.name}
                              </ThemedText>
                              <ThemedText style={styles.lineupNumber}>{ap.number}</ThemedText>
                            </>
                          )}
                        </View>
                      </View>
                    );
                  })}
                </View>
              </>
            )}
          </View>
        )}

        {activeTab === 'h2h' && (
          <View style={styles.tabContent}>
            {h2h.length === 0 ? (
              <View style={styles.center}>
                <Icon sf="person.2" material="people" size={44} color={TEXT_MUTED} />
                <ThemedText style={styles.emptyText}>No recent head-to-head data</ThemedText>
              </View>
            ) : (
              <View style={styles.statsCard}>
                <View style={styles.h2hHeader}>
                  <View style={styles.h2hTeamHeader}>
                    {match.home.logo && (
                      <Image source={{ uri: match.home.logo }} style={styles.h2hLogo} contentFit="contain" />
                    )}
                    <ThemedText style={styles.h2hTeamLabel}>{match.home.abbrev}</ThemedText>
                  </View>
                  <ThemedText style={styles.h2hHeaderLabel}>Recent Meetings</ThemedText>
                  <View style={styles.h2hTeamHeader}>
                    <ThemedText style={styles.h2hTeamLabel}>{match.away.abbrev}</ThemedText>
                    {match.away.logo && (
                      <Image source={{ uri: match.away.logo }} style={styles.h2hLogo} contentFit="contain" />
                    )}
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
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1A0000',
    borderWidth: 1,
    borderColor: '#3A0000',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: LIVE_COLOR },
  liveBadgeText: { fontSize: 13, fontWeight: '700', color: LIVE_COLOR },
  statusText: { fontSize: 13, fontWeight: '600', color: TEXT_MUTED },
  heroTeams: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heroTeam: { flex: 1, alignItems: 'center', gap: 10 },
  heroLogoRing: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#0A0A0A',
    borderWidth: 2,
    borderColor: BORDER,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  heroLogo: { width: 56, height: 56 },
  logoChar: { fontSize: 24, fontWeight: '800', color: TEXT },
  heroTeamName: {
    fontSize: 13,
    fontWeight: '600',
    color: TEXT,
    textAlign: 'center',
    lineHeight: 18,
  },
  heroScore: { alignItems: 'center', paddingHorizontal: 8 },
  scoreText: { fontSize: 36, fontWeight: '800', color: TEXT, letterSpacing: 2 },
  vsText: { fontSize: 22, fontWeight: '700', color: TEXT_MUTED },
  periodText: { fontSize: 12, color: LIVE_COLOR, fontWeight: '600', marginTop: 4 },
  heroMeta: { alignItems: 'center', marginTop: 16, gap: 4 },
  heroMetaText: { fontSize: 12, color: TEXT_MUTED },
  heroBroadcast: { fontSize: 12, color: TEXT_SECONDARY },
  // Tabs
  tabBarScroll: { borderBottomWidth: 1, borderBottomColor: BORDER },
  tabBar: { flexDirection: 'row', paddingHorizontal: 4 },
  tab: { paddingVertical: 12, paddingHorizontal: 16, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: ACCENT },
  tabText: { fontSize: 14, fontWeight: '500', color: TEXT_MUTED },
  tabTextActive: { color: ACCENT, fontWeight: '700' },
  tabContent: { paddingTop: 16, paddingBottom: 8 },
  // Cards
  card: {
    marginHorizontal: 16,
    backgroundColor: SURFACE,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 16,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: TEXT_SECONDARY,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 8,
  },
  cardBody: { fontSize: 14, color: TEXT, lineHeight: 21 },
  // Quick stats in summary
  quickStats: { gap: 8 },
  quickStatItem: { flexDirection: 'row', alignItems: 'center' },
  quickStatValue: { width: 48, fontSize: 14, fontWeight: '700', color: TEXT, textAlign: 'center' },
  quickStatName: { flex: 1, fontSize: 13, color: TEXT_SECONDARY, textAlign: 'center' },
  // Stats tab
  statsCard: {
    marginHorizontal: 16,
    backgroundColor: SURFACE,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: BORDER,
    overflow: 'hidden',
    marginBottom: 16,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  statTeamHeaderSide: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 },
  statHeaderLogo: { width: 20, height: 20 },
  statHeaderTeam: { fontSize: 13, fontWeight: '700', color: TEXT },
  statHeaderCenter: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: TEXT_SECONDARY,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  statValue: { width: 48, fontSize: 14, fontWeight: '700', color: TEXT, textAlign: 'center' },
  statBarContainer: { flex: 1, alignItems: 'center', gap: 4 },
  statName: { fontSize: 12, color: TEXT_SECONDARY, textAlign: 'center' },
  statBar: { flexDirection: 'row', height: 4, borderRadius: 2, overflow: 'hidden', width: '100%' },
  statBarFill: { backgroundColor: ACCENT },
  statBarAway: { backgroundColor: '#333' },
  // Events tab
  eventsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  eventsHeaderTeam: {
    width: 60,
    fontSize: 12,
    fontWeight: '700',
    color: TEXT_SECONDARY,
    textTransform: 'uppercase',
  },
  eventsHeaderMid: { flex: 1 },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    gap: 8,
  },
  eventSide: { flex: 1 },
  eventMid: { alignItems: 'center', gap: 2, width: 48 },
  eventClock: { fontSize: 11, color: TEXT_MUTED, fontWeight: '600' },
  eventText: { fontSize: 13, color: TEXT, fontWeight: '500' },
  // Lineups tab
  lineupsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 8,
    paddingTop: 4,
  },
  lineupsTeamHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  lineupsTeamName: { fontSize: 14, fontWeight: '700', color: TEXT },
  lineupHeaderLogo: { width: 22, height: 22 },
  formationBadge: {
    fontSize: 12,
    color: TEXT_SECONDARY,
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  lineupRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  lineupPlayerSide: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
  },
  lineupDivider: { width: 1, height: '100%', backgroundColor: BORDER },
  lineupNumber: {
    fontSize: 12,
    fontWeight: '700',
    color: TEXT_MUTED,
    width: 20,
    textAlign: 'center',
  },
  lineupName: { flex: 1, fontSize: 14, fontWeight: '600', color: TEXT },
  lineupPos: { fontSize: 11, color: TEXT_SECONDARY, fontWeight: '500' },
  // H2H
  h2hHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  h2hTeamHeader: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 },
  h2hHeaderLabel: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: TEXT_SECONDARY,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  h2hTeamLabel: { fontSize: 13, fontWeight: '700', color: TEXT },
  h2hLogo: { width: 20, height: 20 },
  h2hRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  h2hScore: { width: 32, fontSize: 16, fontWeight: '700', color: TEXT_MUTED, textAlign: 'center' },
  h2hWinner: { color: TEXT, fontWeight: '800' },
  h2hMid: { flex: 1, alignItems: 'center', gap: 2 },
  h2hDate: { fontSize: 12, color: TEXT_SECONDARY },
  h2hComp: { fontSize: 11, color: TEXT_MUTED },
  // Live Activity button
  laButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'center',
    marginTop: 14,
    borderWidth: 1,
    borderColor: ACCENT,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  laButtonActive: { backgroundColor: ACCENT, borderColor: ACCENT },
  laButtonDisabled: { borderColor: BORDER, backgroundColor: 'transparent' },
  laButtonText: { fontSize: 13, fontWeight: '600', color: ACCENT },
  laButtonTextActive: { color: BG },
  laButtonTextDisabled: { color: TEXT_MUTED },
});
