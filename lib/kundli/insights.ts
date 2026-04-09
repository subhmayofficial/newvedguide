/**
 * VedGuide — Kundli Insights Engine
 *
 * Language rule: impact-first. Not "yeh ho sakta hai" — but "agar yeh samjha nahi
 * toh yeh hoga". Each line should make the user feel seen, not just informed.
 *
 * Line 1 → Observation  (direct, specific)
 * Line 2 → Impact       (consequence — what happens if not addressed)
 * Line 3 → Gap          (incomplete — only full report has the answer)
 */

import type { KundliResult } from "./calculate";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface InsightBlock {
  icon: string;
  title: string;
  shortLine: string;      // ≤7 words — swipe card headline
  line1: string;
  line2: string;
  line3: string;
  headerGradient: string;
  iconBg: string;
  titleColor: string;
  accentColor: string;    // border/dot accent
}

export interface NegativeSignal {
  badge: string;       // Short label: "Kaal Sarp Yog Detected"
  title: string;       // Bold headline — the problem
  impact: string;      // Real-life consequence (heavy, direct)
  agitate: string;     // What happens if this is ignored
  solution: string;    // The hook — solution exists in paid report
}

export interface PatternBlock {
  planetLabel: string;
  line1: string;
  line2: string;
  line3: string;
}

export interface KundliInsights {
  career: InsightBlock;
  relationship: InsightBlock;
  money: InsightBlock;
  patternWarning: PatternBlock;
  negativeSignal: NegativeSignal;
  valueSummaryBullets: string[];
}

// ─── Element map ──────────────────────────────────────────────────────────────

type Element = "fire" | "earth" | "air" | "water";

const ELEMENT_MAP: Element[] = [
  "fire", "earth", "air", "water",
  "fire", "earth", "air", "water",
  "fire", "earth", "air", "water",
];

function getLagnaElement(idx: number): Element {
  return ELEMENT_MAP[idx] ?? "air";
}

// ─── Career ───────────────────────────────────────────────────────────────────

function careerInsight(result: KundliResult): InsightBlock {
  const el = getLagnaElement(result.lagnaIndex);

  const base = {
    icon: "💼",
    title: "Career",
    headerGradient: "from-amber-100/80 to-orange-50/60",
    iconBg: "bg-amber-100",
    titleColor: "text-amber-900",
    accentColor: "border-amber-300/60",
  };

  if (el === "fire") {
    return {
      ...base,
      shortLine: "Bold move ka sahi time aa raha hai",
      line1: "Ek bold career move ka strong yog hai — jo log sahi time pe step lete hain woh aage nikal jaate hain",
      line2: "Risk lene ki shakti hai, lekin bina timing ke yeh shakti waste hoti hai",
      line3: "Aapka exact window kab hai — full report mein",
    };
  }
  if (el === "earth") {
    return {
      ...base,
      shortLine: "Ek badi opportunity miss hone wali hai",
      line1: "Mehnat ka fal milta hai — par ek major opportunity miss hone ka pattern hai",
      line2: "Galat jagah effort lagao toh saalon ki mehnat ka poora return nahi milta",
      line3: "Sahi jagah aur sahi timing — full report mein",
    };
  }
  if (el === "water") {
    return {
      ...base,
      shortLine: "Direction confusion saalon se rok raha hai",
      line1: "Multiple directions hain — aur yahi confusion progress rok raha hai",
      line2: "Jab tak right path clear na ho, energy waste hoti rehti hai",
      line3: "Aapka exact path kaunsa hai — full report mein",
    };
  }

  // Air — default
  return {
    ...base,
    shortLine: "Ek bada career shift aane wala hai",
    line1: "Career mein ek bada shift aane wala hai — miss hua toh 2-3 saal aur nikal jaenge",
    line2: "Jo chart ki timing samjhte hain woh sahi move sahi time pe lete hain",
    line3: "Aapka exact shift kab — full report mein",
  };
}

// ─── Relationship ─────────────────────────────────────────────────────────────

