import React, { useEffect, useState, useCallback } from 'react';
import {
  View, ScrollView, StyleSheet, TouchableOpacity, Switch, Alert, Linking,
} from 'react-native';
import { Stack } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import {
  getRefreshInterval, setRefreshInterval, getHideSpoilers, setHideSpoilers,
  REFRESH_INTERVAL_LABELS, type RefreshInterval,
} from '@/utils/settings';
import { getFavorites } from '@/utils/favorites';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ACCENT = '#FF6B00';
const BG = '#000000';
const SURFACE = '#111111';
const BORDER = '#1E1E1E';
const TEXT = '#FFFFFF';
const TEXT_MUTED = '#666666';
const TEXT_SECONDARY = '#999999';
const DESTRUCTIVE = '#FF3B30';

const APP_VERSION = '1.0.0';
const INTERVALS: RefreshInterval[] = [5, 30, 60, 300, 0];

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const [refreshInterval, setRefreshIntervalState] = useState<RefreshInterval>(5);
  const [hideSpoilers, setHideSpoilersState] = useState(false);
  const [favCount, setFavCount] = useState(0);

  const load = useCallback(async () => {
    const [ri, hs, favs] = await Promise.all([
      getRefreshInterval(),
      getHideSpoilers(),
      getFavorites(),
    ]);
    setRefreshIntervalState(ri);
    setHideSpoilersState(hs);
    setFavCount(favs.length);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleIntervalChange = async (val: RefreshInterval) => {
    setRefreshIntervalState(val);
    await setRefreshInterval(val);
  };

  const handleHideSpoilersToggle = async (val: boolean) => {
    setHideSpoilersState(val);
    await setHideSpoilers(val);
  };

  const handleClearFavorites = () => {
    Alert.alert(
      'Clear Favorites',
      `Remove all ${favCount} saved matches?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.removeItem('@ovrtime_favorites');
            setFavCount(0);
          },
        },
      ]
    );
  };

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: 'Settings',
          headerStyle: { backgroundColor: BG },
          headerTintColor: TEXT,
          headerTitleStyle: { fontWeight: '700' },
          headerBackTitle: '',
          headerLargeTitle: true,
          headerLargeTitleStyle: { color: TEXT },
        }}
      />
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 80 }]}
        showsVerticalScrollIndicator={false}
      >

        {/* Scores */}
        <ThemedText style={styles.sectionLabel}>Scores</ThemedText>
        <View style={styles.group}>
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <ThemedText style={styles.rowLabel}>Hide Final Scores</ThemedText>
              <ThemedText style={styles.rowSub}>Blur results for finished matches</ThemedText>
            </View>
            <Switch
              value={hideSpoilers}
              onValueChange={handleHideSpoilersToggle}
              trackColor={{ false: '#333', true: ACCENT }}
              thumbColor="#FFF"
            />
          </View>
        </View>

        {/* Auto-Refresh */}
        <ThemedText style={styles.sectionLabel}>Live Auto-Refresh</ThemedText>
        <View style={styles.group}>
          {INTERVALS.map((interval, idx) => (
            <TouchableOpacity
              key={interval}
              style={[styles.row, idx < INTERVALS.length - 1 && styles.rowBorder]}
              onPress={() => handleIntervalChange(interval)}
              activeOpacity={0.7}
            >
              <ThemedText style={styles.rowLabel}>{REFRESH_INTERVAL_LABELS[interval]}</ThemedText>
              {refreshInterval === interval && (
                <SymbolView name="checkmark" tintColor={ACCENT} size={16} />
              )}
            </TouchableOpacity>
          ))}
        </View>
        <ThemedText style={styles.hint}>
          Live scores update automatically when matches are in progress. Higher frequency uses more battery.
        </ThemedText>

        {/* Favorites */}
        <ThemedText style={styles.sectionLabel}>Favorites</ThemedText>
        <View style={styles.group}>
          <TouchableOpacity
            style={styles.row}
            onPress={handleClearFavorites}
            disabled={favCount === 0}
            activeOpacity={0.7}
          >
            <ThemedText style={[styles.rowLabel, { color: favCount === 0 ? TEXT_MUTED : DESTRUCTIVE }]}>
              Clear All Favorites
            </ThemedText>
            <ThemedText style={styles.rowSub}>{favCount} saved</ThemedText>
          </TouchableOpacity>
        </View>

        {/* About */}
        <ThemedText style={styles.sectionLabel}>About</ThemedText>
        <View style={styles.group}>
          <View style={[styles.row, styles.rowBorder]}>
            <ThemedText style={styles.rowLabel}>Version</ThemedText>
            <ThemedText style={styles.rowSub}>{APP_VERSION}</ThemedText>
          </View>
          <TouchableOpacity
            style={[styles.row, styles.rowBorder]}
            onPress={() => Linking.openURL('https://www.espn.com')}
            activeOpacity={0.7}
          >
            <ThemedText style={styles.rowLabel}>Data Provider</ThemedText>
            <ThemedText style={[styles.rowSub, { color: ACCENT }]}>ESPN ↗</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.row}
            onPress={() => Linking.openURL('mailto:feedback@ovrtime.app')}
            activeOpacity={0.7}
          >
            <ThemedText style={styles.rowLabel}>Send Feedback</ThemedText>
            <SymbolView name="chevron.right" tintColor={TEXT_MUTED} size={14} />
          </TouchableOpacity>
        </View>

      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  scroll: { paddingTop: 8 },
  sectionLabel: {
    fontSize: 12, fontWeight: '600', color: TEXT_SECONDARY,
    textTransform: 'uppercase', letterSpacing: 0.5,
    paddingHorizontal: 16, paddingTop: 20, paddingBottom: 6,
  },
  group: {
    marginHorizontal: 16, backgroundColor: SURFACE,
    borderRadius: 10, borderWidth: 1, borderColor: BORDER, overflow: 'hidden',
  },
  row: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14, gap: 12,
  },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: BORDER },
  rowLeft: { flex: 1 },
  rowLabel: { fontSize: 15, fontWeight: '500', color: TEXT },
  rowSub: { fontSize: 12, color: TEXT_MUTED, marginTop: 2 },
  hint: {
    fontSize: 12, color: TEXT_MUTED, paddingHorizontal: 20,
    paddingTop: 8, lineHeight: 18,
  },
});
