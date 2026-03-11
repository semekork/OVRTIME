import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Icon } from '@/components/icon';
import { ScrollView, StyleSheet, TouchableOpacity, View, ActivityIndicator, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter } from 'expo-router';
import Animated, { SharedTransition } from 'react-native-reanimated';
import { toggleFavorite, type FavoriteMatch } from '@/utils/favorites';
import { HOME_FETCH_LEAGUES, getLeagueById } from '@/utils/leagues';
import { getRefreshInterval, getHideSpoilers, settingsEmitter } from '@/utils/settings';
import { useInterval } from '@/hooks/use-interval';
import { hasActiveActivity } from '@/utils/liveActivity';
import { C } from '@/constants/theme';

const springTransition = SharedTransition.springify().damping(20).stiffness(200);

const ACCENT = C.accent;
const BG = C.bg;
const SURFACE = C.surface;
const BORDER = C.border;
const TEXT = C.text;
const TEXT_MUTED = C.textMuted;
const LIVE_COLOR = C.live;

const toLocalQueryDate = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}${m}${dd}`;
};

const generateDates = () => {
  const dates = [];
  const today = new Date();
  for (let i = -2; i <= 4; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    dates.push({
      dateObj: d,
      day: d.toLocaleDateString('en-US', { weekday: 'short' }),
      date: d.getDate().toString(),
      isToday: i === 0,
      queryDate: toLocalQueryDate(d),
    });
  }
  return dates;
};

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [dates] = useState(generateDates);
  const [selectedDateIndex, setSelectedDateIndex] = useState(2);
  const [events, setEvents] = useState<any[]>([]);
  const [leagues, setLeagues] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [hideSpoilers, setHideSpoilersState] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [refreshInterval, setRefreshIntervalState] = useState<number>(5000);

  const selectedDate = dates[selectedDateIndex];

  // Load persisted settings
  useEffect(() => {
    const loadSettings = async () => {
      const [ri, hs] = await Promise.all([getRefreshInterval(), getHideSpoilers()]);
      setRefreshIntervalState(ri === 0 ? 0 : ri * 1000);
      setHideSpoilersState(hs);
    };
    loadSettings();
    const unsub = settingsEmitter.subscribe(() => {
      loadSettings();
    });
    return () => {
      unsub();
    };
  }, []);

  const fetchMatches = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      try {
        const fetchPromises = HOME_FETCH_LEAGUES.map((leagueId) =>
          fetch(
            `https://site.api.espn.com/apis/site/v2/sports/soccer/${leagueId}/scoreboard?dates=${selectedDate.queryDate}`,
          )
            .then((res) => res.json())
            .catch(() => null),
        );

        const results = await Promise.all(fetchPromises);
        let allEvents: any[] = [];
        let activeLeagues: any[] = [];

        results.forEach((res, idx) => {
          if (res && res.events && res.events.length > 0) {
            const leagueData = res.leagues?.[0] || null;
            const leagueId = HOME_FETCH_LEAGUES[idx];
            const leagueInfo = getLeagueById(leagueId);

            if (leagueData && !activeLeagues.some((l) => l.id === leagueId)) {
              activeLeagues.push({
                id: leagueId,
                name: leagueInfo?.name || leagueData.name,
                logo: leagueInfo?.logo || leagueData.logos?.[0]?.href || null,
                country: leagueInfo?.country || '',
              });
            }

            // Strip any leading '#' so color is always a bare hex string
            const normaliseColor = (c?: string) => {
              if (!c) return 'FFFFFF';
              return c.startsWith('#') ? c.slice(1) : c;
            };

            const parsedEvents = res.events.map((evt: any) => {
              const homeComp =
                evt.competitions[0].competitors.find((c: any) => c.homeAway === 'home') ||
                evt.competitions[0].competitors[0];
              const awayComp =
                evt.competitions[0].competitors.find((c: any) => c.homeAway === 'away') ||
                evt.competitions[0].competitors[1];
              // ESPN scoreboard uses team.logo; fall back to logos[0].href if needed
              const homeLogo = homeComp?.team?.logos?.[0]?.href || homeComp?.team?.logo || null;
              const awayLogo = awayComp?.team?.logos?.[0]?.href || awayComp?.team?.logo || null;
              return {
                id: evt.id,
                name: evt.name,
                date: new Date(evt.date),
                status: evt.status.type,
                clock: evt.status.displayClock,
                period: evt.status.period,
                leagueId,
                home: {
                  team: homeComp?.team?.displayName || homeComp?.team?.name || 'TBD',
                  abbrev: homeComp?.team?.abbreviation || 'TBD',
                  score: homeComp?.score || '0',
                  logo: homeLogo,
                  color: normaliseColor(homeComp?.team?.color),
                },
                away: {
                  team: awayComp?.team?.displayName || awayComp?.team?.name || 'TBD',
                  abbrev: awayComp?.team?.abbreviation || 'TBD',
                  score: awayComp?.score || '0',
                  logo: awayLogo,
                  color: normaliseColor(awayComp?.team?.color),
                },
                league: leagueInfo?.name || leagueData?.name || 'Unknown',
                leagueLogo: leagueInfo?.logo || leagueData?.logos?.[0]?.href || null,
              };
            });
            allEvents = [...allEvents, ...parsedEvents];
          }
        });

        allEvents.sort((a, b) => {
          const order: Record<string, number> = { in: 0, pre: 1, post: 2 };
          const aO = order[a.status.state] ?? 3;
          const bO = order[b.status.state] ?? 3;
          if (aO !== bO) return aO - bO;
          return a.date.getTime() - b.date.getTime();
        });
        setEvents(allEvents);
        setLeagues(activeLeagues);
      } catch (e) {
        console.error(e);
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [selectedDate],
  );

  useEffect(() => {
    fetchMatches(false);
  }, [fetchMatches]);

  // Auto-poll: every 5s (or user-configured interval) when there are live matches
  const hasLive = events.some((e) => e.status.state === 'in');
  useInterval(
    () => {
      fetchMatches(true);
    },
    hasLive && refreshInterval > 0 ? refreshInterval : null,
  );

  const liveMatch = useMemo(() => {
    if (events.length === 0) return null;
    const inProgress = events.find((e) => e.status.state === 'in');
    if (inProgress) return inProgress;
    const preGame = events.find((e) => e.status.state === 'pre');
    if (preGame) return preGame;
    return events[0];
  }, [events]);

  const topEvents = useMemo(() => {
    if (!liveMatch) return events.slice(0, 12);
    return events.filter((e) => e.id !== liveMatch.id).slice(0, 12);
  }, [events, liveMatch]);

  const handleToggleFavorite = useCallback(async (evt: any) => {
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
      league: evt.league,
      leagueLogo: evt.leagueLogo,
      leagueId: evt.leagueId,
      date: evt.date.toISOString(),
    };
    const nowFav = await toggleFavorite(match);
    setFavoriteIds((prev) => {
      const next = new Set(prev);
      if (nowFav) next.add(evt.id);
      else next.delete(evt.id);
      return next;
    });
  }, []);

  const goToMatch = (evt: any) => {
    router.push(`/match/${evt.id}?leagueId=${evt.leagueId}`);
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <View style={styles.headerLeft}>
            <ThemedText style={styles.logoText}>OVRTIME</ThemedText>
          </View>
          <View style={styles.headerRight}>
            {Platform.OS === 'ios' ? (
              (() => {
                // eslint-disable-next-line @typescript-eslint/no-var-requires
                const { Button: Btn, Host: H, Menu: M } = require('@expo/ui/swift-ui');
                return (
                  <H matchContents>
                    <M
                      label={
                        <View style={styles.iconButton}>
                          <Icon sf="ellipsis" material="more-horiz" size={20} color="#FFFFFF" />
                        </View>
                      }
                    >
                      <Btn
                        label={hideSpoilers ? 'Show Scores' : 'Hide Scores'}
                        onPress={() => setHideSpoilersState((v) => !v)}
                      />
                      <Btn label="Settings" onPress={() => router.push('/settings')} />
                    </M>
                  </H>
                );
              })()
            ) : (
              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => {
                  const { Alert: RNAlert } = require('react-native');
                  RNAlert.alert('Menu', undefined, [
                    {
                      text: hideSpoilers ? 'Show Scores' : 'Hide Scores',
                      onPress: () => setHideSpoilersState((v) => !v),
                    },
                    { text: 'Settings', onPress: () => router.push('/settings') },
                    { text: 'Cancel', style: 'cancel' },
                  ]);
                }}
              >
                <Icon sf="ellipsis" material="more-horiz" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Date Selector */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.datesContainer}>
          {dates.map((item, index) => {
            const isActive = index === selectedDateIndex;
            return (
              <TouchableOpacity
                key={item.queryDate}
                style={[styles.dateItem, isActive && styles.dateItemActive]}
                onPress={() => setSelectedDateIndex(index)}
              >
                <ThemedText style={[styles.dateText, isActive && styles.dateTextActive]}>{item.date}</ThemedText>
                <ThemedText style={[styles.dayText, isActive && styles.dayTextActive]}>{item.day}</ThemedText>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {loading ? (
          <ActivityIndicator style={{ marginTop: 40 }} color={ACCENT} />
        ) : (
          <>
            {/* Featured Match */}
            {liveMatch && (
              <>
                <View style={styles.sectionHeader}>
                  <ThemedText style={styles.sectionTitle}>
                    {liveMatch.status.state === 'in' ? 'Live Now' : 'Featured Match'}
                  </ThemedText>
                  <TouchableOpacity onPress={() => goToMatch(liveMatch)}>
                    <ThemedText style={styles.seeAll}>Details</ThemedText>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.liveCard} activeOpacity={0.85} onPress={() => goToMatch(liveMatch)}>
                  <View style={styles.liveBadgeContainer}>
                    <View
                      style={[
                        styles.liveBadge,
                        liveMatch.status.state !== 'in' && {
                          backgroundColor: '#1A1A1A',
                          borderColor: '#333',
                        },
                      ]}
                    >
                      {liveMatch.status.state === 'in' && <View style={styles.liveDot} />}
                      <ThemedText style={[styles.liveBadgeText, liveMatch.status.state !== 'in' && { color: '#888' }]}>
                        {liveMatch.status.state === 'in' ? 'Live' : liveMatch.status.shortDetail} — {liveMatch.league}
                      </ThemedText>
                    </View>
                  </View>

                  <View style={styles.matchContent}>
                    <View style={styles.team}>
                      <Animated.View
                        sharedTransitionTag={`match-home-logo-${liveMatch.id}`}
                        sharedTransitionStyle={springTransition}
                        style={[styles.logoPlaceholder, { borderColor: `#${liveMatch.home.color}` }]}
                      >
                        {liveMatch.home.logo ? (
                          <Image
                            source={{ uri: liveMatch.home.logo }}
                            style={{ width: 48, height: 48 }}
                            contentFit="contain"
                          />
                        ) : (
                          <ThemedText style={styles.logoTextChar}>{liveMatch.home.abbrev.charAt(0)}</ThemedText>
                        )}
                      </Animated.View>
                      <ThemedText style={styles.teamName}>{liveMatch.home.abbrev}</ThemedText>
                    </View>

                    <View style={styles.scoreContainer}>
                      <ThemedText style={styles.scoreText}>
                        {liveMatch.status.state === 'pre'
                          ? '–'
                          : hideSpoilers && liveMatch.status.state === 'post'
                            ? '? — ?'
                            : `${liveMatch.home.score} — ${liveMatch.away.score}`}
                      </ThemedText>
                    </View>

                    <View style={styles.team}>
                      <Animated.View
                        sharedTransitionTag={`match-away-logo-${liveMatch.id}`}
                        sharedTransitionStyle={springTransition}
                        style={[styles.logoPlaceholder, { borderColor: `#${liveMatch.away.color}` }]}
                      >
                        {liveMatch.away.logo ? (
                          <Image
                            source={{ uri: liveMatch.away.logo }}
                            style={{ width: 48, height: 48 }}
                            contentFit="contain"
                          />
                        ) : (
                          <ThemedText style={styles.logoTextChar}>{liveMatch.away.abbrev.charAt(0)}</ThemedText>
                        )}
                      </Animated.View>
                      <ThemedText style={styles.teamName}>{liveMatch.away.abbrev}</ThemedText>
                    </View>
                  </View>

                  <View style={styles.matchFooter}>
                    <View style={styles.matchFooterRow}>
                      <ThemedText
                        style={[styles.matchFooterText, liveMatch.status.state === 'in' && { color: LIVE_COLOR }]}
                      >
                        {liveMatch.status.state === 'in'
                          ? `${liveMatch.status.shortDetail}' · ${liveMatch.clock}`
                          : liveMatch.status.detail}
                      </ThemedText>
                      <View style={styles.matchFooterRight}>
                        {Platform.OS === 'ios' &&
                          liveMatch.status.state === 'in' &&
                          hasActiveActivity(liveMatch.id) && (
                            <View style={styles.laIndicator}>
                              <Icon sf="livephoto" material="live-tv" size={10} color={ACCENT} />
                              <ThemedText style={styles.laIndicatorText}>Live</ThemedText>
                            </View>
                          )}
                        <TouchableOpacity
                          onPress={(e) => {
                            e.stopPropagation?.();
                            handleToggleFavorite(liveMatch);
                          }}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <Icon
                            sf={favoriteIds.has(liveMatch.id) ? 'star.fill' : 'star'}
                            material={favoriteIds.has(liveMatch.id) ? 'star' : 'star-border'}
                            color={favoriteIds.has(liveMatch.id) ? ACCENT : TEXT_MUTED}
                            size={18}
                          />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              </>
            )}

            {/* Top Events — horizontal scroll */}
            {topEvents.length > 0 && (
              <>
                <View style={styles.sectionHeader}>
                  <ThemedText style={styles.sectionTitle}>Top Matches</ThemedText>
                </View>

                <ScrollView
                  horizontal
                  contentInsetAdjustmentBehavior="automatic"
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.eventsContainer}
                >
                  {topEvents.map((evt) => (
                    <TouchableOpacity
                      key={evt.id}
                      style={styles.eventCard}
                      activeOpacity={0.8}
                      onPress={() => goToMatch(evt)}
                    >
                      <View style={styles.eventHeader}>
                        <ThemedText style={styles.eventDate}>
                          {evt.date.toLocaleDateString('en-US', {
                            weekday: 'short',
                            day: 'numeric',
                            month: 'short',
                          })}
                        </ThemedText>
                        <ThemedText style={[styles.eventTime, evt.status.state === 'in' && { color: LIVE_COLOR }]}>
                          {evt.status.state === 'pre'
                            ? evt.date.toLocaleTimeString('en-US', {
                                hour: 'numeric',
                                minute: '2-digit',
                              })
                            : evt.status.state === 'in'
                              ? `${evt.clock}'`
                              : evt.status.shortDetail}
                        </ThemedText>
                      </View>
                      <View style={styles.eventTeams}>
                        <View style={styles.eventTeamRow}>
                          <Animated.View
                            sharedTransitionTag={`match-home-logo-${evt.id}`}
                            sharedTransitionStyle={springTransition}
                            style={[styles.smallLogo, { overflow: 'hidden' }]}
                          >
                            {evt.home.logo && (
                              <Image
                                source={{ uri: evt.home.logo }}
                                style={{ width: '100%', height: '100%' }}
                                contentFit="contain"
                              />
                            )}
                          </Animated.View>
                          <ThemedText style={styles.eventTeamName}>{evt.home.abbrev}</ThemedText>
                          {evt.status.state !== 'pre' && (
                            <ThemedText style={{ marginLeft: 'auto', fontWeight: '800', color: TEXT }}>
                              {hideSpoilers && evt.status.state === 'post' ? '?' : evt.home.score}
                            </ThemedText>
                          )}
                        </View>
                        <View style={styles.eventTeamRow}>
                          <Animated.View
                            sharedTransitionTag={`match-away-logo-${evt.id}`}
                            sharedTransitionStyle={springTransition}
                            style={[styles.smallLogo, { overflow: 'hidden' }]}
                          >
                            {evt.away.logo && (
                              <Image
                                source={{ uri: evt.away.logo }}
                                style={{ width: '100%', height: '100%' }}
                                contentFit="contain"
                              />
                            )}
                          </Animated.View>
                          <ThemedText style={styles.eventTeamName}>{evt.away.abbrev}</ThemedText>
                          {evt.status.state !== 'pre' && (
                            <ThemedText style={{ marginLeft: 'auto', fontWeight: '800', color: TEXT }}>
                              {hideSpoilers && evt.status.state === 'post' ? '?' : evt.away.score}
                            </ThemedText>
                          )}
                        </View>
                      </View>
                      <View style={styles.eventCardFooter}>
                        <ThemedText style={styles.eventLeague} numberOfLines={1}>
                          {evt.league}
                        </ThemedText>
                        <TouchableOpacity
                          onPress={() => handleToggleFavorite(evt)}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <Icon
                            sf={favoriteIds.has(evt.id) ? 'star.fill' : 'star'}
                            material={favoriteIds.has(evt.id) ? 'star' : 'star-border'}
                            color={favoriteIds.has(evt.id) ? ACCENT : TEXT_MUTED}
                            size={14}
                          />
                        </TouchableOpacity>
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </>
            )}

            {/* Leagues */}
            <View style={styles.sectionHeader}>
              <ThemedText style={styles.sectionTitle}>Leagues</ThemedText>
            </View>

            <View style={styles.leaguesContainer}>
              {leagues.length > 0 ? (
                leagues.map((league) => (
                  <TouchableOpacity
                    key={league.id}
                    style={styles.leagueRow}
                    activeOpacity={0.75}
                    onPress={() => router.push(`/league/${league.id}`)}
                  >
                    <View style={styles.leagueRowLeft}>
                      <Animated.View
                        sharedTransitionTag={`league-logo-${league.id}`}
                        sharedTransitionStyle={springTransition}
                        style={styles.leagueIcon}
                      >
                        {league.logo && (
                          <Image source={{ uri: league.logo }} style={{ width: 28, height: 28 }} contentFit="contain" />
                        )}
                      </Animated.View>
                      <View>
                        <ThemedText style={styles.leagueName}>{league.name}</ThemedText>
                        {league.country ? <ThemedText style={styles.leagueCountry}>{league.country}</ThemedText> : null}
                      </View>
                    </View>
                    <Icon sf="chevron.right" material="chevron-right" size={14} color="#555" />
                  </TouchableOpacity>
                ))
              ) : (
                <View style={styles.emptyLeagues}>
                  <ThemedText style={{ color: TEXT_MUTED, textAlign: 'center' }}>
                    No active leagues for this date.
                  </ThemedText>
                </View>
              )}
            </View>
          </>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  scrollContent: { paddingBottom: 40 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoText: { fontSize: 22, fontWeight: '800', color: ACCENT, letterSpacing: -0.5 },
  livePulse: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#1A0000',
    borderWidth: 1,
    borderColor: '#3A0000',
    borderRadius: 5,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  livePulseDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: LIVE_COLOR },
  livePulseText: { fontSize: 10, fontWeight: '800', color: LIVE_COLOR, letterSpacing: 0.5 },
  headerRight: { flexDirection: 'row', gap: 12 },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: 'center',
    justifyContent: 'center',
  },
  datesContainer: { paddingHorizontal: 16, paddingVertical: 16, gap: 8 },
  dateItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: 'center',
    gap: 4,
  },
  dateItemActive: { backgroundColor: ACCENT, borderColor: ACCENT },
  dateText: { fontSize: 18, fontWeight: '700', color: TEXT },
  dateTextActive: { color: '#000' },
  dayText: { fontSize: 12, color: TEXT_MUTED, fontWeight: '500' },
  dayTextActive: { color: '#000' },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    marginTop: 24,
    marginBottom: 14,
  },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: TEXT },
  seeAll: { fontSize: 14, color: TEXT_MUTED, fontWeight: '500' },
  liveCard: {
    marginHorizontal: 16,
    backgroundColor: SURFACE,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 16,
  },
  liveBadgeContainer: { alignItems: 'center', marginBottom: 20 },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#33150A',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#4A1C0A',
  },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: ACCENT },
  liveBadgeText: { fontSize: 12, fontWeight: '600', color: ACCENT },
  matchContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  team: { alignItems: 'center', gap: 12, flex: 1 },
  logoPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0A0A0A',
  },
  logoTextChar: { fontSize: 24, fontWeight: '700', color: TEXT, lineHeight: 28 },
  teamName: { fontSize: 14, fontWeight: '600', color: TEXT },
  scoreContainer: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
  scoreText: { fontSize: 32, fontWeight: '800', color: TEXT, letterSpacing: 2, lineHeight: 36 },
  matchFooter: { marginTop: 24, alignItems: 'center' },
  matchFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    width: '100%',
    justifyContent: 'space-between',
  },
  matchFooterRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  matchFooterText: { fontSize: 13, color: ACCENT, fontWeight: '600' },
  laIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#1A0A00',
    borderWidth: 1,
    borderColor: '#3A1500',
    borderRadius: 5,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  laIndicatorText: { fontSize: 10, fontWeight: '700', color: ACCENT },
  eventsContainer: { paddingHorizontal: 16, gap: 12 },
  eventCard: {
    width: 240,
    backgroundColor: SURFACE,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 16,
  },
  eventHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  eventDate: { fontSize: 12, color: TEXT_MUTED, fontWeight: '500' },
  eventTime: { fontSize: 12, color: TEXT, fontWeight: '600' },
  eventTeams: { gap: 12, marginBottom: 16 },
  eventTeamRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  smallLogo: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#0A0A0A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  eventTeamName: { fontSize: 14, fontWeight: '600', color: TEXT },
  eventCardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  eventLeague: { fontSize: 12, color: TEXT_MUTED, flex: 1 },
  leaguesContainer: { paddingHorizontal: 16, gap: 8, marginBottom: 8 },
  leagueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: SURFACE,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 12,
  },
  leagueRowLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  leagueIcon: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  leagueName: { fontSize: 15, fontWeight: '600', color: TEXT },
  leagueCountry: { fontSize: 11, color: TEXT_MUTED, marginTop: 1 },
  emptyLeagues: { paddingVertical: 20, alignItems: 'center' },
});