function relationshipInsight(result: KundliResult): InsightBlock {
  const moonIdx = result.moonSignIndex;
  const venusRuled = [1, 6].includes(moonIdx);
  const marsRuled = [0, 7].includes(moonIdx);
  const waterMoon = [3, 7, 11].includes(moonIdx);

  const base = {
    icon: "❤️",
    title: "Relationship",
    headerGradient: "from-rose-100/80 to-pink-50/60",
    iconBg: "bg-rose-100",
    titleColor: "text-rose-900",
    accentColor: "border-rose-300/60",
  };

  if (venusRuled) {
    return {
      ...base,
      shortLine: "Dete bahut ho — return nahi milta",
      line1: "Rishton mein bahut dete ho — par return woh nahi milta jo deserve karte ho",
      line2: "Yeh imbalance har rishte mein repeat hoga — thakaan badhti rehegi",
      line3: "Kyun hota hai aur kaise change hoga — full report mein",
    };
  }
  if (marsRuled) {
    return {
      ...base,
      shortLine: "Passion aur conflict ka loop nahi toota",
      line1: "Intensity strong hai — par wahi intensity conflict bhi ban jaati hai baar baar",
      line2: "Yeh loop agla rishta aane pe bhi wahi repeat karega",
      line3: "Root cause aur permanent solution — full report mein",
    };
  }
  if (waterMoon) {
    return {
      ...base,
      shortLine: "Samjhta koi nahi — akela feel hota hai",
      line1: "Emotional depth itni strong hai ki log samajh nahi paate — akela feel hota hai",
      line2: "Har baar same hurt milta hai — different logon se bhi",
      line3: "Is pattern ka asli reason — full chart analysis mein",
    };
  }

  return {
    ...base,
    shortLine: "Same dard baar baar — alag logon se",
    line1: "Rishton mein ek specific pattern hai jo baar baar same taklif deta hai",
    line2: "Isko samjhe bina yeh loop agle rishte mein bhi aayega",
    line3: "Root cause aur real solution — full report mein",
  };
}

// ─── Money ────────────────────────────────────────────────────────────────────

function moneyInsight(result: KundliResult): InsightBlock {
  const saturnSign = result.planets.find((p) => p.planet === "Saturn");
  const rahuSign   = result.planets.find((p) => p.planet === "Rahu");
  const jupiterSign = result.planets.find((p) => p.planet === "Jupiter");

  const saturnStrong  = saturnSign  && [5, 9, 10].includes(saturnSign.signIndex);
  const jupiterGrowth = jupiterSign && [0, 4, 8, 2, 6].includes(jupiterSign.signIndex);
  const rahuActive    = rahuSign    && [2, 5, 9, 10].includes(rahuSign.signIndex);

  const base = {
    icon: "💰",
    title: "Money",
    headerGradient: "from-emerald-100/80 to-teal-50/60",
    iconBg: "bg-emerald-100",
    titleColor: "text-emerald-900",
    accentColor: "border-emerald-300/60",
  };

  if (saturnStrong) {
    return {
      ...base,
      shortLine: "Mehnat hai — par fal hamesha late milta hai",
      line1: "Mehnat sahi hai — par paisa hamesha thoda late milta hai, coincidence nahi hai",
      line2: "Saturn ka yeh pattern samjhe bina financial decisions baar baar wrong timing pe loge",
      line3: "Money cycle kab peak karega — full report mein",
    };
  }
  if (jupiterGrowth && !rahuActive) {
    return {
      ...base,
      shortLine: "Dhan yog hai — ek decision window aane wala hai",
      line1: "Dhan yog strong hai — par ek critical decision window aane wala hai",
      line2: "Yeh window miss hua toh potential waste ho jaayega",
      line3: "Exact period kab hai — full report mein",
    };
  }

  return {
    ...base,
    shortLine: "Ek money block hai jo rokta rehta hai",
    line1: "Paisa aata hai par ek block hai jo baar baar haath se nikaalta hai",
    line2: "Block pehchana nahi gaya toh decisions life bhar wrong direction mein jaayenge",
    line3: "Block kahan hai aur kaise todna hai — full report mein",
  };
}

// ─── Pattern warning ──────────────────────────────────────────────────────────

