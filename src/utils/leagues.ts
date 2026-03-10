export type League = {
  id: string;
  name: string;
  shortName: string;
  country: string;
  continent: string;
  logo: string | null;
  featured: boolean;
};

export const LEAGUES: League[] = [
  // Featured European Top 5
  { id: 'eng.1', name: 'Premier League', shortName: 'PL', country: 'England', continent: 'Europe', logo: 'https://a.espncdn.com/i/leaguelogos/soccer/500/23.png', featured: true },
  { id: 'esp.1', name: 'La Liga', shortName: 'LaLiga', country: 'Spain', continent: 'Europe', logo: 'https://a.espncdn.com/i/leaguelogos/soccer/500/15.png', featured: true },
  { id: 'ger.1', name: 'Bundesliga', shortName: 'BUN', country: 'Germany', continent: 'Europe', logo: 'https://a.espncdn.com/i/leaguelogos/soccer/500/10.png', featured: true },
  { id: 'ita.1', name: 'Serie A', shortName: 'SA', country: 'Italy', continent: 'Europe', logo: 'https://a.espncdn.com/i/leaguelogos/soccer/500/12.png', featured: true },
  { id: 'fra.1', name: 'Ligue 1', shortName: 'L1', country: 'France', continent: 'Europe', logo: 'https://a.espncdn.com/i/leaguelogos/soccer/500/9.png', featured: true },

  // European Elite Competitions
  { id: 'uefa.champions', name: 'Champions League', shortName: 'UCL', country: 'Europe', continent: 'Europe', logo: 'https://a.espncdn.com/i/leaguelogos/soccer/500/2.png', featured: true },
  { id: 'uefa.europa', name: 'Europa League', shortName: 'UEL', country: 'Europe', continent: 'Europe', logo: 'https://a.espncdn.com/i/leaguelogos/soccer/500/2572.png', featured: true },
  { id: 'uefa.conference', name: 'Conference League', shortName: 'UECL', country: 'Europe', continent: 'Europe', logo: 'https://a.espncdn.com/i/leaguelogos/soccer/500/10759.png', featured: false },
  { id: 'uefa.nations', name: 'UEFA Nations League', shortName: 'UNL', country: 'Europe', continent: 'Europe', logo: null, featured: false },
  { id: 'uefa.euro', name: 'European Championship', shortName: 'EURO', country: 'Europe', continent: 'Europe', logo: null, featured: false },

  // More Europe
  { id: 'por.1', name: 'Primeira Liga', shortName: 'PPL', country: 'Portugal', continent: 'Europe', logo: 'https://a.espncdn.com/i/leaguelogos/soccer/500/19.png', featured: false },
  { id: 'ned.1', name: 'Eredivisie', shortName: 'ERD', country: 'Netherlands', continent: 'Europe', logo: 'https://a.espncdn.com/i/leaguelogos/soccer/500/11.png', featured: false },
  { id: 'bel.1', name: 'First Division A', shortName: 'BEPD', country: 'Belgium', continent: 'Europe', logo: null, featured: false },
  { id: 'sco.1', name: 'Scottish Premiership', shortName: 'SPFL', country: 'Scotland', continent: 'Europe', logo: null, featured: false },
  { id: 'tur.1', name: 'Süper Lig', shortName: 'SL', country: 'Turkey', continent: 'Europe', logo: null, featured: false },
  { id: 'gre.1', name: 'Super League Greece', shortName: 'SLG', country: 'Greece', continent: 'Europe', logo: null, featured: false },
  { id: 'rus.1', name: 'Russian Premier League', shortName: 'RPL', country: 'Russia', continent: 'Europe', logo: null, featured: false },
  { id: 'aut.1', name: 'Bundesliga Austria', shortName: 'ABL', country: 'Austria', continent: 'Europe', logo: null, featured: false },
  { id: 'cze.1', name: 'Czech First League', shortName: 'CFL', country: 'Czech Republic', continent: 'Europe', logo: null, featured: false },
  { id: 'hrv.1', name: 'HNL', shortName: 'HNL', country: 'Croatia', continent: 'Europe', logo: null, featured: false },
  { id: 'ukr.1', name: 'Ukrainian Premier League', shortName: 'UPL', country: 'Ukraine', continent: 'Europe', logo: null, featured: false },
  { id: 'den.1', name: 'Superliga', shortName: 'DSU', country: 'Denmark', continent: 'Europe', logo: null, featured: false },
  { id: 'swe.1', name: 'Allsvenskan', shortName: 'SWE', country: 'Sweden', continent: 'Europe', logo: null, featured: false },
  { id: 'nor.1', name: 'Eliteserien', shortName: 'NOR', country: 'Norway', continent: 'Europe', logo: null, featured: false },

  // Americas
  { id: 'usa.1', name: 'MLS', shortName: 'MLS', country: 'USA', continent: 'America', logo: 'https://a.espncdn.com/i/leaguelogos/soccer/500/19.png', featured: true },
  { id: 'mex.1', name: 'Liga MX', shortName: 'LMX', country: 'Mexico', continent: 'America', logo: 'https://a.espncdn.com/i/leaguelogos/soccer/500/26.png', featured: true },
  { id: 'bra.1', name: 'Brasileirão Série A', shortName: 'BSA', country: 'Brazil', continent: 'America', logo: 'https://a.espncdn.com/i/leaguelogos/soccer/500/33.png', featured: true },
  { id: 'arg.1', name: 'Liga Profesional', shortName: 'LPF', country: 'Argentina', continent: 'America', logo: 'https://a.espncdn.com/i/leaguelogos/soccer/500/7.png', featured: false },
  { id: 'col.1', name: 'Categoría Primera A', shortName: 'COL', country: 'Colombia', continent: 'America', logo: null, featured: false },
  { id: 'chl.1', name: 'Primera División', shortName: 'CHL', country: 'Chile', continent: 'America', logo: null, featured: false },
  { id: 'ecu.1', name: 'LigaPro Serie A', shortName: 'ECU', country: 'Ecuador', continent: 'America', logo: null, featured: false },
  { id: 'per.1', name: 'Liga 1', shortName: 'PER', country: 'Peru', continent: 'America', logo: null, featured: false },
  { id: 'conmebol.libertadores', name: 'Copa Libertadores', shortName: 'LPIB', country: 'South America', continent: 'America', logo: null, featured: false },
  { id: 'conmebol.sudamericana', name: 'Copa Sudamericana', shortName: 'SUD', country: 'South America', continent: 'America', logo: null, featured: false },

  // Asia & Middle East
  { id: 'sau.1', name: 'Saudi Pro League', shortName: 'SPL', country: 'Saudi Arabia', continent: 'Asia', logo: null, featured: false },
  { id: 'uae.1', name: 'UAE Pro League', shortName: 'UAE', country: 'UAE', continent: 'Asia', logo: null, featured: false },
  { id: 'jpn.1', name: 'J1 League', shortName: 'J1', country: 'Japan', continent: 'Asia', logo: null, featured: false },
  { id: 'kor.1', name: 'K League 1', shortName: 'KL1', country: 'South Korea', continent: 'Asia', logo: null, featured: false },
  { id: 'chn.1', name: 'Chinese Super League', shortName: 'CSL', country: 'China', continent: 'Asia', logo: null, featured: false },

  // Africa & Oceania
  { id: 'rsa.1', name: 'Premier Soccer League', shortName: 'PSL', country: 'South Africa', continent: 'Africa', logo: null, featured: false },
  { id: 'egy.1', name: 'Egyptian Premier League', shortName: 'EPL', country: 'Egypt', continent: 'Africa', logo: null, featured: false },
  { id: 'aus.1', name: 'A-League Men', shortName: 'AUS', country: 'Australia', continent: 'Oceania', logo: null, featured: false },

  // International
  { id: 'fifa.worldq.europa', name: 'World Cup Qualifying — Europe', shortName: 'WCQE', country: 'International', continent: 'International', logo: null, featured: false },
  { id: 'conmebol.worldq', name: 'World Cup Qualifying — CONMEBOL', shortName: 'WCQS', country: 'International', continent: 'International', logo: null, featured: false },
];

export const FEATURED_LEAGUES = LEAGUES.filter((l) => l.featured);

export const HOME_FETCH_LEAGUES = [
  'eng.1', 'esp.1', 'ger.1', 'ita.1', 'fra.1',
  'uefa.champions', 'uefa.europa', 'uefa.conference',
  'por.1', 'ned.1', 'bel.1', 'sco.1', 'tur.1',
  'usa.1', 'mex.1', 'bra.1', 'arg.1', 'col.1',
  'sau.1', 'jpn.1', 'kor.1',
  'conmebol.libertadores',
];

export function getLeagueById(id: string): League | undefined {
  return LEAGUES.find((l) => l.id === id);
}

export function getLeaguesByContinent(): Map<string, League[]> {
  const map = new Map<string, League[]>();
  for (const l of LEAGUES) {
    if (!map.has(l.continent)) map.set(l.continent, []);
    map.get(l.continent)!.push(l);
  }
  return map;
}
