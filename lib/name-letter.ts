export type NameTrait = {
  title: string;
  line: string;
};

export type NameLetterExperience = {
  letter: string;
  slug: string;
  heroHeadline: string;
  heroSubheadline: string;
  heroCtaLabel: string;
  traits: NameTrait[];
  relationshipHeading: string;
  relationshipText: string;
  disclaimer: string;
  bridgeHeading: string;
  bridgeText: string;
  finalCtaLabel: string;
  step2Heading: string;
  step2Subheading: string;
  step2CtaLabel: string;
  step2TrustLine: string;
};

export const NAME_LETTER_PREFILL_STORAGE_KEY = "name_letter_kundli_prefill";

const NAME_LETTER_EXPERIENCES: Record<string, NameLetterExperience> = {
  a: {
    letter: "A",
    slug: "a",
    heroHeadline: "A Naam Wale Logon Ke Raaz Jaano",
    heroSubheadline:
      "Kya tumhara ya kisi apne ka naam A se shuru hota hai? Jaano unka nature, behavior, love style, strengths aur hidden personality traits.",
    heroCtaLabel: "Apni Free Kundli Check Karo",
    traits: [
      {
        title: "Confident Nature",
        line: "A-letter log generally situations ko seedha face karte hain.",
      },
      {
        title: "Leadership Quality",
        line: "Team mein naturally initiative lene ki aadat hoti hai.",
      },
      {
        title: "Emotional but Strong",
        line: "Dil se feel karte hain, par difficult phase mein toot-te nahi.",
      },
      {
        title: "Loyal Personality",
        line: "Trust ban jaaye toh relation mein deeply committed rehte hain.",
      },
      {
        title: "Ambitious Thinking",
        line: "Goals clear rakhte hain aur growth mindset se kaam karte hain.",
      },
      {
        title: "Thodi Zidd bhi Hoti Hai",
        line: "Apni baat pe stand lene ki wajah se kabhi stubborn bhi lag sakte hain.",
      },
    ],
    relationshipHeading: "Love, trust aur behavior mein A-name pattern",
    relationshipText:
      "A naam wale log pyaar mein honest aur protective hote hain. Trust milne par dil se invest karte hain, lekin disrespect ya confusion ho toh emotionally distance bhi le lete hain. Ye caring hote hain, par clarity aur loyalty dono expect karte hain.",
    disclaimer:
      "Ye general name-based astrology information hai. Actual personality environment, experiences aur birth chart ke hisaab se vary kar sakti hai.",
    bridgeHeading:
      "Sirf naam se itna pata chalta hai… to poori kundli se kitna kuch pata chal sakta hai?",
    bridgeText:
      "Naam se baseline traits milte hain, lekin janm ki date, time aur jagah se bani kundli aapki life ka zyada personal aur practical insight deti hai.",
    finalCtaLabel: "Free Kundli Check Karo",
    step2Heading: "Apni Free Kundli Check Karo",
    step2Subheading:
      "Naam se mila general insight. Ab birth details ke hisaab se pao more personalized kundli reading.",
    step2CtaLabel: "Meri Free Kundli Dekho",
    step2TrustLine: "Fast • Easy • Personalized",
  },
};

export const NAME_LETTER_KEYS = Object.keys(NAME_LETTER_EXPERIENCES);

export function getNameLetterExperience(
  letter: string
): NameLetterExperience | null {
  return NAME_LETTER_EXPERIENCES[letter.toLowerCase()] ?? null;
}

