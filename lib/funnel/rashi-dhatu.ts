/** Moon sign (Chandra Rashi) options for the Kundal Dhatu checker — value is stable for URLs & DB. */

export const RASHI_OPTIONS = [
  {
    value: "mesha",
    label: "Mesha (Aries)",
    labelShort: "Mesha",
  },
  {
    value: "vrishabha",
    label: "Vrishabha (Taurus)",
    labelShort: "Vrishabha",
  },
  {
    value: "mithuna",
    label: "Mithuna (Gemini)",
    labelShort: "Mithuna",
  },
  {
    value: "karka",
    label: "Karka (Cancer)",
    labelShort: "Karka",
  },
  {
    value: "simha",
    label: "Simha (Leo)",
    labelShort: "Simha",
  },
  {
    value: "kanya",
    label: "Kanya (Virgo)",
    labelShort: "Kanya",
  },
  {
    value: "tula",
    label: "Tula (Libra)",
    labelShort: "Tula",
  },
  {
    value: "vrishchika",
    label: "Vrishchika (Scorpio)",
    labelShort: "Vrishchika",
  },
  {
    value: "dhanu",
    label: "Dhanu (Sagittarius)",
    labelShort: "Dhanu",
  },
  {
    value: "makara",
    label: "Makara (Capricorn)",
    labelShort: "Makara",
  },
  {
    value: "kumbha",
    label: "Kumbha (Aquarius)",
    labelShort: "Kumbha",
  },
  {
    value: "meena",
    label: "Meena (Pisces)",
    labelShort: "Meena",
  },
] as const;

export type RashiValue = (typeof RASHI_OPTIONS)[number]["value"];

export function isRashiValue(v: string): v is RashiValue {
  return RASHI_OPTIONS.some((r) => r.value === v);
}

export function getRashiLabel(value: string): string | undefined {
  return RASHI_OPTIONS.find((r) => r.value === value)?.label;
}

/** Rashi-based Kundal Dhatu snapshot — educational framing; refine copy with your astrologer. */
export function getDhatuSnapshotForRashi(
  rashi: RashiValue
): { title: string; summary: string; elements: string } {
  const copy: Record<
    RashiValue,
    { title: string; summary: string; elements: string }
  > = {
    mesha: {
      title: "Fiery, forward drive",
      summary:
        "Mesha rashi carries strong Agni (fire) impulse — quick to begin, competitive energy. Kundal flow tends to rise with movement and challenge; balance with cooling routines and steady breath.",
      elements: "Fire-forward · Vāta–Pitta accent",
    },
    vrishabha: {
      title: "Stable, grounded flow",
      summary:
        "Vrishabha supports Prithvi (earth) steadiness — endurance and sensual calm. Kundal dhatu here leans toward slow, deep accumulation; watch stagnation and favour gentle circulation.",
      elements: "Earth · Kapha–Pitta balance",
    },
    mithuna: {
      title: "Mobile, changeable air",
      summary:
        "Mithuna’s Vāyu (air) quality makes energy light and shifting — curiosity, many threads. Kundal movement can scatter; grounding practices help channel prana into one clear path.",
      elements: "Air · Vāta emphasis",
    },
    karka: {
      title: "Fluid, protective depth",
      summary:
        "Karka is Jala (water) — feeling, memory, nurture. Kundal dhatu expresses through emotional tides; steadiness comes from safe space and lunar-friendly routines.",
      elements: "Water · Kapha–Vāta mix",
    },
    simha: {
      title: "Radiant, central heat",
      summary:
        "Simha carries solar clarity and pride — Agni in a steady glow. Kundal energy rises toward expression and leadership; cool the excess with humility and heart-centered practice.",
      elements: "Fire · Pitta forward",
    },
    kanya: {
      title: "Refined, discerning earth",
      summary:
        "Kanya blends earth with analytical air — precision and purification. Kundal dhatu here benefits from clean rhythm and detail; avoid over-tightening the nervous system.",
      elements: "Earth–air · Vāta–Pitta",
    },
    tula: {
      title: "Balancing, relational air",
      summary:
        "Tula seeks harmony and measure — Vāyu with aesthetic sense. Kundal flow moves through relationship and justice; ground decisions so energy doesn’t only oscillate outward.",
      elements: "Air · Vāta with Kapha calm",
    },
    vrishchika: {
      title: "Intense, transformative water",
      summary:
        "Vrishchika concentrates Jala into depth — focus, secrecy, renewal. Kundal dhatu runs hot-cold; channel intensity through disciplined sadhana and honest release.",
      elements: "Water–fire · Pitta–Kapha depth",
    },
    dhanu: {
      title: "Expansive, seeking fire",
      summary:
        "Dhanu lifts Agni toward meaning and distance — faith, travel, growth. Kundal rises with aspiration; anchor the flame so it doesn’t only scatter across ideals.",
      elements: "Fire · Pitta with Vāta lift",
    },
    makara: {
      title: "Structured, ascending earth",
      summary:
        "Makara is earth climbing toward time and duty — discipline, longevity. Kundal dhatu moves stepwise; warmth and flexibility prevent cold constriction in body and mind.",
      elements: "Earth · Kapha–Vāta structure",
    },
    kumbha: {
      title: "Circulating, fixed air",
      summary:
        "Kumbha moves Vāyu through community and vision — networks, ideals. Kundal energy can spark in waves; personal stillness helps the current serve a clear purpose.",
      elements: "Air · Vāta with fixed focus",
    },
    meena: {
      title: "Dissolving, intuitive water",
      summary:
        "Meena dissolves boundaries into Jala — dream, devotion, compassion. Kundal dhatu flows wide; boundaries and earth practices keep the tide nourishing rather than draining.",
      elements: "Water · Kapha–Pitta dissolve",
    },
  };

  return copy[rashi];
}
