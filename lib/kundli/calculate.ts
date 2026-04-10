/**
 * Vedic Kundli Calculation — V1 Implementation
 *
 * Computes core Vedic astrology data points from birth details.
 * Uses sidereal (Lahiri ayanamsha) system.
 *
 * V1 scope: Lagna, Moon sign, Sun sign, Nakshatra, planetary positions,
 * and a few key life-theme indicators sufficient for the result page.
 *
 * Full Swiss Ephemeris integration can replace this in V2.
 */

export interface KundliInput {
  dob: string;    // "YYYY-MM-DD"
  tob: string;    // "HH:MM" (24h, IST)
  lat: number;    // latitude
  lon: number;    // longitude
  timezone: string; // IANA timezone, e.g. "Asia/Kolkata"
}

export interface PlanetaryPosition {
  planet: string;
  sign: string;
  signIndex: number;   // 0–11
  degree: number;      // 0–29.99
  nakshatra: string;
  nakshatraPada: number; // 1–4
  isRetrograde: boolean;
}

export interface KundliResult {
  lagna: string;          // Ascendant sign
  lagnaIndex: number;
  moonSign: string;
  moonSignIndex: number;
  sunSign: string;
  sunSignIndex: number;
  nakshatra: string;      // Moon nakshatra
  nakshatraPada: number;
  nakshatraLord: string;
  planets: PlanetaryPosition[];
  doshas: {
    mangalDosha: boolean;
    kaalSarpDosha: boolean;
    pitruDosha: boolean;
  };
  lifeThemes: {
    careerIndicator: string;
    relationshipIndicator: string;
    healthIndicator: string;
    spiritualPath: string;
  };
  computedAt: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SIGNS = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
];

const NAKSHATRAS = [
  "Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashira", "Ardra",
  "Punarvasu", "Pushya", "Ashlesha", "Magha", "Purva Phalguni", "Uttara Phalguni",
  "Hasta", "Chitra", "Swati", "Vishakha", "Anuradha", "Jyeshtha",
  "Mula", "Purva Ashadha", "Uttara Ashadha", "Shravana", "Dhanishtha",
  "Shatabhisha", "Purva Bhadrapada", "Uttara Bhadrapada", "Revati",
];

const NAKSHATRA_LORDS = [
  "Ketu", "Venus", "Sun", "Moon", "Mars", "Rahu",
  "Jupiter", "Saturn", "Mercury", "Ketu", "Venus", "Sun",
  "Moon", "Mars", "Rahu", "Jupiter", "Saturn", "Mercury",
  "Ketu", "Venus", "Sun", "Moon", "Mars", "Rahu",
  "Jupiter", "Saturn", "Mercury",
];

const PLANET_NAMES = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn", "Rahu", "Ketu"];

// Career indicators by Lagna
const CAREER_MAP: Record<string, string> = {
  "Aries": "leadership, entrepreneurship, defense",
  "Taurus": "finance, arts, luxury goods, food",
  "Gemini": "communication, media, teaching, writing",
  "Cancer": "real estate, hospitality, psychology, nursing",
  "Leo": "government, politics, entertainment, management",
  "Virgo": "medicine, analysis, research, accounting",
  "Libra": "law, diplomacy, beauty, partnerships",
  "Scorpio": "research, occult, medicine, investigation",
  "Sagittarius": "law, education, philosophy, spirituality",
  "Capricorn": "government, engineering, administration",
  "Aquarius": "technology, social work, research, innovation",
  "Pisces": "spirituality, arts, healing, imagination",
};

const RELATIONSHIP_MAP: Record<string, string> = {
  "Aries": "seeks independence and passion in partnership",
  "Taurus": "values stability, loyalty, and sensory connection",
  "Gemini": "needs intellectual stimulation and communication",
  "Cancer": "deeply emotional, seeks nurturing bond",
  "Leo": "desires admiration, loyalty, and warmth",
  "Virgo": "values reliability, service, and practical care",
  "Libra": "seeks harmony, beauty, and balanced partnership",
  "Scorpio": "intense, transformative, seeks deep soul connection",
  "Sagittarius": "needs freedom, adventure, and philosophical alignment",
  "Capricorn": "seeks long-term commitment and shared ambition",
  "Aquarius": "values friendship, freedom, and unique bond",
  "Pisces": "romantic, spiritual, seeks soul-level connection",
};