function patternWarning(result: KundliResult): PatternBlock {
  if (result.doshas.kaalSarpDosha) {
    return {
      planetLabel: "Kaal Sarp Yog",
      line1: "Aapki kundli mein Kaal Sarp Yog present hai — yeh ek serious planetary pattern hai jo multiple life areas ko ek saath block karta hai",
      line2: "Jo log is pattern ke saath bina jankari ke chalte hain — woh baar baar usi jagah pe rok face karte hain, without knowing why",
      line3: "Iska poora impact, affected areas, aur exact remedy — full report mein clearly explain kiya gaya hai",
    };
  }
  if (result.doshas.mangalDosha) {
    return {
      planetLabel: "Mangal Dosha",
      line1: "Aapki chart mein Mangal Dosha hai — yeh relationship aur major life decisions dono ko directly affect karta hai",
      line2: "Agar is pattern ko address nahi kiya gaya toh important decisions mein ek invisible tension kaam karta rehta hai",
      line3: "Dosha ka exact nature, scope, aur kya karna chahiye — full kundli mein detail hai",
    };
  }
  if (result.doshas.pitruDosha) {
    return {
      planetLabel: "Pitru Yog",
      line1: "Aapki chart mein Sun aur Rahu ki position milke ek specific block bana rahi hai",
      line2: "Yeh family aur long-term financial security dono ko affect karta hai — often silently, without obvious reason",
      line3: "Exact impact aur iska remedy sirf detailed chart analysis mein samajh aata hai",
    };
  }

  const lord = result.nakshatraLord;
  const heavyPlanets: Record<string, PatternBlock> = {
    Rahu: {
      planetLabel: "Rahu",
      line1: "Aapki kundli mein Rahu ki position ek confusion aur sudden change ka pattern create kar rahi hai",
      line2: "Yeh pattern decisions mein delay, unexpected obstacles, ya sudden shifts laata hai — baar baar",
      line3: "Iska poora reason aur aapke specific areas of impact — full report mein",
    },
    Saturn: {
      planetLabel: "Saturn",
      line1: "Saturn aapke chart mein ek delay pattern de raha hai jo mehnat ke baad bhi result late karta hai",
      line2: "Isko samjhe bina aap sahi cheez sahi time pe nahi kar paoge — aur frustration badhti rehegi",
      line3: "Exact Saturn cycle aur iska kundli pe impact — full report mein detail se",
    },
    Mars: {
      planetLabel: "Mars",
      line1: "Mars ki position aapki chart mein ek hidden tension ka source hai — decisions aur relationships dono mein",
      line2: "Yeh tension ignore karte raho toh same type ka conflict baar baar aata rahega — bina clear reason ke",
      line3: "Iska actual root aur kya karna hai — full analysis mein seedha answer hai",
    },
  };

  return heavyPlanets[lord] ?? {
    planetLabel: lord,
    line1: "Aapki kundli mein ek aisa pattern dikh raha hai jo decisions aur outcomes ko seedha affect kar raha hai",
    line2: "Agar isse ignore kiya gaya toh same situations future mein bhi repeat karenge — without knowing why",
    line3: "Iska poora reason aur impact full analysis mein samajh aata hai",
  };
}

// ─── Value summary ────────────────────────────────────────────────────────────

function valueSummaryBullets(result: KundliResult): string[] {
  const el = getLagnaElement(result.lagnaIndex);
  if (el === "fire") {
    return [
      "Aapke paas bold moves ka yog hai — par timing ka pata nahi",
      "Ek major career shift aane wala hai",
      "Decisions ka real impact clear nahi hai abhi",
    ];
  }
  if (el === "earth") {
    return [
      "Mehnat sahi hai — direction thodi off hai",
      "Ek big opportunity miss hone ka pattern hai",
      "Sahi timing aur sahi move ka pata nahi",
    ];
  }
  if (el === "water") {
    return [
      "Intuition strong hai — clarity nahi hai",
      "Confusion aur repeated patterns dono present hain",
      "Root cause aur solution unclear hai",
    ];
  }
  return [
    "Aap change aur growth ke liye ready ho",
    "Clarity thodi late aati hai — aur iska reason chart mein hai",
    "Decisions ka full impact abhi tak unclear hai",
  ];
}

// ─── Negative signal (selling point) ─────────────────────────────────────────
// Priority: Kaal Sarp > Mangal > Pitru > Debilitated Moon > Debilitated Saturn
//           > Saturn+Rahu > Debilitated Mars > Retrograde Saturn > Generic

