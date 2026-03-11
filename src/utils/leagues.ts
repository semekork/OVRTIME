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
  // --- Featured European Top 5 ---
  {
    id: 'eng.1',
    name: 'Premier League',
    shortName: 'PL',
    country: 'England',
    continent: 'Europe',
    logo: 'https://r2.thesportsdb.com/images/media/league/badge/gasy9d1737743125.png',
    featured: true,
  },
  {
    id: 'esp.1',
    name: 'La Liga',
    shortName: 'LaLiga',
    country: 'Spain',
    continent: 'Europe',
    logo: 'https://r2.thesportsdb.com/images/media/league/badge/ja4it51687628717.png',
    featured: true,
  },
  {
    id: 'ger.1',
    name: 'Bundesliga',
    shortName: 'BUN',
    country: 'Germany',
    continent: 'Europe',
    logo: 'https://r2.thesportsdb.com/images/media/league/badge/teqh1b1679952008.png',
    featured: true,
  },
  {
    id: 'ita.1',
    name: 'Serie A',
    shortName: 'SA',
    country: 'Italy',
    continent: 'Europe',
    logo: 'https://r2.thesportsdb.com/images/media/league/badge/67q3q21679951383.png',
    featured: true,
  },
  {
    id: 'fra.1',
    name: 'Ligue 1',
    shortName: 'L1',
    country: 'France',
    continent: 'Europe',
    logo: 'https://r2.thesportsdb.com/images/media/league/badge/9f7z9d1742983155.png',
    featured: true,
  },

  // --- European Elite Competitions ---
  {
    id: 'uefa.champions',
    name: 'Champions League',
    shortName: 'UCL',
    country: 'Europe',
    continent: 'Europe',
    logo: 'https://r2.thesportsdb.com/images/media/league/badge/facv1u1742998896.png',
    featured: true,
  },
  {
    id: 'uefa.europa',
    name: 'Europa League',
    shortName: 'UEL',
    country: 'Europe',
    continent: 'Europe',
    logo: 'https://r2.thesportsdb.com/images/media/league/badge/mlsr7d1718774547.png',
    featured: true,
  },
  {
    id: 'uefa.conference',
    name: 'Conference League',
    shortName: 'UECL',
    country: 'Europe',
    continent: 'Europe',
    logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/3/3a/UEFA_Europa_Conference_League_logo.svg/1200px-UEFA_Europa_Conference_League_logo.svg.png',
    featured: false,
  },
  {
    id: 'uefa.nations',
    name: 'UEFA Nations League',
    shortName: 'UNL',
    country: 'Europe',
    continent: 'Europe',
    logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/8/8a/UEFA_Nations_League_logo.svg/1200px-UEFA_Nations_League_logo.svg.png',
    featured: false,
  },

  // --- European Domestic Cups & Lower Divisions ---
  {
    id: 'eng.2',
    name: 'Championship',
    shortName: 'EFL',
    country: 'England',
    continent: 'Europe',
    logo: 'https://r2.thesportsdb.com/images/media/league/badge/ty5a681688770169.png',
    featured: false,
  },
  {
    id: 'eng.fa',
    name: 'FA Cup',
    shortName: 'FAC',
    country: 'England',
    continent: 'Europe',
    logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/b/b4/FA_Cup_logo.svg/1200px-FA_Cup_logo.svg.png',
    featured: false,
  },
  {
    id: 'eng.league_cup',
    name: 'Carabao Cup',
    shortName: 'EFLC',
    country: 'England',
    continent: 'Europe',
    logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/8/88/Carabao_Cup_logo.svg/1200px-Carabao_Cup_logo.svg.png',
    featured: false,
  },
  {
    id: 'esp.copa',
    name: 'Copa del Rey',
    shortName: 'CDR',
    country: 'Spain',
    continent: 'Europe',
    logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/5/53/Copa_del_Rey_Logo.svg/1200px-Copa_del_Rey_Logo.svg.png',
    featured: false,
  },
  {
    id: 'ger.dfb',
    name: 'DFB-Pokal',
    shortName: 'DFB',
    country: 'Germany',
    continent: 'Europe',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/DFB-Pokal_logo.svg/1200px-DFB-Pokal_logo.svg.png',
    featured: false,
  },
  {
    id: 'ita.coppa',
    name: 'Coppa Italia',
    shortName: 'CIT',
    country: 'Italy',
    continent: 'Europe',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3d/Coppa_Italia.svg/1200px-Coppa_Italia.svg.png',
    featured: false,
  },

  // --- More Europe ---
  {
    id: 'por.1',
    name: 'Primeira Liga',
    shortName: 'PPL',
    country: 'Portugal',
    continent: 'Europe',
    logo: 'https://r2.thesportsdb.com/images/media/league/badge/lkfko71751917970.png',
    featured: false,
  },
  {
    id: 'ned.1',
    name: 'Eredivisie',
    shortName: 'ERD',
    country: 'Netherlands',
    continent: 'Europe',
    logo: 'https://r2.thesportsdb.com/images/media/league/badge/5cdsu21725984946.png',
    featured: false,
  },
  {
    id: 'bel.1',
    name: 'First Division A',
    shortName: 'BEPD',
    country: 'Belgium',
    continent: 'Europe',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/90/Belgian_First_Division_A_logo.svg/1200px-Belgian_First_Division_A_logo.svg.png',
    featured: false,
  },
  {
    id: 'sco.1',
    name: 'Scottish Premiership',
    shortName: 'SPFL',
    country: 'Scotland',
    continent: 'Europe',
    logo: 'https://r2.thesportsdb.com/images/media/league/badge/72d3zc1688333496.png',
    featured: false,
  },
  {
    id: 'tur.1',
    name: 'Süper Lig',
    shortName: 'SL',
    country: 'Turkey',
    continent: 'Europe',
    logo: 'https://r2.thesportsdb.com/images/media/league/badge/h7xx231601671132.png',
    featured: false,
  },
  {
    id: 'gre.1',
    name: 'Super League Greece',
    shortName: 'SLG',
    country: 'Greece',
    continent: 'Europe',
    logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/1/14/Super_League_Greece_logo.svg/1200px-Super_League_Greece_logo.svg.png',
    featured: false,
  },
  {
    id: 'rus.1',
    name: 'Russian Premier League',
    shortName: 'RPL',
    country: 'Russia',
    continent: 'Europe',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/Russian_Premier_League_logo.svg/1200px-Russian_Premier_League_logo.svg.png',
    featured: false,
  },
  {
    id: 'aut.1',
    name: 'Bundesliga Austria',
    shortName: 'ABL',
    country: 'Austria',
    continent: 'Europe',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Austrian_Football_Bundesliga_logo.svg/1200px-Austrian_Football_Bundesliga_logo.svg.png',
    featured: false,
  },
  {
    id: 'cze.1',
    name: 'Czech First League',
    shortName: 'CFL',
    country: 'Czech Republic',
    continent: 'Europe',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0e/Fortuna_liga_logo.svg/1200px-Fortuna_liga_logo.svg.png',
    featured: false,
  },
  {
    id: 'hrv.1',
    name: 'HNL',
    shortName: 'HNL',
    country: 'Croatia',
    continent: 'Europe',
    logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/8/83/Hrvatska_nogometna_liga_logo.svg/1200px-Hrvatska_nogometna_liga_logo.svg.png',
    featured: false,
  },
  {
    id: 'ukr.1',
    name: 'Ukrainian Premier League',
    shortName: 'UPL',
    country: 'Ukraine',
    continent: 'Europe',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/Ukrainian_Premier_League_logo.svg/1200px-Ukrainian_Premier_League_logo.svg.png',
    featured: false,
  },
  {
    id: 'den.1',
    name: 'Superliga',
    shortName: 'DSU',
    country: 'Denmark',
    continent: 'Europe',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/14/Danish_Superliga_logo.svg/1200px-Danish_Superliga_logo.svg.png',
    featured: false,
  },
  {
    id: 'swe.1',
    name: 'Allsvenskan',
    shortName: 'SWE',
    country: 'Sweden',
    continent: 'Europe',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/Allsvenskan_logo.svg/1200px-Allsvenskan_logo.svg.png',
    featured: false,
  },
  {
    id: 'nor.1',
    name: 'Eliteserien',
    shortName: 'NOR',
    country: 'Norway',
    continent: 'Europe',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/14/Eliteserien_logo.svg/1200px-Eliteserien_logo.svg.png',
    featured: false,
  },

  // --- Americas ---
  {
    id: 'usa.1',
    name: 'MLS',
    shortName: 'MLS',
    country: 'USA',
    continent: 'America',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/76/MLS_crest_logo_RGB_gradient.svg/1200px-MLS_crest_logo_RGB_gradient.svg.png',
    featured: true,
  },
  {
    id: 'mex.1',
    name: 'Liga MX',
    shortName: 'LMX',
    country: 'Mexico',
    continent: 'America',
    logo: 'https://r2.thesportsdb.com/images/media/league/badge/mav5rx1686157960.png',
    featured: true,
  },
  {
    id: 'bra.1',
    name: 'Brasileirão Série A',
    shortName: 'BSA',
    country: 'Brazil',
    continent: 'America',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0b/Campeonato_Brasileiro_S%C3%A9rie_A_logo.svg/1200px-Campeonato_Brasileiro_S%C3%A9rie_A_logo.svg.png',
    featured: true,
  },
  {
    id: 'arg.1',
    name: 'Liga Profesional',
    shortName: 'LPF',
    country: 'Argentina',
    continent: 'America',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/Liga_Profesional_de_F%C3%BAtbol_logo.svg/1200px-Liga_Profesional_de_F%C3%BAtbol_logo.svg.png',
    featured: false,
  },
  {
    id: 'col.1',
    name: 'Categoría Primera A',
    shortName: 'COL',
    country: 'Colombia',
    continent: 'America',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/56/Dimayor_logo.svg/1200px-Dimayor_logo.svg.png',
    featured: false,
  },
  {
    id: 'chl.1',
    name: 'Primera División',
    shortName: 'CHL',
    country: 'Chile',
    continent: 'America',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b1/Campeonato_AFP_PlanVital_logo.svg/1200px-Campeonato_AFP_PlanVital_logo.svg.png',
    featured: false,
  },
  {
    id: 'ecu.1',
    name: 'LigaPro Serie A',
    shortName: 'ECU',
    country: 'Ecuador',
    continent: 'America',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/LigaPro_logo.svg/1200px-LigaPro_logo.svg.png',
    featured: false,
  },
  {
    id: 'per.1',
    name: 'Liga 1',
    shortName: 'PER',
    country: 'Peru',
    continent: 'America',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/73/Liga_1_de_Per%C3%BA_logo.svg/1200px-Liga_1_de_Per%C3%BA_logo.svg.png',
    featured: false,
  },
  {
    id: 'conmebol.libertadores',
    name: 'Copa Libertadores',
    shortName: 'LPIB',
    country: 'South America',
    continent: 'America',
    logo: 'https://r2.thesportsdb.com/images/media/league/badge/9shr931685425181.png',
    featured: false,
  },
  {
    id: 'conmebol.sudamericana',
    name: 'Copa Sudamericana',
    shortName: 'SUD',
    country: 'South America',
    continent: 'America',
    logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/f/f1/Copa_Sudamericana_logo.svg/1200px-Copa_Sudamericana_logo.svg.png',
    featured: false,
  },

  // --- Asia & Middle East ---
  {
    id: 'sau.1',
    name: 'Saudi Pro League',
    shortName: 'SPL',
    country: 'Saudi Arabia',
    continent: 'Asia',
    logo: 'https://r2.thesportsdb.com/images/media/league/badge/w67i621701772123.png',
    featured: false,
  },
  {
    id: 'uae.1',
    name: 'UAE Pro League',
    shortName: 'UAE',
    country: 'UAE',
    continent: 'Asia',
    logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/4/4a/UAE_Pro_League_logo.svg/1200px-UAE_Pro_League_logo.svg.png',
    featured: false,
  },
  {
    id: 'jpn.1',
    name: 'J1 League',
    shortName: 'J1',
    country: 'Japan',
    continent: 'Asia',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bb/J1_League_logo.svg/1200px-J1_League_logo.svg.png',
    featured: false,
  },
  {
    id: 'kor.1',
    name: 'K League 1',
    shortName: 'KL1',
    country: 'South Korea',
    continent: 'Asia',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/28/K_League_1_Logo.svg/1200px-K_League_1_Logo.svg.png',
    featured: false,
  },
  {
    id: 'chn.1',
    name: 'Chinese Super League',
    shortName: 'CSL',
    country: 'China',
    continent: 'Asia',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7d/Chinese_Super_League_logo.svg/1200px-Chinese_Super_League_logo.svg.png',
    featured: false,
  },
  {
    id: 'afc.champions',
    name: 'AFC Champions League',
    shortName: 'ACL',
    country: 'Asia',
    continent: 'Asia',
    logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/f/f5/AFC_Champions_League_Elite_logo.svg/1200px-AFC_Champions_League_Elite_logo.svg.png',
    featured: false,
  },

  // --- Africa & Oceania ---
  {
    id: 'gha.1',
    name: 'Ghana Premier League',
    shortName: 'GPL',
    country: 'Ghana',
    continent: 'Africa',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6d/Ghana_Premier_League_logo.svg/1200px-Ghana_Premier_League_logo.svg.png',
    featured: false,
  },
  {
    id: 'rsa.1',
    name: 'Premier Soccer League',
    shortName: 'PSL',
    country: 'South Africa',
    continent: 'Africa',
    logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/b/b8/Premier_Soccer_League.png/1200px-Premier_Soccer_League.png',
    featured: false,
  },
  {
    id: 'egy.1',
    name: 'Egyptian Premier League',
    shortName: 'EPL',
    country: 'Egypt',
    continent: 'Africa',
    logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/5/52/Egyptian_Premier_League_logo.svg/1200px-Egyptian_Premier_League_logo.svg.png',
    featured: false,
  },
  {
    id: 'aus.1',
    name: 'A-League Men',
    shortName: 'AUS',
    country: 'Australia',
    continent: 'Oceania',
    logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/a/a1/A-League_Men_logo.svg/1200px-A-League_Men_logo.svg.png',
    featured: false,
  },

  // --- Women's Leagues ---
  {
    id: 'eng.w.1',
    name: "Women's Super League",
    shortName: 'WSL',
    country: 'England',
    continent: 'Europe',
    logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/9/9b/Women%27s_Super_League_logo.svg/1200px-Women%27s_Super_League_logo.svg.png',
    featured: false,
  },
  {
    id: 'usa.w.1',
    name: 'NWSL',
    shortName: 'NWSL',
    country: 'USA',
    continent: 'America',
    logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/9/9e/National_Women%27s_Soccer_League_logo%2C_2023.svg/1200px-National_Women%27s_Soccer_League_logo%2C_2023.svg.png',
    featured: false,
  },
  {
    id: 'uefa.w.champions',
    name: "Women's Champions League",
    shortName: 'UWCL',
    country: 'Europe',
    continent: 'Europe',
    logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/6/6d/UEFA_Women%27s_Champions_League_logo.svg/1200px-UEFA_Women%27s_Champions_League_logo.svg.png',
    featured: false,
  },

  // --- Major International ---
  {
    id: 'fifa.world',
    name: 'FIFA World Cup',
    shortName: 'WC',
    country: 'International',
    continent: 'International',
    logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/e/e3/2026_FIFA_World_Cup_logo.svg/1200px-2026_FIFA_World_Cup_logo.svg.png',
    featured: true,
  },
  {
    id: 'uefa.euro',
    name: 'European Championship',
    shortName: 'EURO',
    country: 'Europe',
    continent: 'Europe',
    logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/0/0d/UEFA_European_Championship_logo.svg/1200px-UEFA_European_Championship_logo.svg.png',
    featured: true,
  },
  {
    id: 'conmebol.america',
    name: 'Copa America',
    shortName: 'CA',
    country: 'South America',
    continent: 'America',
    logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/6/67/Copa_Am%C3%A9rica_logo.svg/1200px-Copa_Am%C3%A9rica_logo.svg.png',
    featured: true,
  },
  {
    id: 'caf.nations',
    name: 'Africa Cup of Nations',
    shortName: 'AFCON',
    country: 'Africa',
    continent: 'Africa',
    logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/5/5d/Africa_Cup_of_Nations_logo.svg/1200px-Africa_Cup_of_Nations_logo.svg.png',
    featured: true,
  },
  {
    id: 'afc.asian',
    name: 'AFC Asian Cup',
    shortName: 'AC',
    country: 'Asia',
    continent: 'Asia',
    logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/4/43/AFC_Asian_Cup_logo.svg/1200px-AFC_Asian_Cup_logo.svg.png',
    featured: false,
  },
  {
    id: 'concacaf.gold',
    name: 'CONCACAF Gold Cup',
    shortName: 'GC',
    country: 'North America',
    continent: 'America',
    logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/5/56/CONCACAF_Gold_Cup_logo.svg/1200px-CONCACAF_Gold_Cup_logo.svg.png',
    featured: false,
  },
  {
    id: 'fifa.worldq.europa',
    name: 'World Cup Qualifying — Europe',
    shortName: 'WCQE',
    country: 'International',
    continent: 'International',
    logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/3/3a/European_Qualifiers_logo.svg/1200px-European_Qualifiers_logo.svg.png',
    featured: false,
  },
  {
    id: 'conmebol.worldq',
    name: 'World Cup Qualifying — CONMEBOL',
    shortName: 'WCQS',
    country: 'International',
    continent: 'International',
    logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/0/07/CONMEBOL_logo.svg/1200px-CONMEBOL_logo.svg.png',
    featured: false,
  },
];

