/**
 * Live Activity bridge
 *
 * Provides start / update / end helpers for the MatchActivity Live Activity.
 * Uses expo-widgets' createLiveActivity / LiveActivity API.
 *
 * iOS only — on other platforms these are no-ops.
 */
import { Platform } from 'react-native';
import MatchActivity, { type MatchActivityProps } from '../widgets/MatchActivity';
import { type LiveActivity } from 'expo-widgets';

// Active instance map (one activity per match ID)
const activeActivities = new Map<string, LiveActivity<MatchActivityProps>>();

export async function startMatchActivity(
  matchId: string,
  props: MatchActivityProps
): Promise<void> {
  if (Platform.OS !== 'ios') return;
  try {
    // End any existing activity for this match first
    await endMatchActivity(matchId);
    const instance = await MatchActivity.start(props);
    activeActivities.set(matchId, instance);
  } catch (e) {
    console.warn('startMatchActivity error:', e);
  }
}

export async function updateMatchActivity(
  matchId: string,
  props: Partial<MatchActivityProps>
): Promise<void> {
  if (Platform.OS !== 'ios') return;
  const instance = activeActivities.get(matchId);
  if (!instance) return;
  try {
    await instance.update(props as MatchActivityProps);
  } catch (e) {
    console.warn('updateMatchActivity error:', e);
  }
}

export async function endMatchActivity(matchId: string): Promise<void> {
  if (Platform.OS !== 'ios') return;
  const instance = activeActivities.get(matchId);
  if (!instance) return;
  try {
    await instance.end('immediate');
    activeActivities.delete(matchId);
  } catch (e) {
    console.warn('endMatchActivity error:', e);
  }
}

export function hasActiveActivity(matchId: string): boolean {
  return activeActivities.has(matchId);
}
