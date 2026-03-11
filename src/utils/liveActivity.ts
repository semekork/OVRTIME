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

export async function startMatchActivity(matchId: string, props: MatchActivityProps): Promise<void> {
  if (Platform.OS !== 'ios') return;
  try {
    // End any existing activity for this match first
    if (hasActiveActivity(matchId)) {
      await endMatchActivity(matchId);
    }
    const instance = await MatchActivity.start(props);
    activeActivities.set(matchId, instance);
  } catch (e) {
    console.warn('[LiveActivity] startMatchActivity error:', e);
  }
}

export async function updateMatchActivity(matchId: string, props: Partial<MatchActivityProps>): Promise<void> {
  if (Platform.OS !== 'ios') return;
  const instance = activeActivities.get(matchId);
  if (!instance) return;
  try {
    await instance.update(props as MatchActivityProps);
  } catch (e) {
    console.warn('[LiveActivity] updateMatchActivity error:', e);
  }
}

export async function endMatchActivity(matchId: string): Promise<void> {
  if (Platform.OS !== 'ios') return;
  const instance = activeActivities.get(matchId);
  if (!instance) return;
  try {
    await instance.end('immediate');
  } catch (e) {
    console.warn('[LiveActivity] endMatchActivity error:', e);
  } finally {
    // Always clean up the reference, even if end() threw
    activeActivities.delete(matchId);
  }
}

export async function endAllMatchActivities(): Promise<void> {
  if (Platform.OS !== 'ios') return;
  const ids = Array.from(activeActivities.keys());
  await Promise.allSettled(ids.map((id) => endMatchActivity(id)));
}

export function hasActiveActivity(matchId: string): boolean {
  return activeActivities.has(matchId);
}

export function activeActivityCount(): number {
  return activeActivities.size;
}
