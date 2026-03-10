import AsyncStorage from '@react-native-async-storage/async-storage';

const FAVORITES_KEY = '@ovrtime_favorites';

export type FavoriteMatch = {
  id: string;
  homeTeam: string;
  homeAbbrev: string;
  homeLogo: string | null;
  homeColor: string;
  awayTeam: string;
  awayAbbrev: string;
  awayLogo: string | null;
  awayColor: string;
  league: string;
  leagueLogo: string | null;
  date: string; // ISO string
};

type Listener = () => void;
const listeners = new Set<Listener>();

export const favoritesEmitter = {
  subscribe: (fn: Listener) => {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
  emit: () => {
    listeners.forEach((fn) => fn());
  },
};

export async function getFavorites(): Promise<FavoriteMatch[]> {
  try {
    const raw = await AsyncStorage.getItem(FAVORITES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function isFavorite(matchId: string): Promise<boolean> {
  const favs = await getFavorites();
  return favs.some((f) => f.id === matchId);
}

export async function addFavorite(match: FavoriteMatch): Promise<void> {
  const favs = await getFavorites();
  if (!favs.some((f) => f.id === match.id)) {
    await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify([...favs, match]));
    favoritesEmitter.emit();
  }
}

export async function removeFavorite(matchId: string): Promise<void> {
  const favs = await getFavorites();
  const updated = favs.filter((f) => f.id !== matchId);
  await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
  favoritesEmitter.emit();
}

export async function toggleFavorite(match: FavoriteMatch): Promise<boolean> {
  const fav = await isFavorite(match.id);
  if (fav) {
    await removeFavorite(match.id);
    return false;
  } else {
    await addFavorite(match);
    return true;
  }
}