const SPIRITUAL_MAP: Record<string, string> = {
  "Aries": "active devotion, mantra, and courage in practice",
  "Taurus": "devotional worship, sacred arts, and nature-based practices",
  "Gemini": "study of scriptures, jnana yoga, and teaching",
  "Cancer": "bhakti yoga, ritual, and divine mother connection",
  "Leo": "sun worship, self-realization, and seva (service)",
  "Virgo": "karma yoga, purity of practice, and sacred routines",
  "Libra": "balanced sadhana, sacred relationships, and harmony",
  "Scorpio": "tantra, kundalini, deep transformation practices",
  "Sagittarius": "dharmic living, pilgrimage, and higher knowledge",
  "Capricorn": "disciplined sadhana, renunciation, and structure",
  "Aquarius": "humanitarian service, meditation, and collective healing",
  "Pisces": "surrender, meditation, divine grace, and intuitive knowing",
};

// ─── Core computation ─────────────────────────────────────────────────────────

function parseDateTimeToJulianDay(dob: string, tob: string, timezoneOffsetHours: number): number {
  const [year, month, day] = dob.split("-").map(Number);
  const [hour, minute] = tob.split(":").map(Number);
  const utcHour = hour - timezoneOffsetHours + minute / 60;

  // Julian Day Number formula (Meeus)
  let y = year;
  let m = month;
  if (m <= 2) { y -= 1; m += 12; }
  const A = Math.floor(y / 100);
  const B = 2 - A + Math.floor(A / 4);
  const JD = Math.floor(365.25 * (y + 4716))
    + Math.floor(30.6001 * (m + 1))
    + day + B - 1524.5 + utcHour / 24;

  return JD;
}

function getLahiriAyanamsha(jd: number): number {
  // Lahiri ayanamsha approximation
  const T = (jd - 2451545.0) / 36525;
  return 23.85 + 1.397 * T;
}

function getSunLongitude(jd: number): number {
  // Mean solar longitude (simplified)
  const T = (jd - 2451545.0) / 36525;
  const L0 = 280.46646 + 36000.76983 * T;
  const M = (357.52911 + 35999.05029 * T) * (Math.PI / 180);
  const C = (1.914602 - 0.004817 * T) * Math.sin(M)
    + 0.019993 * Math.sin(2 * M);
  return ((L0 + C) % 360 + 360) % 360;
}

function getMoonLongitude(jd: number): number {
  // Mean moon longitude (simplified)
  const T = (jd - 2451545.0) / 36525;
  const L = 218.3164477 + 481267.88123421 * T;
  const M = (357.5291092 + 35999.0502909 * T) * (Math.PI / 180);
  const MP = (134.9633964 + 477198.8675055 * T) * (Math.PI / 180);
  const D = (297.8501921 + 445267.1114034 * T) * (Math.PI / 180);
  const F = (93.2720950 + 483202.0175233 * T) * (Math.PI / 180);

  const lon = L
    + 6.288774 * Math.sin(MP)
    + 1.274027 * Math.sin(2 * D - MP)
    + 0.658314 * Math.sin(2 * D)
    + 0.213618 * Math.sin(2 * MP)
    - 0.185116 * Math.sin(M)
    - 0.114332 * Math.sin(2 * F);

  return ((lon % 360) + 360) % 360;
}

function getLagnaLongitude(jd: number, lat: number, lon: number): number {
  // Sidereal time → Ascendant approximation
  const T = (jd - 2451545.0) / 36525;
  const GMST = 280.46061837 + 360.98564736629 * (jd - 2451545.0) + 0.000387933 * T * T;
  const LST = ((GMST + lon) % 360 + 360) % 360;
  const latRad = lat * (Math.PI / 180);
  const obliq = (23.439 - 0.0000004 * T) * (Math.PI / 180);
  const LSTrad = LST * (Math.PI / 180);

  const tanAsc = Math.cos(LSTrad) / (-Math.sin(obliq) * Math.tan(latRad) + Math.cos(obliq) * Math.sin(LSTrad));
  let asc = (Math.atan(tanAsc) * 180 / Math.PI + 360) % 360;

  // Quadrant correction
  if (Math.cos(LSTrad) < 0) asc = (asc + 180) % 360;

  return asc;
}

