/**
 * "Detected areas" copy for the free result page — short verdict + teaser + lock CTA.
 * Variants are chosen deterministically from birth data + chart so each kundli feels different.
 */
import type { KundliResult } from "./calculate";

export interface DetectedAreaCard {
  key: "career" | "relationship" | "health" | "wealth";
  emoji: string;
  label: string;
  verdict: string;
  teaser: string;
  lockedCta: string;
  accent: string;
}

/** Stable hash from chart + DOB — same person always gets same variants */
function chartSeed(result: KundliResult, dob: string): number {
  const s = `${dob}|${result.lagnaIndex}|${result.moonSignIndex}|${result.nakshatra}|${result.nakshatraPada}|${result.nakshatraLord}`;
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function pick<T>(arr: readonly T[], seed: number, salt: number): T {
  const idx = (seed + salt * 2654435761) % arr.length;
  return arr[idx]!;
}

function firstCareerPhrase(result: KundliResult): string {
  const raw = result.lifeThemes.careerIndicator;
  return raw.split(",")[0]?.trim() ?? "growth";
}

// ─── Career (3 variants × templates) ───────────────────────────────────────────

const CAREER_VERDICTS = [
  (lagna: string, field: string) =>
    `Career mein shift ya redirection ka yog dikh raha hai — ${lagna} Lagna growth-oriented energy deta hai.`,
  (lagna: string, field: string) =>
    `Professional life mein ek clear evolution phase — ${field} jaisi direction naturally align ho sakti hai.`,
  (lagna: string, field: string) =>
    `Kaam ke chehre par change ya upgrade ka signal — chart ${lagna} se leadership aur adaptability dono dikha rahi hai.`,
] as const;

const CAREER_TEASERS = [
  () =>
    "Aapki kundli stable routine se zyada growth-oriented ya change-driven pattern dikha rahi hai.",
  () =>
    "Same role mein rehne se zyada, naye opportunity ya skill-shift par focus ka combination ban raha hai.",
  () =>
    "Timing aur right move — dono ek saath align hone par hi full clarity milti hai; abhi surface par hint hai.",
] as const;

const CAREER_LOCKED = [
  "Exact turning point aur suitable direction detailed analysis mein.",
  "Kaunsa saal / kaunsa period strongest rahega — full report mein timeline ke saath.",
  "Ideal industry + avoid list — paid unlock ke baad milega.",
] as const;

// ─── Relationship ─────────────────────────────────────────────────────────────

const REL_VERDICTS = [
  (moon: string) =>
    `Emotional depth strong hai — ${moon} Rashi attachment ko priority deti hai, par clarity kabhi delay ho sakti hai.`,
  (moon: string) =>
    `Rishton mein intensity aur expectation dono high — ${moon} ka pattern mixed signals create kar sakta hai.`,
  (moon: string) =>
    `Partnership area active hai — ${moon} Rashi mein give-and-take ka balance key hai.`,
] as const;

const REL_TEASERS = [
  () =>
    "Attachment aur overthinking dono relationship decisions ko affect kar sakte hain.",
  () =>
    "Jo rishta aapko repeat feel hota hai — uska astrological loop chart mein trace ho sakta hai.",
  () =>
    "Communication gap ya timing mismatch — dono mein se kuch aapke chart se link ho sakta hai.",
] as const;

const REL_LOCKED = [
  "Kaunsa pattern repeat ho raha hai — detailed report mein.",
  "Compatibility + important dates — full analysis mein.",
  "7th house deep-dive — unlock ke baad.",
] as const;

// ─── Health / Stress ──────────────────────────────────────────────────────────

const HEALTH_VERDICTS = [
  (result: KundliResult) => {
    if (result.doshas.mangalDosha) {
      return "Stress aur body-energy balance par special dhyan — Mangal ka pattern energy spikes aur irritation dono la sakta hai.";
    }
    if (result.doshas.kaalSarpDosha) {
      return "Mental fatigue aur sleep/rest cycle par chart ek sustained pressure zone dikha rahi hai.";
    }
    return `Stress aur body-energy balance par special dhyan chahiye — ${result.lagna} Lagna emotional load ko physical side par carry kar sakta hai.`;
  },
  (result: KundliResult) =>
    `Vitality aur rest ka rhythm — chart ${result.moonSign} Rashi ke hisaab se nervous system sensitive ho sakta hai.`,
  (result: KundliResult) =>
    `Lifestyle discipline + emotional regulation dono health ke liye equally important dikhte hain — ${result.nakshatra} nakshatra ka subtle effect.`,
] as const;

const HEALTH_TEASERS = [
  (result: KundliResult) =>
    `Chart emotional pressure ka physical effect dikha sakti hai — ${result.lifeThemes.healthIndicator.split(" ").slice(0, 8).join(" ")}…`,
  (_result: KundliResult) =>
    "Irregular routine ya overwork — dono mein se jo aapke life mein repeat ho, pattern chart se match ho sakta hai.",
  (_result: KundliResult) =>
    "Preventive focus areas (digestion, sleep, anxiety) — free mein naam nahi, sirf hint.",
] as const;

const HEALTH_LOCKED = [
  "Sensitive areas aur preventive guidance paid report mein.",
  "Remedies + weak planet support — full unlock mein.",
  "Exact body systems & timing — detailed kundli mein.",
] as const;

// ─── Wealth ───────────────────────────────────────────────────────────────────

const WEALTH_VERDICTS = [
  () =>
    "Money aata hai, but hold aur planning mein challenge ho sakta hai — cash flow rhythm unstable feel ho sakta hai.",
  () =>
    "Dhan yog ka potential hai, par decision timing par loss ya missed opportunity ka bhi pattern dikh sakta hai.",
  () =>
    "Earning capacity strong lagti hai — savings / investment discipline par chart ek gap highlight karti hai.",
] as const;

const WEALTH_TEASERS = [
  () =>
    "Financial pattern mein fluctuation aur decision-based impact dikhta hai.",
  () =>
    "Sudden expense ya sudden gain — dono mein se kuch aapke mahadasha timing se juda hoga.",
  () =>
    "11th house gains aur 2nd house savings — beech ka tension free version mein incomplete hai.",
] as const;

const WEALTH_LOCKED = [
  "Aapke money blocks aur improvement zones detailed report mein.",
  "Best months / avoid periods — full analysis mein.",
  "Remedies for wealth stability — paid unlock.",
] as const;

export function getDetectedAreas(result: KundliResult, dob: string): DetectedAreaCard[] {
  const seed = chartSeed(result, dob);
  const field = firstCareerPhrase(result);

  const ci = pick([0, 1, 2], seed, 1);
  const ri = pick([0, 1, 2], seed, 2);
  const hi = pick([0, 1, 2], seed, 3);
  const wi = pick([0, 1, 2], seed, 4);

  const careerVerdict = CAREER_VERDICTS[ci]!(result.lagna, field);
  const relVerdict = REL_VERDICTS[ri]!(result.moonSign);
  const healthVerdict = HEALTH_VERDICTS[hi]!(result);
  const healthTeaser = HEALTH_TEASERS[hi]!(result);

  return [
    {
      key: "career",
      emoji: "💼",
      label: "Career",
      verdict: careerVerdict,
      teaser: CAREER_TEASERS[ci]!(),
      lockedCta: CAREER_LOCKED[ci]!,
      accent: "border-brand/25 bg-gradient-to-br from-brand-light/50 to-transparent",
    },
    {
      key: "relationship",
      emoji: "❤️",
      label: "Relationship",
      verdict: relVerdict,
      teaser: REL_TEASERS[ri]!(),
      lockedCta: REL_LOCKED[ri]!,
      accent: "border-rose-200/80 bg-gradient-to-br from-rose-50/80 to-transparent",
    },
    {
      key: "health",
      emoji: "🧘",
      label: "Health / Stress",
      verdict: healthVerdict,
      teaser: healthTeaser,
      lockedCta: HEALTH_LOCKED[hi]!,
      accent: "border-emerald-200/80 bg-gradient-to-br from-emerald-50/70 to-transparent",
    },
    {
      key: "wealth",
      emoji: "💰",
      label: "Wealth",
      verdict: WEALTH_VERDICTS[wi]!(),
      teaser: WEALTH_TEASERS[wi]!(),
      lockedCta: WEALTH_LOCKED[wi]!,
      accent: "border-amber-200/80 bg-gradient-to-br from-amber-50/80 to-transparent",
    },
  ];
}
