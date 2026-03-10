import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  AUTO_REFRESH_INTERVAL: '@ovrtime_auto_refresh_interval',
  HIDE_SPOILERS: '@ovrtime_hide_spoilers',
} as const;

export type RefreshInterval = 5 | 30 | 60 | 300 | 0; // seconds; 0 = off

export const REFRESH_INTERVAL_LABELS: Record<RefreshInterval, string> = {
  5: '5 seconds',
  30: '30 seconds',
  60: '1 minute',
  300: '5 minutes',
  0: 'Off',
};

type SettingsListener = () => void;
const listeners = new Set<SettingsListener>();

export const settingsEmitter = {
  subscribe: (fn: SettingsListener) => {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
  emit: () => {
    listeners.forEach((fn) => fn());
  },
};

/**
 * Auto-refresh interval in seconds (5, 30, 60, 300, 0=off).
 * Default: 5
 */
export async function getRefreshInterval(): Promise<RefreshInterval> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.AUTO_REFRESH_INTERVAL);
    if (raw !== null) {
      const num = Number(raw) as RefreshInterval;
      if ([5, 30, 60, 300, 0].includes(num)) return num;
    }
  } catch {}
  return 5;
}

export async function setRefreshInterval(interval: RefreshInterval): Promise<void> {
  await AsyncStorage.setItem(KEYS.AUTO_REFRESH_INTERVAL, String(interval));
  settingsEmitter.emit();
}

/**
 * Hide scores for finished matches.
 * Default: false
 */
export async function getHideSpoilers(): Promise<boolean> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.HIDE_SPOILERS);
    return raw === 'true';
  } catch {
    return false;
  }
}

export async function setHideSpoilers(value: boolean): Promise<void> {
  await AsyncStorage.setItem(KEYS.HIDE_SPOILERS, String(value));
  settingsEmitter.emit();
}