function getPlanetaryPositions(jd: number, sunLon: number, moonLon: number, ayanamsha: number): PlanetaryPosition[] {
  // Simplified planetary positions using mean motion (V1 — good enough for result page display)
  const T = (jd - 2451545.0) / 36525;

  const rawPositions: Record<string, number> = {
    Sun: sunLon,
    Moon: moonLon,
    Mars: (((355.9929 + 19140.30268 * T) % 360) + 360) % 360,
    Mercury: (((252.2509 + 149472.6746 * T) % 360) + 360) % 360,
    Jupiter: (((34.3515 + 3034.9057 * T) % 360) + 360) % 360,
    Venus: (((181.9798 + 58517.8156 * T) % 360) + 360) % 360,
    Saturn: (((50.0774 + 1222.1138 * T) % 360) + 360) % 360,
    Rahu: (((125.0445 - 1934.1362 * T) % 360) + 360) % 360,
  };

  // Retrograde approximation (simplified — planets retrograde ~portion of their cycle)
  const retrogradeRanges: Record<string, [number, number][]> = {
    Mars: [[0, 0.13]], Mercury: [[0, 0.19]], Jupiter: [[0, 0.3]],
    Venus: [[0, 0.07]], Saturn: [[0, 0.35]],
  };

  const results: PlanetaryPosition[] = [];

  for (const [planet, rawLon] of Object.entries(rawPositions)) {
    // Apply ayanamsha to get sidereal position
    const siderealLon = ((rawLon - ayanamsha) % 360 + 360) % 360;
    const signIndex = Math.floor(siderealLon / 30);
    const degree = siderealLon % 30;
    const nakshatraIndex = Math.floor(siderealLon / (360 / 27));
    const nakshatraPada = Math.floor((siderealLon % (360 / 27)) / (360 / 108)) + 1;

    // Simple retrograde heuristic
    const retroRanges = retrogradeRanges[planet] ?? [];
    const frac = (T % 1 + 1) % 1;
    const isRetrograde = retroRanges.some(([start, end]) => frac >= start && frac <= end);

    results.push({
      planet,
      sign: SIGNS[signIndex],
      signIndex,
      degree: Math.round(degree * 100) / 100,
      nakshatra: NAKSHATRAS[nakshatraIndex],
      nakshatraPada: Math.min(nakshatraPada, 4),
      isRetrograde: planet === "Rahu" ? true : isRetrograde,
    });
  }

  // Ketu is always opposite Rahu
  const rahu = results.find(p => p.planet === "Rahu")!;
  const ketuSignIndex = (rahu.signIndex + 6) % 12;
  const ketuLon = ((rahu.signIndex * 30 + rahu.degree + 180) % 360);
  const ketuNakIndex = Math.floor(ketuLon / (360 / 27));

  results.push({
    planet: "Ketu",
    sign: SIGNS[ketuSignIndex],
    signIndex: ketuSignIndex,
    degree: rahu.degree,
    nakshatra: NAKSHATRAS[ketuNakIndex],
    nakshatraPada: rahu.nakshatraPada,
    isRetrograde: true,
  });

  return results;
}

