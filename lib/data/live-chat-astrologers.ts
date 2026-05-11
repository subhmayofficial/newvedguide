/**
 * Catalog for the live / per-minute chat directory (`/astrologers`).
 * Replace or extend this list when real astrologers and pricing are finalized.
 */

export type LiveChatAstrologer = {
  id: string;
  slug: string;
  name: string;
  title: string;
  shortBio: string;
  experienceYears: number;
  languages: string[];
  specialties: string[];
  /** Whole rupees per minute (e.g. 49 → ₹49/min) */
  chatRateInrPerMin: number;
  rating: number;
  reviewCount: number;
  isOnline: boolean;
  /** Tailwind gradient classes for the avatar plate */
  avatarGradient: string;
  initials: string;
  /** Optional portrait — must match `next.config` remotePatterns */
  imageSrc?: string;
  /** Optional badge shown on avatar corner e.g. "Rising Star", "Celebrity" */
  badge?: string;
  /** Approximate wait time in minutes (shown below Chat button) */
  waitMinutes?: number;
  /** Pin to top with golden highlight in the directory */
  featured?: boolean;
};

export const LIVE_CHAT_CATEGORIES = [
  "All",
  "Love & marriage",
  "Career",
  "Wealth & business",
  "Vedic & kundli",
  "Vastu",
  "Tarot & intuition",
] as const;

export type LiveChatCategory = (typeof LIVE_CHAT_CATEGORIES)[number];

export const LIVE_CHAT_ASTROLOGERS: LiveChatAstrologer[] = [
  {
    id: "ashutosh",
    slug: "astro-guru-ashutosh",
    name: "AstroGuru Ashutosh",
    title: "Lead Vedic astrologer · VedGuide",
    shortBio:
      "Deep chart synthesis for career timing, relationships, and remedies — direct, practical, and rooted in classical Jyotish.",
    experienceYears: 5,
    languages: ["Hindi", "English"],
    specialties: ["Vedic & kundli", "Love & marriage", "Career", "Wealth & business", "Vastu", "Tarot & intuition"],
    chatRateInrPerMin: 49,
    rating: 4.9,
    reviewCount: 3238,
    isOnline: true,
    avatarGradient: "from-amber-700/90 to-amber-950/95",
    initials: "AA",
    imageSrc: "https://primedit-cdn.b-cdn.net/ashutoshji.jpg",
    badge: "Expert",
    featured: true,
  },
  {
    id: "priya",
    slug: "dr-priya-sharma",
    name: "Dr. Priya Sharma",
    title: "Relationship & compatibility specialist",
    shortBio:
      "Synastry, marriage timing, and emotional patterns — clarity for love decisions without drama.",
    experienceYears: 12,
    languages: ["Hindi", "English", "Marathi"],
    specialties: ["Love & marriage", "Vedic & kundli"],
    chatRateInrPerMin: 39,
    rating: 4.8,
    reviewCount: 720,
    isOnline: true,
    avatarGradient: "from-rose-700/85 to-rose-950/90",
    initials: "PS",
    badge: "Rising Star",
  },
  {
    id: "vikram",
    slug: "acharya-vikram-singh",
    name: "Acharya Vikram Singh",
    title: "Vastu · Panchang · Muhurat",
    shortBio:
      "Space harmony, auspicious timings, and structural remedies for home and workplace energy.",
    experienceYears: 15,
    languages: ["Hindi", "English"],
    specialties: ["Vastu", "Wealth & business"],
    chatRateInrPerMin: 59,
    rating: 4.9,
    reviewCount: 380,
    isOnline: false,
    avatarGradient: "from-emerald-800/85 to-emerald-950/92",
    initials: "VS",
  },
  {
    id: "meera",
    slug: "jyotishi-meera-iyer",
    name: "Jyotishi Meera Iyer",
    title: "Tarot · Intuitive timing",
    shortBio:
      "Short, sharp reads for the next 3–6 months — ideal when you need a second lens on a stuck decision.",
    experienceYears: 9,
    languages: ["English", "Tamil", "Hindi"],
    specialties: ["Tarot & intuition", "Career", "Love & marriage"],
    chatRateInrPerMin: 29,
    rating: 4.7,
    reviewCount: 940,
    isOnline: true,
    avatarGradient: "from-violet-700/85 to-violet-950/90",
    initials: "MI",
  },
  {
    id: "ramesh",
    slug: "pandit-ramesh-tiwari",
    name: "Pandit Ramesh Tiwari",
    title: "Kundli · Dosh · Remedies",
    shortBio:
      "Classical chart breakdowns, dasha analysis, and proportionate remedial paths you can actually follow.",
    experienceYears: 22,
    languages: ["Hindi", "Sanskrit", "English"],
    specialties: ["Vedic & kundli", "Love & marriage"],
    chatRateInrPerMin: 45,
    rating: 4.9,
    reviewCount: 1840,
    isOnline: true,
    avatarGradient: "from-amber-900/80 to-stone-950/95",
    initials: "RT",
  },
  {
    id: "kavita",
    slug: "acharya-kavita-desai",
    name: "Acharya Kavita Desai",
    title: "Business & wealth cycles",
    shortBio:
      "Partnerships, investments, and career pivots — mapped to planetary periods and risk windows.",
    experienceYears: 14,
    languages: ["Hindi", "English", "Gujarati"],
    specialties: ["Wealth & business", "Career", "Vedic & kundli"],
    chatRateInrPerMin: 55,
    rating: 4.8,
    reviewCount: 290,
    isOnline: false,
    avatarGradient: "from-amber-600/75 to-orange-950/90",
    initials: "KD",
  },
  {
    id: "arjun",
    slug: "guru-arjun-malhotra",
    name: "Guru Arjun Malhotra",
    title: "Palmistry · Vedic cross-check",
    shortBio:
      "Lines and mounts cross-checked with birth chart — useful when birth time is approximate.",
    experienceYears: 11,
    languages: ["Hindi", "English", "Punjabi"],
    specialties: ["Vedic & kundli", "Career"],
    chatRateInrPerMin: 35,
    rating: 4.6,
    reviewCount: 210,
    isOnline: true,
    avatarGradient: "from-sky-800/80 to-slate-950/95",
    initials: "AM",
  },
];

export function formatInrWhole(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}
