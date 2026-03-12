import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Platform,
  Alert,
  Animated as RNAnimated,
} from 'react-native';
import Animated, { SharedTransition } from 'react-native-reanimated';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Icon } from '@/components/icon';
import { useInterval } from '@/hooks/use-interval';
import { getLeagueById } from '@/utils/leagues';
import { startMatchActivity, updateMatchActivity, endMatchActivity, hasActiveActivity } from '@/utils/liveActivity';
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
  date: string;
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
  h2h: H2HMatch[];
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
      // ESPN summary API exposes logo at team.logos[0].href or team.logo (scoreboard)
      const logo = c.team?.logos?.[0]?.href || c.team?.logo || null;
      // Normalise color — strip leading '#' so we store a bare hex string
      const rawColor: string = c.team?.color || 'FFFFFF';
      const color = rawColor.startsWith('#') ? rawColor.slice(1) : rawColor;
      return {
        id: c.team?.id || '',
        name: c.team?.displayName || c.team?.name || 'TBD',
        abbrev: c.team?.abbreviation || 'TBD',
        logo,
        color,
        score: c.score ?? '0',
      };
    };

    const home = getTeam('home');
    const away = getTeam('away');

    // Extract stats — keep home and away values separate
    const boxscore = data.boxscore;
    const boxscoreTeams = boxscore?.teams || boxscore?.stats || [];
    if (boxscoreTeams.length > 0) {
      const homeStats = boxscoreTeams.find((s: any) => s.team?.id === home.id || s.team?.homeAway === 'home');
      const awayStats = boxscoreTeams.find((s: any) => s.team?.id === away.id || s.team?.homeAway === 'away');

      const homeArr: any[] = homeStats?.statistics || homeStats?.stats || [];
      const awayArr: any[] = awayStats?.statistics || awayStats?.stats || [];

      home.stats = homeArr.map((s: any, i: number) => ({
        name: s.name,
        homeValue: s.displayValue,
        awayValue: awayArr[i]?.displayValue ?? '0',
      }));
    }

    // Key events (plays/events)
    const keyEvents: KeyEvent[] = [];
    const sourceEvents: any[] = data.keyEvents || data.plays || [];
    for (const play of sourceEvents) {
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

    // H2H
    const h2hGames: H2HMatch[] = [];
    const h2hSource = data.headToHeadGames?.[0]?.games || [];
    for (const g of h2hSource) {
      if (g.gameResult) {
        const isHomeSameAsCurrentHome = g.homeTeamId === home.id;
        const h2hHome = isHomeSameAsCurrentHome ? home : away;
        const h2hAway = isHomeSameAsCurrentHome ? away : home;
        h2hGames.push({
          date: new Date(g.gameDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          home: { name: h2hHome.abbrev, score: g.homeTeamScore || '0', logo: h2hHome.logo },
          away: { name: h2hAway.abbrev, score: g.awayTeamScore || '0', logo: h2hAway.logo },
          competition: g.leagueAbbreviation || g.leagueName || '',
        });
      }
    }

    return {
      id: eventId,
      date: comp.date || data.header?.competitions?.[0]?.date || '',
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
      h2h: h2hGames,
    };
  } catch (e) {
    console.error('fetchMatchDetail error', e);
    return null;
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

function formatCountdown(dateStr: string): string {
  const diff = new Date(dateStr).getTime() - Date.now();
  if (diff <= 0) return 'Starting soon';
  const totalMins = Math.floor(diff / 60000);
  const hrs = Math.floor(totalMins / 60);
  const mins = totalMins % 60;
  if (hrs > 24) {
    const days = Math.floor(hrs / 24);
    return `${days}d ${hrs % 24}h`;
  }
  if (hrs > 0) return `${hrs}h ${mins}m`;
  return `${mins}m`;
}

const EVENT_ICONS: Record<KeyEvent['type'], { sf: string; material: string; color: string }> = {
  goal: { sf: 'soccerball', material: 'sports-soccer', color: '#4ADE80' },
  yellow: { sf: 'rectangle.fill', material: 'square', color: '#FACC15' },
  red: { sf: 'rectangle.fill', material: 'square', color: LIVE_COLOR },
  substitution: { sf: 'arrow.left.arrow.right', material: 'swap-horiz', color: TEXT_SECONDARY },
  other: { sf: 'circle.fill', material: 'circle', color: TEXT_MUTED },
};

// ── TeamLogo ──────────────────────────────────────────────────────────────────
function TeamLogo({
  logo,
  abbrev,
  color,
  size = 64,
}: {
  logo: string | null;
  abbrev: string;
  color: string;
  size?: number;
}) {
  const borderColor = color && color !== 'FFFFFF' && color !== 'ffffff' ? `#${color}` : BORDER;
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: '#0A0A0A',
        borderWidth: 2,
        borderColor,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      {logo ? (
        <Image
          source={{ uri: logo }}
          style={{ width: size * 0.72, height: size * 0.72 }}
          contentFit="contain"
          cachePolicy="memory-disk"
        />
      ) : (
        <ThemedText style={{ fontSize: size * 0.35, fontWeight: '800', color: TEXT }}>{abbrev.slice(0, 2)}</ThemedText>
      )}
    </View>
  );
}

// ── PitchView ─────────────────────────────────────────────────────────────────
function parseRows(formation: string | undefined, count: number): number[] {
  if (formation) {
    const parts = formation.split('-').map(Number).filter(Boolean);
    if (parts.length > 0) return [1, ...parts];
  }
  // fallback: 1 GK + distribute the rest
  const outfield = count - 1;
  if (outfield <= 0) return [count];
  if (outfield <= 4) return [1, outfield];
  if (outfield <= 7) return [1, Math.ceil(outfield / 2), Math.floor(outfield / 2)];
  return [1, 4, 3, 3];
}

function PitchView({
  homePlayers,
  awayPlayers,
  homeFormation,
  awayFormation,
  homeAbbrev,
  awayAbbrev,
  homeColor,
  awayColor,
}: {
  homePlayers: Player[];
  awayPlayers: Player[];
  homeFormation?: string;
  awayFormation?: string;
  homeAbbrev: string;
  awayAbbrev: string;
  homeColor: string;
  awayColor: string;
}) {
  const homeRows = parseRows(homeFormation, homePlayers.length || 11);
  const awayRows = parseRows(awayFormation, awayPlayers.length || 11);

  const homeColor6 = homeColor && homeColor !== 'FFFFFF' && homeColor !== 'ffffff' ? `#${homeColor}` : ACCENT;
  const awayColor6 = awayColor && awayColor !== 'FFFFFF' && awayColor !== 'ffffff' ? `#${awayColor}` : '#60a5fa';

  let homeIdx = 0;
  let awayIdx = 0;

  return (
    <View style={{ marginHorizontal: 16, marginBottom: 16 }}>
      {/* Formation labels */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
        <ThemedText style={{ fontSize: 13, fontWeight: '700', color: TEXT }}>
          {homeAbbrev}
          {homeFormation ? `  ${homeFormation}` : ''}
        </ThemedText>
        <ThemedText style={{ fontSize: 13, fontWeight: '700', color: TEXT }}>
          {awayFormation ? `${awayFormation}  ` : ''}
          {awayAbbrev}
        </ThemedText>
      </View>

      {/* Pitch */}
      <View
        style={{
          backgroundColor: '#1A3A1A',
          borderRadius: 10,
          borderWidth: 1,
          borderColor: '#2D5A2D',
          overflow: 'hidden',
          paddingVertical: 12,
        }}
      >
        {/* Centre line */}
        <View
          style={{
            position: 'absolute',
            left: '50%',
            top: 0,
            bottom: 0,
            width: 1,
            backgroundColor: 'rgba(255,255,255,0.12)',
          }}
        />
        {/* Centre circle */}
        <View
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: 60,
            height: 60,
            marginLeft: -30,
            marginTop: -30,
            borderRadius: 30,
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.12)',
          }}
        />

        <View style={{ flexDirection: 'row' }}>
          {/* Home side — rows rendered left→right (GK on left) */}
          <View style={{ flex: 1, gap: 10, paddingVertical: 8, paddingLeft: 8 }}>
            {homeRows.map((count, ri) => {
              const rowPlayers: Player[] = [];
              for (let i = 0; i < count && homeIdx < homePlayers.length; i++, homeIdx++) {
                rowPlayers.push(homePlayers[homeIdx]);
              }
              return (
                <View key={ri} style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
                  {rowPlayers.map((p, pi) => (
                    <View key={pi} style={{ alignItems: 'center', gap: 3, flex: 1 }}>
                      <View
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 14,
                          backgroundColor: homeColor6,
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderWidth: 1.5,
                          borderColor: 'rgba(255,255,255,0.3)',
                        }}
                      >
                        <ThemedText style={{ fontSize: 9, fontWeight: '800', color: '#fff' }}>
                          {p.number || '?'}
                        </ThemedText>
                      </View>
                      <ThemedText
                        numberOfLines={1}
                        style={{
                          fontSize: 8,
                          color: 'rgba(255,255,255,0.8)',
                          fontWeight: '600',
                          textAlign: 'center',
                          maxWidth: 40,
                        }}
                      >
                        {p.name.split(' ').pop()}
                      </ThemedText>
                    </View>
                  ))}
                </View>
              );
            })}
          </View>

          {/* Away side — rows rendered right→left (GK on right) */}
          <View style={{ flex: 1, gap: 10, paddingVertical: 8, paddingRight: 8 }}>
            {[...awayRows].reverse().map((count, ri) => {
              const rowPlayers: Player[] = [];
              for (let i = 0; i < count && awayIdx < awayPlayers.length; i++, awayIdx++) {
                rowPlayers.push(awayPlayers[awayIdx]);
              }
              return (
                <View key={ri} style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
                  {rowPlayers.map((p, pi) => (
                    <View key={pi} style={{ alignItems: 'center', gap: 3, flex: 1 }}>
                      <View
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 14,
                          backgroundColor: awayColor6,
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderWidth: 1.5,
                          borderColor: 'rgba(255,255,255,0.3)',
                        }}
                      >
                        <ThemedText style={{ fontSize: 9, fontWeight: '800', color: '#fff' }}>
                          {p.number || '?'}
                        </ThemedText>
                      </View>
                      <ThemedText
                        numberOfLines={1}
                        style={{
                          fontSize: 8,
                          color: 'rgba(255,255,255,0.8)',
                          fontWeight: '600',
                          textAlign: 'center',
                          maxWidth: 40,
                        }}
                      >
                        {p.name.split(' ').pop()}
                      </ThemedText>
                    </View>
                  ))}
                </View>
              );
            })}
          </View>
        </View>
      </View>

      {/* Player list below pitch */}
      <View style={[styles.statsCard, { marginTop: 12 }]}>
        <View style={styles.statHeader}>
          <ThemedText style={[styles.statHeaderTeam, { flex: 1 }]}>{homeAbbrev}</ThemedText>
          <ThemedText style={styles.statHeaderCenter}>#</ThemedText>
          <ThemedText style={[styles.statHeaderTeam, { flex: 1, textAlign: 'right' }]}>{awayAbbrev}</ThemedText>
        </View>
        {Array.from({ length: Math.max(homePlayers.length, awayPlayers.length) }).map((_, i) => {
          const hp = homePlayers[i];
          const ap = awayPlayers[i];
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
    </View>
  );
}

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
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('summary');

  const load = useCallback(
    async (initial = false) => {
      if (initial) setLoading(true);
      const detail = await fetchMatchDetail(leagueId || 'eng.1', eventId);
      setMatch(detail);
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
  const pulseAnim = useRef(new RNAnimated.Value(1)).current;
  useEffect(() => {
    if (!isLive) return;
    const anim = RNAnimated.loop(
      RNAnimated.sequence([
        RNAnimated.timing(pulseAnim, { toValue: 0.3, duration: 800, useNativeDriver: true }),
        RNAnimated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
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
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
      >
        {/* Score Hero */}
        <View style={styles.hero}>
          <View style={styles.heroBadge}>
            {isLive ? (
              <View style={styles.liveBadge}>
                <RNAnimated.View style={[styles.liveDot, { opacity: pulseAnim }]} />
                <ThemedText style={styles.liveBadgeText}>{match.statusDetail}</ThemedText>
              </View>
            ) : (
              <ThemedText style={styles.statusText}>{match.statusDetail}</ThemedText>
            )}
          </View>

          <View style={styles.heroTeams}>
            {/* Home */}
            <View style={styles.heroTeam}>
              <Animated.View
                sharedTransitionTag={`match-home-logo-${eventId}`}
                sharedTransitionStyle={springTransition}
              >
                <TeamLogo logo={match.home.logo} abbrev={match.home.abbrev} color={match.home.color} size={72} />
              </Animated.View>
              <ThemedText style={styles.heroTeamName} numberOfLines={2}>
                {match.home.name}
              </ThemedText>
            </View>

            {/* Score */}
            <View style={styles.heroScore}>
              {match.statusState === 'pre' ? (
                <>
                  <ThemedText style={styles.vsText}>vs</ThemedText>
                  {match.date ? (
                    <ThemedText style={styles.periodText}>Starts in {formatCountdown(match.date)}</ThemedText>
                  ) : null}
                </>
              ) : (
                <ThemedText style={styles.scoreText}>
                  {match.home.score} - {match.away.score}
                </ThemedText>
              )}
              {isLive && (
                <ThemedText style={styles.periodText}>
                  {match.period === 1 ? '1st Half' : match.period === 2 ? '2nd Half' : `Period ${match.period}`}
                </ThemedText>
              )}
              {isPost && <ThemedText style={styles.periodText}>Full Time</ThemedText>}
            </View>

            {/* Away */}
            <View style={styles.heroTeam}>
              <Animated.View
                sharedTransitionTag={`match-away-logo-${eventId}`}
                sharedTransitionStyle={springTransition}
              >
                <TeamLogo logo={match.away.logo} abbrev={match.away.abbrev} color={match.away.color} size={72} />
              </Animated.View>
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
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tabBarScroll}
          contentInsetAdjustmentBehavior="automatic"
        >
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
            {/* Result / status card */}
            <View style={styles.card}>
              <ThemedText style={styles.cardTitle}>
                {match.statusState === 'pre' ? 'Preview' : match.statusState === 'in' ? 'In Progress' : 'Full Time'}
              </ThemedText>
              <ThemedText style={styles.cardBody}>
                {match.headlines
                  ? match.headlines
                  : match.statusState === 'pre'
                    ? `${match.home.name} host ${match.away.name}${match.venue ? ` at ${match.venue}` : ''}.`
                    : match.statusState === 'in'
                      ? `${match.home.name} ${match.home.score}–${match.away.score} ${match.away.name} — ${match.statusDetail}`
                      : `${match.home.name} ${match.home.score}–${match.away.score} ${match.away.name}. Full time.`}
              </ThemedText>
            </View>

            {/* Match info card */}
            {(match.venue || match.broadcast) && (
              <View style={styles.card}>
                <ThemedText style={styles.cardTitle}>Match Info</ThemedText>
                {match.venue && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <Icon sf="mappin" material="location-on" size={14} color={TEXT_MUTED} />
                    <ThemedText style={styles.cardBody}>
                      {match.venue}
                      {match.city ? `, ${match.city}` : ''}
                    </ThemedText>
                  </View>
                )}
                {match.broadcast && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Icon sf="tv" material="tv" size={14} color={TEXT_MUTED} />
                    <ThemedText style={styles.cardBody}>{match.broadcast}</ThemedText>
                  </View>
                )}
              </View>
            )}

            {/* Key goals / cards inline */}
            {match.keyEvents.filter((e) => e.type === 'goal' || e.type === 'red' || e.type === 'yellow').length > 0 && (
              <View style={styles.statsCard}>
                <View style={[styles.statHeader, { paddingHorizontal: 16 }]}>
                  <ThemedText style={[styles.statHeaderTeam, { flex: 1 }]}>{match.home.abbrev}</ThemedText>
                  <ThemedText style={styles.statHeaderCenter}>Key Events</ThemedText>
                  <ThemedText style={[styles.statHeaderTeam, { flex: 1, textAlign: 'right' }]}>
                    {match.away.abbrev}
                  </ThemedText>
                </View>
                {match.keyEvents
                  .filter((e) => e.type === 'goal' || e.type === 'red' || e.type === 'yellow')
                  .map((evt, i) => {
                    const icon = EVENT_ICONS[evt.type];
                    const isHome = evt.team === 'home';
                    return (
                      <View
                        key={evt.id}
                        style={[styles.eventRow, i > 0 && { borderTopWidth: 1, borderTopColor: BORDER }]}
                      >
                        <View style={styles.eventSide}>
                          {isHome && (
                            <ThemedText style={styles.eventText} numberOfLines={1}>
                              {evt.text}
                            </ThemedText>
                          )}
                        </View>
                        <View style={styles.eventMid}>
                          <Icon sf={icon.sf} material={icon.material} size={13} color={icon.color} />
                          <ThemedText style={styles.eventClock}>{evt.clock}'</ThemedText>
                        </View>
                        <View style={[styles.eventSide, { alignItems: 'flex-end' }]}>
                          {!isHome && (
                            <ThemedText style={[styles.eventText, { textAlign: 'right' }]} numberOfLines={1}>
                              {evt.text}
                            </ThemedText>
                          )}
                        </View>
                      </View>
                    );
                  })}
              </View>
            )}

            {/* Quick stats */}
            {match.home.stats && match.home.stats.length > 0 && (
              <View style={styles.statsCard}>
                <View style={[styles.statHeader, { paddingHorizontal: 16 }]}>
                  <ThemedText style={[styles.statHeaderTeam, { flex: 1 }]}>{match.home.abbrev}</ThemedText>
                  <ThemedText style={styles.statHeaderCenter}>Stats</ThemedText>
                  <ThemedText style={[styles.statHeaderTeam, { flex: 1, textAlign: 'right' }]}>
                    {match.away.abbrev}
                  </ThemedText>
                </View>
                {match.home.stats
                  .filter((s) =>
                    ['Ball Possession', 'Shots on Target', 'Shots', 'Corner Kicks', 'Fouls'].some((k) =>
                      s.name?.toLowerCase().includes(k.toLowerCase()),
                    ),
                  )
                  .slice(0, 5)
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
                        <ThemedText style={[styles.statValue, { textAlign: 'right' }]}>{stat.awayValue}</ThemedText>
                      </View>
                    );
                  })}
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
                    <TeamLogo logo={match.home.logo} abbrev={match.home.abbrev} color={match.home.color} size={24} />
                    <ThemedText style={styles.statHeaderTeam}>{match.home.abbrev}</ThemedText>
                  </View>
                  <ThemedText style={styles.statHeaderCenter}>Stats</ThemedText>
                  <View style={[styles.statTeamHeaderSide, { justifyContent: 'flex-end' }]}>
                    <ThemedText style={styles.statHeaderTeam}>{match.away.abbrev}</ThemedText>
                    <TeamLogo logo={match.away.logo} abbrev={match.away.abbrev} color={match.away.color} size={24} />
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
              <PitchView
                homePlayers={match.lineups.home}
                awayPlayers={match.lineups.away}
                homeFormation={match.lineups.homeFormation}
                awayFormation={match.lineups.awayFormation}
                homeAbbrev={match.home.abbrev}
                awayAbbrev={match.away.abbrev}
                homeColor={match.home.color}
                awayColor={match.away.color}
              />
            )}
          </View>
        )}

        {activeTab === 'h2h' && (
          <View style={styles.tabContent}>
            {!match.h2h || match.h2h.length === 0 ? (
              <View style={styles.center}>
                <Icon sf="calendar.badge.exclamationmark" material="event-busy" size={44} color={TEXT_MUTED} />
                <ThemedText style={styles.emptyText}>No recent head-to-head data found</ThemedText>
              </View>
            ) : (
              <>
                {/* Summary row: W / D / L counts */}
                {(() => {
                  let hw = 0,
                    d = 0,
                    aw = 0;
                  match.h2h.forEach((m) => {
                    const hs = Number(m.home.score),
                      as2 = Number(m.away.score);
                    if (hs > as2) hw++;
                    else if (hs < as2) aw++;
                    else d++;
                  });
                  return (
                    <View style={[styles.statsCard, { marginBottom: 12 }]}>
                      <View style={{ flexDirection: 'row' }}>
                        <View
                          style={{
                            flex: 1,
                            alignItems: 'center',
                            padding: 14,
                            borderRightWidth: 1,
                            borderRightColor: BORDER,
                          }}
                        >
                          <ThemedText style={{ fontSize: 22, fontWeight: '800', color: '#4ADE80' }}>{hw}</ThemedText>
                          <ThemedText style={{ fontSize: 12, color: TEXT_MUTED, marginTop: 2 }}>
                            {match.home.abbrev} Wins
                          </ThemedText>
                        </View>
                        <View
                          style={{
                            flex: 1,
                            alignItems: 'center',
                            padding: 14,
                            borderRightWidth: 1,
                            borderRightColor: BORDER,
                          }}
                        >
                          <ThemedText style={{ fontSize: 22, fontWeight: '800', color: TEXT_MUTED }}>{d}</ThemedText>
                          <ThemedText style={{ fontSize: 12, color: TEXT_MUTED, marginTop: 2 }}>Draws</ThemedText>
                        </View>
                        <View style={{ flex: 1, alignItems: 'center', padding: 14 }}>
                          <ThemedText style={{ fontSize: 22, fontWeight: '800', color: LIVE_COLOR }}>{aw}</ThemedText>
                          <ThemedText style={{ fontSize: 12, color: TEXT_MUTED, marginTop: 2 }}>
                            {match.away.abbrev} Wins
                          </ThemedText>
                        </View>
                      </View>
                    </View>
                  );
                })()}

                <View style={styles.statsCard}>
                  <View style={[styles.statHeader, { paddingHorizontal: 16 }]}>
                    <ThemedText style={[styles.statHeaderTeam, { flex: 1 }]}>{match.home.abbrev}</ThemedText>
                    <ThemedText style={styles.statHeaderCenter}>Recent Meetings</ThemedText>
                    <ThemedText style={[styles.statHeaderTeam, { flex: 1, textAlign: 'right' }]}>
                      {match.away.abbrev}
                    </ThemedText>
                  </View>
                  {match.h2h.map((m, i) => {
                    const homeScore = Number(m.home.score);
                    const awayScore = Number(m.away.score);
                    const homeWon = homeScore > awayScore;
                    const awayWon = awayScore > homeScore;
                    const resultColor = homeWon ? '#4ADE80' : awayWon ? LIVE_COLOR : TEXT_SECONDARY;
                    const resultLabel = homeWon ? 'W' : awayWon ? 'L' : 'D';
                    return (
                      <View key={i} style={[styles.h2hRow, i > 0 && { borderTopWidth: 1, borderTopColor: BORDER }]}>
                        <View
                          style={{
                            width: 24,
                            height: 24,
                            borderRadius: 6,
                            backgroundColor: resultColor + '22',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <ThemedText style={{ fontSize: 11, fontWeight: '800', color: resultColor }}>
                            {resultLabel}
                          </ThemedText>
                        </View>
                        <ThemedText style={[styles.h2hScore, homeWon && styles.h2hWinner]}>{m.home.score}</ThemedText>
                        <View style={styles.h2hMid}>
                          <ThemedText style={styles.h2hDate}>{m.date}</ThemedText>
                          <ThemedText style={styles.h2hComp} numberOfLines={1}>
                            {m.competition}
                          </ThemedText>
                        </View>
                        <ThemedText style={[styles.h2hScore, awayWon && styles.h2hWinner]}>{m.away.score}</ThemedText>
                      </View>
                    );
                  })}
                </View>
              </>
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
  scoreText: { fontSize: 35, fontWeight: '800', color: TEXT, letterSpacing: 1, paddingTop: 10 },
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