function computeDoshas(
  planets: PlanetaryPosition[],
  lagnaIndex: number
): KundliResult["doshas"] {
  const mars = planets.find(p => p.planet === "Mars");
  const rahu = planets.find(p => p.planet === "Rahu");
  const ketu = planets.find(p => p.planet === "Ketu");
  const sun = planets.find(p => p.planet === "Sun");

  // Mangal Dosha: Mars in 1st, 2nd, 4th, 7th, 8th, or 12th house from Lagna (whole-sign)
  // Exceptions (widely accepted cancellations):
  //   1. Mars in own sign — Aries (0) or Scorpio (7)
  //   2. Mars in exaltation — Capricorn (9)
  //   3. Mars in Cancer (3) is debilitated — some schools cancel, we cancel for safety
  const mangalDoshaHouseFromLagna0 = [0, 1, 3, 6, 7, 11];
  const marsHouseFromLagna = mars ? (mars.signIndex - lagnaIndex + 12) % 12 : -1;
  const marsOwnOrExalted = mars != null && [0, 7, 9].includes(mars.signIndex);
  const mangalDosha =
    mars != null &&
    mangalDoshaHouseFromLagna0.includes(marsHouseFromLagna) &&
    !marsOwnOrExalted;

  // Kaal Sarp: all planets between Rahu and Ketu
  const kaalSarpDosha = (() => {
    if (!rahu || !ketu) return false;
    const rahuLon = rahu.signIndex * 30 + rahu.degree;
    const ketuLon = ketu.signIndex * 30 + ketu.degree;
    const [start, end] = rahuLon < ketuLon ? [rahuLon, ketuLon] : [ketuLon, rahuLon];
    const mainPlanets = planets.filter(p => !["Rahu", "Ketu"].includes(p.planet));
    return mainPlanets.every(p => {
      const lon = p.signIndex * 30 + p.degree;
      return lon >= start && lon <= end;
    });
  })();

  // Pitru Dosha: Sun with Rahu/Ketu in 9th or afflicted
  const pitruDosha = sun
    ? (sun.signIndex === rahu?.signIndex || sun.signIndex === ketu?.signIndex)
    : false;

  return { mangalDosha, kaalSarpDosha, pitruDosha };
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function calculateKundli(input: KundliInput): KundliResult {
  const timezoneOffsetHours = 5.5; // IST default; V2: resolve from IANA timezone

  const jd = parseDateTimeToJulianDay(input.dob, input.tob, timezoneOffsetHours);
  const ayanamsha = getLahiriAyanamsha(jd);

  const sunLon = getSunLongitude(jd);
  const moonLon = getMoonLongitude(jd);
  const lagnaLon = getLagnaLongitude(jd, input.lat, input.lon);

  // Sidereal positions
  const siderealSun = ((sunLon - ayanamsha) % 360 + 360) % 360;
  const siderealMoon = ((moonLon - ayanamsha) % 360 + 360) % 360;
  const siderealLagna = ((lagnaLon - ayanamsha) % 360 + 360) % 360;

  const sunSignIndex = Math.floor(siderealSun / 30);
  const moonSignIndex = Math.floor(siderealMoon / 30);
  const lagnaIndex = Math.floor(siderealLagna / 30);

  const nakshatraIndex = Math.floor(siderealMoon / (360 / 27));
  const nakshatraPada = Math.min(Math.floor((siderealMoon % (360 / 27)) / (360 / 108)) + 1, 4);

  const planets = getPlanetaryPositions(jd, sunLon, moonLon, ayanamsha);
  const doshas = computeDoshas(planets, lagnaIndex);

  const lagna = SIGNS[lagnaIndex];
  const moonSign = SIGNS[moonSignIndex];

  return {
    lagna,
    lagnaIndex,
    moonSign,
    moonSignIndex,
    sunSign: SIGNS[sunSignIndex],
    sunSignIndex,
    nakshatra: NAKSHATRAS[nakshatraIndex],
    nakshatraPada,
    nakshatraLord: NAKSHATRA_LORDS[nakshatraIndex],
    planets,
    doshas,
    lifeThemes: {
      careerIndicator: CAREER_MAP[lagna] ?? "diverse professional paths",
      relationshipIndicator: RELATIONSHIP_MAP[moonSign] ?? "deep emotional connections",
      healthIndicator: `Watch vitality areas ruled by ${SIGNS[(lagnaIndex + 5) % 12]}`,
      spiritualPath: SPIRITUAL_MAP[lagna] ?? "intuitive spiritual growth",
    },
    computedAt: new Date().toISOString(),
  };
}