// --- Constants ---

export const FEATURED_LEAGUES = LEAGUES.filter((l) => l.featured);

export const HOME_FETCH_LEAGUES = [
  'eng.1',
  'esp.1',
  'ger.1',
  'ita.1',
  'fra.1',
  'uefa.champions',
  'uefa.europa',
  'por.1',
  'ned.1',
  'usa.1',
  'mex.1',
  'bra.1',
  'sau.1',
  'conmebol.libertadores',
  'fifa.world',
];

// --- Helpers ---

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

export function getLeaguesByCountry(country: string): League[] {
  return LEAGUES.filter((l) => l.country.toLowerCase() === country.toLowerCase());
}

function levenshtein(a: string, b: string): number {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix = [];
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          Math.min(
            matrix[i][j - 1] + 1, // insertion
            matrix[i - 1][j] + 1, // deletion
          ),
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

export function searchLeagues(query: string): League[] {
  const normalizedQuery = query.toLowerCase().trim();
  if (!normalizedQuery) return [];

  const results = LEAGUES.map((l) => {
    const nName = l.name.toLowerCase();
    const nShort = l.shortName.toLowerCase();
    const nCountry = l.country.toLowerCase();

    // Exact or substring matches have highest priority (distance 0)
    if (nName.includes(normalizedQuery) || nShort.includes(normalizedQuery) || nCountry.includes(normalizedQuery)) {
      return { league: l, distance: 0 };
    }

    // Attempt to match query words against league attributes
    const distanceName = levenshtein(normalizedQuery, nName);
    const distanceShort = levenshtein(normalizedQuery, nShort);
    const distanceCountry = levenshtein(normalizedQuery, nCountry);

    // Some simple optimization: if a word is inside the string, check distance against words
    const nNameWords = nName.split(' ');
    const distanceWords = nNameWords.map((w) => levenshtein(normalizedQuery, w));
    const minWordDistance = Math.min(...distanceWords, distanceName, distanceShort, distanceCountry);

    return { league: l, distance: minWordDistance };
  });

  // Allowed typo tolerance: ~1 typo per 4 characters. Max threshold is 3.
  const threshold = Math.min(3, Math.max(1, Math.floor(normalizedQuery.length / 4)));

  return results
    .filter((r) => r.distance <= threshold)
    .sort((a, b) => a.distance - b.distance)
    .map((r) => r.league);
}