function negativeSignal(result: KundliResult): NegativeSignal {
  const moon    = result.planets.find((p) => p.planet === "Moon");
  const saturn  = result.planets.find((p) => p.planet === "Saturn");
  const mars    = result.planets.find((p) => p.planet === "Mars");
  const rahu    = result.planets.find((p) => p.planet === "Rahu");

  // 1. Kaal Sarp Yog ──────────────────────────────────────────────────────────
  if (result.doshas.kaalSarpDosha) {
    return {
      badge: "Kaal Sarp Yog — Chart Mein Present",
      title: "Yeh Yog Aapki Progress Ko Baar Baar Rokta Hai",
      impact: "Kaal Sarp Yog mein saare planets Rahu aur Ketu ke beech trapped rehte hain. Iska seedha asar hota hai — mehnat ka poora fal nahi milta, sahi time pe cheezein nahi hoti, aur ek invisible wall lagti hai life mein. Kai logon ko saalon baad pata chalta hai ki yeh chart ka issue tha.",
      agitate: "Jo log is yog ko samjhe bina chalte hain woh baar baar unexpected setbacks face karte hain — career mein, relationships mein, financial stability mein — aur reason samajh nahi aata.",
      solution: "Kaal Sarp Yog ka exact type, aapki life ke kaunse areas most affected hain, aur iska tested remedy — yeh sab sirf detailed kundli analysis mein clearly samajh aata hai.",
    };
  }

  // 2. Mangal Dosha ───────────────────────────────────────────────────────────
  if (result.doshas.mangalDosha) {
    return {
      badge: "Mangal Dosha — Detected",
      title: "Yeh Dosha Relationships Aur Major Decisions Dono Ko Affect Karta Hai",
      impact: "Mangal Dosha ek serious planetary position hai jo relationships mein tension, delay, ya unexpected breakdowns create karta hai. Sirf relationship nahi — career aur financial decisions mein bhi ek aggressive ya impulsive energy aati hai jo regret dilati hai.",
      agitate: "Bina is dosha ko samjhe aur sahi remedy liye, same type ke conflicts baar baar aate rahenge — alag logon ke saath bhi, alag situations mein bhi. Pattern break nahi hoga.",
      solution: "Mangal Dosha ka aapki specific chart mein exact placement, uska actual impact, aur jo remedy aapke liye sahi hai — yeh full detailed analysis mein milega.",
    };
  }

  // 3. Pitru Dosha ────────────────────────────────────────────────────────────
  if (result.doshas.pitruDosha) {
    return {
      badge: "Pitru Yog — Chart Mein Signal",
      title: "Yeh Yog Family Aur Long-Term Security Ko Silently Affect Karta Hai",
      impact: "Sun aur Rahu ka yeh combination ek hidden friction create karta hai — family relationships mein tension, ancestral patterns jo repeat hote hain, aur financial security mein ek unexplained instability. Bahut log yeh connection nahi dekhte.",
      agitate: "Pitru Yog ko address kiye bina family-related stress, career mein unexpected breaks, aur financial planning mein baar baar gaps aate rahenge — without understanding the root.",
      solution: "Yog ka exact scope, aapke life ka kaunsa area most affected hai, aur iska shastrokta remedy — poori detail sirf detailed chart analysis mein aati hai.",
    };
  }

  // 4. Debilitated Moon (Scorpio) ─────────────────────────────────────────────
  if (moon?.signIndex === 7) {
    return {
      badge: "Neech Chandra — Detected",
      title: "Kamzor Moon Emotional Stability Aur Decisions Dono Ko Affect Karta Hai",
      impact: "Moon Scorpio mein debilitated hoti hai — iska matlab hai emotional swings, overthinking, aur decisions mein clarity ki kami. Sabse bura tab hota hai jab yeh mental fatigue life ke important decisions ko affect karne lagti hai.",
      agitate: "Agar iska pata na ho toh aap baar baar emotionally driven wrong decisions lenge — aur baad mein regret hoga ki 'tab kyon kiya'. Pattern automatically nahi tootega.",
      solution: "Chandra ka exact debilitation degree, iska aapke mental aur life decisions pe real impact, aur strengthening upay — full kundli mein clearly milega.",
    };
  }

  // 5. Debilitated Saturn (Aries) ─────────────────────────────────────────────
  if (saturn?.signIndex === 0) {
    return {
      badge: "Neech Shani — Detected",
      title: "Debilitated Saturn Mehnat Ka Fal Baar Baar Delay Karta Hai",
      impact: "Shani Aries mein apni debilitated position mein hoti hai — yeh career mein sudden obstacles, delayed rewards, aur ek frustrating feeling create karta hai ki 'itni mehnat ke baad bhi result kyun nahi aa raha'. Yeh sirf bad luck nahi hai.",
      agitate: "Bina is planetary pattern ko samjhe aap baar baar galat timing pe effort lagaoge — jab Shani ka support nahi hoga. Saalon ki mehnat short period mein waste ho sakti hai.",
      solution: "Saturn debilitation ka exact scope, aapki career timing, aur Shani ke saath kaise kaam karna hai — full report mein detail se samjhaya gaya hai.",
    };
  }

  // 6. Saturn conjunct Rahu (same sign) ───────────────────────────────────────
  if (saturn && rahu && saturn.signIndex === rahu.signIndex) {
    return {
      badge: "Shani-Rahu Yuti — Chart Mein Present",
      title: "Shani Aur Rahu Ka Saath Ek Double Block Create Karta Hai",
      impact: "Jab Saturn aur Rahu ek hi sign mein hote hain, toh yeh ek double pressure zone create karta hai — career mein delays bhi aur unexpected obstacles bhi. Stability chahte ho lekin baar baar disruption aata hai. Yeh coincidence nahi hai.",
      agitate: "Is combination ko ignore karna matlab hai same frustrating cycles mein phasna — plan banao, kuch beech mein bigad jaata hai. Without knowing why, you keep repeating it.",
      solution: "Is yuti ka exact chart placement, aapki life ke kaunse 10 saal sabse critical hain, aur is double influence se kaise navigate karna hai — full kundli mein clearly hai.",
    };
  }

  // 7. Debilitated Mars (Cancer) ──────────────────────────────────────────────
  if (mars?.signIndex === 3) {
    return {
      badge: "Neech Mangal — Detected",
      title: "Kamzor Mars Energy Aur Ambition Ko Baar Baar Block Karta Hai",
      impact: "Mars Cancer mein debilitated position mein hai — iska matlab hai ki aapki action-taking energy baar baar block hoti hai, decisions mein hesitation aati hai, aur jo goals set karte ho unhe complete karne mein unexplained resistance aati hai.",
      agitate: "Yeh pattern recognize kiye bina aap baar baar 'I'll start tomorrow' ya 'thoda aur wait karta hun' bol ke opportunities miss karte rahoge. Momentum banana mushkil rehta hai.",
      solution: "Mars debilitation ka exact impact, aapke chart mein action aur ambition ka real picture, aur Mars ko strengthen karne ke upay — full report mein milenge.",
    };
  }

  // 8. Saturn retrograde ──────────────────────────────────────────────────────
  if (saturn?.isRetrograde) {
    return {
      badge: "Vakri Shani — Chart Mein Present",
      title: "Retrograde Saturn Karma Aur Timing Dono Ko Complicate Karta Hai",
      impact: "Vakri Shani ek karmic debt signal hai — kuch aisa hai jo pichle actions se unresolved hai aur yeh life mein baar baar resurface hota hai. Career mein, relationships mein, financial decisions mein — ek unexplained sense of 'stuck' rehta hai.",
      agitate: "Bina is pattern ko samjhe aap baar baar usi situation mein jaoge — different setting, same feeling. Retrograde karma automatically clear nahi hota.",
      solution: "Vakri Shani ki position, uska life pe real karmic impact, aur iske saath sahi tarike se kaise kaam karna hai — yeh full kundli analysis ka ek critical part hai.",
    };
  }

  // 9. Generic — always have something ───────────────────────────────────────
  return {
    badge: `${result.nakshatraLord} — Chart Pattern Detected`,
    title: "Aapki Kundli Mein Ek Specific Block Hai Jo Life Ko Affect Kar Raha Hai",
    impact: `Aapka Nakshatra lord ${result.nakshatraLord} ek specific pattern create kar raha hai jo baar baar same situations, same frustrations, aur same delays laata hai — different areas of life mein. Yeh pattern real hai aur chart se directly trace hota hai.`,
    agitate: "Isko samjhe bina aap baar baar wahi decisions lenge jo same outcomes denge. Pattern tootega nahi — sirf alag form mein repeat hoga.",
    solution: "Yeh pattern kahan se aa raha hai, aapki life ke exactly kaunse areas pe iska strongest impact hai, aur isse kaise address karna hai — full detailed analysis mein hai.",
  };
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function getKundliInsights(result: KundliResult): KundliInsights {
  return {
    career: careerInsight(result),
    relationship: relationshipInsight(result),
    money: moneyInsight(result),
    patternWarning: patternWarning(result),
    negativeSignal: negativeSignal(result),
    valueSummaryBullets: valueSummaryBullets(result),
  };
}
