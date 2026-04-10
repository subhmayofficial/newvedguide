/**
 * General Moon-sign (Rashi) → metal (dhatu) guidance for kundal / kada.
 * For person-specific timing and Lagna, users should run a full chart — see free kundli.
 */
export type RashiDhatuRow = {
  id: string;
  nameHi: string;
  nameEn: string;
  dhatuHi: string;
  dhatuEn: string;
  kadaLine: string;
  why: string;
  note: string;
};

export const RASHI_DHATU: RashiDhatuRow[] = [
  {
    id: "mesha", // must match RASHI_IMG keys in the tool component
    nameHi: "Mesh",
    nameEn: "Aries",
    dhatuHi: "Tamba (copper)",
    dhatuEn: "Copper",
    kadaLine: "Tambe ka kada / kundal pehanna shubh mana jata hai.",
    why: "Mesh Rashi Mangal se judi hai — tamba Mangal ka dhatu maana jata hai, isliye energy balance ke liye yeh combination traditional texts mein common hai.",
    note: "Jo bhi kada pehnein, saaf-suthra aur comfortable size ka ho.",
  },
  {
    id: "vrishabha",
    nameHi: "Vrishabh",
    nameEn: "Taurus",
    dhatuHi: "Chandi (silver)",
    dhatuEn: "Silver",
    kadaLine: "Chandi ka kada zyada recommend kiya jata hai.",
    why: "Vrishabh Shukra ki Rashi hai — chandi ko Shukra se joda jata hai; thanda, stable feel ke liye silver kada common suggestion hai.",
    note: "Skin allergy ho to doctor se consult karke hi metal choose karein.",
  },
  {
    id: "mithuna",
    nameHi: "Mithun",
    nameEn: "Gemini",
    dhatuHi: "Panchdhatu ya bronze",
    dhatuEn: "Five-metal mix / bronze",
    kadaLine: "Panchdhatu kada ya halka bronze / mixed metal kada better fit hota hai.",
    why: "Mithun Budh ki Rahi hai — mixed / balanced dhatu ko Budh ki dual nature ke saath joda jata hai.",
    note: "Quality wala panchdhatu hi lein — cheap mix se skin issue ho sakta hai.",
  },
  {
    id: "karka",
    nameHi: "Kark",
    nameEn: "Cancer",
    dhatuHi: "Chandi (silver)",
    dhatuEn: "Silver",
    kadaLine: "Chandi ka kada sabse zyada suggest kiya jata hai.",
    why: "Kark Chandra ki Rashi hai — chandra aur chandi ka rishta classical texts mein clear hai.",
    note: "Chandra weak/strong exact analysis ke liye poori kundli dekhi jaati hai.",
  },
  {
    id: "simha",
    nameHi: "Singh",
    nameEn: "Leo",
    dhatuHi: "Sona (gold) ya tamba",
    dhatuEn: "Gold or copper",
    kadaLine: "Sone ka patla kada ya tambe ka kada dono traditional options hain.",
    why: "Singh Surya ki Rashi hai — sone ko Surya se joda jata hai; budget mein tamba bhi Surya energy ke liye use hota hai.",
    note: "Gold mein purity aur budget apne hisaab se decide karein.",
  },
  {
    id: "kanya",
    nameHi: "Kanya",
    nameEn: "Virgo",
    dhatuHi: "Chandi ya panchdhatu",
    dhatuEn: "Silver or panchdhatu",
    kadaLine: "Chandi ya halka panchdhatu kada practical rehta hai.",
    why: "Kanya Budh ki Rashi hai — chandi/panchdhatu dono Budh-friendly metals ke roop mein recommend kiye jaate hain.",
    note: "Daily wear ke liye chandi maintenance asaan hoti hai.",
  },
  {
    id: "tula",
    nameHi: "Tula",
    nameEn: "Libra",
    dhatuHi: "Chandi (silver)",
    dhatuEn: "Silver",
    kadaLine: "Chandi ka kada zyada suitable maana jata hai.",
    why: "Tula bhi Shukra ki Rashi hai — balance aur Shukra dono ke liye silver common pick hai.",
    note: "Design simple rakhein taaki roz pehan sakein.",
  },
  {
    id: "vrishchika",
    nameHi: "Vrishchik",
    nameEn: "Scorpio",
    dhatuHi: "Tamba (copper)",
    dhatuEn: "Copper",
    kadaLine: "Tambe ka kada traditional choice hai.",
    why: "Vrishchik Mangal ki Rashi hai — tamba phir se Mangal ke dhatu se match karta hai.",
    note: "Agar skin green tint kare copper se, roz saaf karein ya doctor se salah lein.",
  },
  {
    id: "dhanu",
    nameHi: "Dhanu",
    nameEn: "Sagittarius",
    dhatuHi: "Sona ya peetal (brass)",
    dhatuEn: "Gold or brass",
    kadaLine: "Sone ka halka kada ya achha quality brass/peetal kada use hota hai.",
    why: "Dhanu Guru (Jupiter) ki Rashi hai — peela dhatu (gold/brass) Guru ke saath joda jata hai.",
    note: "Brass sirf quality wala — allergy check zaroori.",
  },
  {
    id: "makara",
    nameHi: "Makar",
    nameEn: "Capricorn",
    dhatuHi: "Loha (iron/steel kada)",
    dhatuEn: "Iron / steel",
    kadaLine: "Kale rang ka iron/steel kada (Shani kada style) commonly suggest kiya jata hai.",
    why: "Makar Shani ki Rashi hai — Shani se loha joda jata hai; yeh general public recommendation hai.",
    note: "Medical implants / MRI — iron kada pe doctor ki salah lein.",
  },
  {
    id: "kumbha",
    nameHi: "Kumbh",
    nameEn: "Aquarius",
    dhatuHi: "Loha ya chandi",
    dhatuEn: "Iron or silver",
    kadaLine: "Shani pradhan Rashi — iron kada ya chandi dono mein se ek choose kiya ja sakta hai.",
    why: "Kumbh bhi Shani se juda hai — iron classic; chandi agar aapko light metal chahiye.",
    note: "Dono mein se jisme comfortable ho, wahi prefer karein.",
  },
  {
    id: "meena",
    nameHi: "Meen",
    nameEn: "Pisces",
    dhatuHi: "Chandi ya halka gold",
    dhatuEn: "Silver or light gold",
    kadaLine: "Chandi zyada common; kabhi-kabhi patla gold bhi suggest hota hai.",
    why: "Meen Guru ki Rashi hai — chandi soft energy, gold mild Guru tone — dono traditional combinations mein aate hain.",
    note: "Exact stone/metal ke liye Lagna + Chandra dono dekhe jaate hain.",
  },
];

export function getRashiDhatu(id: string): RashiDhatuRow | undefined {
  return RASHI_DHATU.find((r) => r.id === id);
}
