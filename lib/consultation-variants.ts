export type ConsultationIconName =
  | "target"
  | "clock"
  | "sparkles"
  | "trendingUp"
  | "zap"
  | "heart";

export type ConsultationVariant = {
  slug: string;
  metaTitle: string;
  metaDescription: string;
  badge: string;
  headlineTop: string;
  headlineBottom: string;
  sub: string;
  painsLabel: string;
  painsTitle: string;
  pains: string[];
  painsCalloutTitle: string;
  painsCalloutBody: string;
  beforeAfterTitle: string;
  beforeAfter: { before: string; after: string }[];
  whatYouGetTitle: string;
  whatYouGetSub: string;
  whatYouGet: { icon: ConsultationIconName; title: string; desc: string }[];
  testimonialsTitle: string;
  testimonials: {
    initial: string;
    name: string;
    city: string;
    tag: string;
    stars: number;
    text: string;
    outcome: string;
  }[];
  faqs: { q: string; a: string }[];
  finalCtaTop: string;
  finalCtaBottom: string;
  finalCtaSub: string;
};

const GENERIC: ConsultationVariant = {
  slug: "general",
  metaTitle: "Personal Consultation",
  metaDescription:
    "Book a private Vedic astrology session with AstroGuru Ashutosh — 15 or 45 minute packages, personalized kundli report, and clear guidance.",
  badge: "Personal Consultation · AstroGuru Ashutosh",
  headlineTop: "Direct Chat or Call",
  headlineBottom: "with AstroGuru Ashutosh",
  sub: "Aapki kundli mein ek pattern chhupa hai. Ek session — exact jawab milega: kya, kyun, aur kab badlega.",
  painsLabel: "Pehchante ho?",
  painsTitle: "Kya Yeh Aapke Saath Hota Hai?",
  pains: [
    "Mehnat karte ho — phir bhi kuch ruka hua lagta hai",
    "Career mein clarity nahi — agla step kaunsa hai?",
    "Rishton mein same problems baar baar aati hain",
    "Bade decisions mein darr — sahi time hai ya nahi?",
    "Paisa aata hai, rukta nahi — flow nahi ban raha",
  ],
  painsCalloutTitle: "Yeh sirf aapki galti nahi.",
  painsCalloutBody:
    "Yeh aapki kundli ka pattern hai — jo in sab ko influence kar raha hai. Ek session mein pattern clear. Exact kya, kyun, aur kab badlega.",
  beforeAfterTitle: "Ek Session Ke Baad",
  beforeAfter: [
    { before: "Direction clear nahi", after: "Exact next step pata hai" },
    { before: "Same mistakes baar baar", after: "Pattern samajh — cycle khatam" },
    { before: "Decision mein darr lagta hai", after: "Timing ke saath — confident" },
    { before: "Kab badlega, pata nahi", after: "Exact window clear hai" },
  ],
  whatYouGetTitle: "Sirf Aap Par — Poora Focus",
  whatYouGetSub: "Koi script nahi. Koi generic advice nahi. Aapki chart, aapki situation.",
  whatYouGet: [
    { icon: "target", title: "Exact pattern identify hoga", desc: "Career, rishte, paisa — kahan energy stuck hai, exactly." },
    { icon: "clock", title: "Timing clear", desc: "Kab badlega — months ya years mein, specific number." },
    { icon: "sparkles", title: "Planetary period analysis", desc: "Abhi kaunsa period chal raha hai, life pe practical impact." },
    { icon: "trendingUp", title: "Actionable next steps", desc: "Sirf suno nahi — exact karo kya karna hai." },
    { icon: "zap", title: "Simple, effective remedies", desc: "Jo follow ho sake — overload bilkul nahi." },
    { icon: "heart", title: "Aapke sawaalon ke jawab", desc: "Jo poochna hai — seedha, honest jawab milega." },
  ],
  testimonialsTitle: "Unki Zindagi Badli — Ek Session Mein",
  testimonials: [
    {
      initial: "R", name: "Rahul K.", city: "Bangalore, 31", tag: "Career", stars: 5,
      text: "3 companies mein reject hua. Ashutosh ji ne bataya — agle 6 mahine struggle ka time hai, phir exact kya karna hai. Woh hua. 7 mahine mein solid role mil gaya.",
      outcome: "Job offer in 7 months",
    },
    {
      initial: "M", name: "Meera S.", city: "Pune, 28", tag: "Relationship", stars: 5,
      text: "Shaadi ke 2 saal baad bhi bahut tension tha. Session mein samjha — planetary period ka effect hai. Remedies follow ki. 1.5 saal ho gaye — ghar peaceful hai.",
      outcome: "Relationship stable",
    },
    {
      initial: "V", name: "Vikram T.", city: "Mumbai, 34", tag: "Business", stars: 5,
      text: "Business start karna tha, darr lag raha tha. Ashutosh ji ne exact window batai chart mein. Usi time pe start kiya. Pehle saal 30 lakh revenue. Timing ne kaam kiya.",
      outcome: "₹30L first year revenue",
    },
  ],
  faqs: [
    { q: "Kya main believe nahi karta — phir bhi session karna chahiye?", a: "Zaroor. Hamare zyaada clients pehle skeptical the. Ek baar aao, suno — phir decide karo khud. Ek useful insight bhi kaam aa jaaye toh ₹1,499 worth hai." },
    { q: "15-minute session mein kya cover hoga — waqt bahut kam lagta hai?", a: "Ek focused sawal, ek deep answer. Career ya rishte ya paisa — kisi ek area pe specifically jaate hain. Vague nahi hoga." },
    { q: "Kya exact birth time hona zaroori hai?", a: "Helpful hai, mandatory nahi. Approximate time bhi theek hai. Session mein bata dena — hum ussi ke saath kaam karte hain." },
    { q: "Kya reading scary ya negative hogi?", a: "Kabhi nahi. Hamare sessions fear nahi dete — clarity dete hain. Kya favor mein hai, kya navigate karna hai — practical guidance milti hai." },
  ],
  finalCtaTop: "Ek Session.",
  finalCtaBottom: "Saalon Ki Clarity.",
  finalCtaSub: "Bas janm ki details chahiye — baaki sab hum karte hain. 15 min se shuru karein — bilkul aapki chart ke saath.",
};

const RELATIONSHIP: ConsultationVariant = {
  slug: "relationship",
  metaTitle: "Relationship & Marriage Consultation",
  metaDescription:
    "Private Vedic astrology session for relationship & marriage clarity with AstroGuru Ashutosh — compatibility, timing, and practical remedies.",
  badge: "Relationship & Marriage Guidance · AstroGuru Ashutosh",
  headlineTop: "Apne Rishte Ki Sachai Jaaniye",
  headlineBottom: "AstroGuru Ashutosh Ke Saath",
  sub: "Rishta stuck lagta hai ya shaadi ki timing samajh nahi aa rahi? Ek session — exact jawab milega: kyun aisa ho raha hai, aur kab clarity aayegi.",
  painsLabel: "Pehchante ho?",
  painsTitle: "Kya Yeh Aapke Rishte Mein Hota Hai?",
  pains: [
    "Same fights baar baar — wajah samajh nahi aati",
    "Shaadi ki baat chal rahi hai, par sahi time pata nahi",
    "Partner se distance badh raha hai — kyun, clear nahi",
    "Compatibility ko lekar doubt — sahi insaan hai ya nahi?",
    "Akela mahsoos karte ho — koi commit nahi kar raha",
  ],
  painsCalloutTitle: "Yeh sirf bad luck nahi.",
  painsCalloutBody:
    "Aapki kundli mein relationship pattern dikhta hai — partner compatibility, timing, aur blockages. Ek session mein clear: kya chal raha hai, aur shaadi/rishta kab smooth hoga.",
  beforeAfterTitle: "Ek Session Ke Baad",
  beforeAfter: [
    { before: "Rishte mein confusion", after: "Compatibility clear samajh" },
    { before: "Shaadi ki timing pata nahi", after: "Exact favorable window mila" },
    { before: "Same fights repeat hote", after: "Root cause clear — solve ho saka" },
    { before: "Commitment ka darr", after: "Confidence ke saath decision" },
  ],
  whatYouGetTitle: "Sirf Aapke Rishte Par — Poora Focus",
  whatYouGetSub: "Koi generic compatibility match nahi. Aapki chart, aapka rishta, specific guidance.",
  whatYouGet: [
    { icon: "heart", title: "Compatibility analysis", desc: "Partner ke saath kundli match — kahan strong hai, kahan friction." },
    { icon: "clock", title: "Shaadi ki timing", desc: "Kab favorable hai — specific period, exact number ke saath." },
    { icon: "sparkles", title: "Dosh aur blockages", desc: "Manglik ya doshas ka effect — practical, fear-free explanation." },
    { icon: "target", title: "Pattern identify hoga", desc: "Same fights baar baar kyun — exact karan samjhayenge." },
    { icon: "zap", title: "Simple remedies", desc: "Relationship ke liye specific, follow-karne layak upay." },
    { icon: "trendingUp", title: "Aage ka raasta", desc: "Decision lena hai ya wait — clear direction milegi." },
  ],
  testimonialsTitle: "Unka Rishta Badla — Ek Session Mein",
  testimonials: [
    {
      initial: "M", name: "Meera S.", city: "Pune, 28", tag: "Marriage", stars: 5,
      text: "Shaadi ke 2 saal baad bhi bahut tension tha. Session mein samjha — planetary period ka effect hai. Remedies follow ki. 1.5 saal ho gaye — ghar peaceful hai.",
      outcome: "Relationship stable",
    },
    {
      initial: "A", name: "Ananya P.", city: "Delhi, 26", tag: "Relationship", stars: 5,
      text: "3 saal ka relationship tha, commitment nahi mil raha tha. Ashutosh ji ne exact timing batayi — 4 mahine baad proposal aa gaya.",
      outcome: "Engaged in 4 months",
    },
    {
      initial: "S", name: "Sandeep R.", city: "Jaipur, 33", tag: "Marriage Timing", stars: 5,
      text: "Family pressure tha shaadi ke liye, par sahi time nahi pata tha. Chart se exact window mili. Wahi time pe rishta hua aur ab dono khush hain.",
      outcome: "Married within the window",
    },
  ],
  faqs: [
    { q: "Kya aap match-making bhi karte ho?", a: "Haan, partner ki details ke saath compatibility discuss kar sakte hain. Bina partner details ke bhi aapki apni chart se relationship pattern clear ho jata hai." },
    { q: "Kya Manglik dosh sach mein problem deta hai?", a: "Effect hota hai, lekin remedies se manage ho jata hai. Session mein fear nahi — practical solution milega." },
    { q: "Breakup ho gaya hai — kya wapas aane ka chance dekh sakte ho?", a: "Chart se current period aur possibility discuss kar sakte hain. Honest answer milega — chahe positive ho ya nahi." },
    { q: "Shaadi ki exact date bhi bata sakte ho?", a: "Favorable period/window batate hain — exact muhurta ke liye 45 min session better hai jisme detailed timing cover hoti hai." },
  ],
  finalCtaTop: "Apna Rishta.",
  finalCtaBottom: "Apni Clarity.",
  finalCtaSub: "Bas janm ki details chahiye — partner ki bhi ho toh better. 15 min se shuru karein — seedha apne rishte ke baare mein.",
};

const CAREER: ConsultationVariant = {
  slug: "career",
  metaTitle: "Career & Job Consultation",
  metaDescription:
    "Private Vedic astrology session for career clarity with AstroGuru Ashutosh — job timing, growth blockages, and practical next steps.",
  badge: "Career & Job Guidance · AstroGuru Ashutosh",
  headlineTop: "Apna Career Direction Jaaniye",
  headlineBottom: "AstroGuru Ashutosh Ke Saath",
  sub: "Job stuck lagti hai ya growth ruki hui? Ek session — exact jawab milega: kya blockage hai, aur kab move karna hai.",
  painsLabel: "Pehchante ho?",
  painsTitle: "Kya Yeh Aapke Career Mein Hota Hai?",
  pains: [
    "Mehnat poori karte ho — promotion phir bhi nahi aati",
    "Job switch karna hai, par sahi time confusion mein hai",
    "Interviews clear nahi ho rahe — wajah samajh nahi aati",
    "Business start karna hai, darr lag raha hai",
    "Colleagues aage badh gaye, aap wahi atke ho",
  ],
  painsCalloutTitle: "Yeh sirf effort ki kami nahi.",
  painsCalloutBody:
    "Aapki kundli mein career ka pattern dikhta hai — kab growth hai, kab patience chahiye. Ek session mein clear: exact kya blockage hai, aur kab momentum aayega.",
  beforeAfterTitle: "Ek Session Ke Baad",
  beforeAfter: [
    { before: "Career direction clear nahi", after: "Exact next move pata hai" },
    { before: "Job switch ka sahi time pata nahi", after: "Favorable window clear" },
    { before: "Growth kyun ruki, samajh nahi", after: "Period ka effect samajh" },
    { before: "Business shuru karne ka darr", after: "Timing ke saath confidence" },
  ],
  whatYouGetTitle: "Sirf Aapke Career Par — Poora Focus",
  whatYouGetSub: "Koi generic career advice nahi. Aapki chart, aapki professional situation.",
  whatYouGet: [
    { icon: "target", title: "Career pattern identify hoga", desc: "Growth kahan stuck hai, exactly — chart ke through." },
    { icon: "clock", title: "Job switch ki timing", desc: "Kab move karna favorable hai — specific period, exact number." },
    { icon: "sparkles", title: "Current period analysis", desc: "Abhi kaunsa planetary period chal raha hai, career pe impact." },
    { icon: "trendingUp", title: "Growth ke actionable steps", desc: "Sirf suno nahi — exact karo kya karna hai career mein." },
    { icon: "zap", title: "Business/job decision clarity", desc: "Switch karna ya start karna — chart-based honest opinion." },
    { icon: "heart", title: "Aapke career sawaalon ke jawab", desc: "Specific role, company, ya offer — direct jawab." },
  ],
  testimonialsTitle: "Unka Career Badla — Ek Session Mein",
  testimonials: [
    {
      initial: "R", name: "Rahul K.", city: "Bangalore, 31", tag: "Career", stars: 5,
      text: "3 companies mein reject hua. Ashutosh ji ne bataya — agle 6 mahine struggle ka time hai, phir exact kya karna hai. Woh hua. 7 mahine mein solid role mil gaya.",
      outcome: "Job offer in 7 months",
    },
    {
      initial: "V", name: "Vikram T.", city: "Mumbai, 34", tag: "Business", stars: 5,
      text: "Business start karna tha, darr lag raha tha. Ashutosh ji ne exact window batai chart mein. Usi time pe start kiya. Pehle saal 30 lakh revenue. Timing ne kaam kiya.",
      outcome: "₹30L first year revenue",
    },
    {
      initial: "N", name: "Nikhil D.", city: "Hyderabad, 29", tag: "Promotion", stars: 5,
      text: "2 saal se promotion atki thi. Session mein pata chala — period change hone wala tha. 5 mahine mein promotion mil gaya, exactly jaisa bataya tha.",
      outcome: "Promotion in 5 months",
    },
  ],
  faqs: [
    { q: "Kya aap specific company/offer ke baare mein bata sakte ho?", a: "Haan, specific situation discuss karke timing aur favorability ka honest opinion milega." },
    { q: "Job switch karna chahiye ya stay karna chahiye?", a: "Aapki chart ke current period ke hisaab se practical guidance milegi — risk aur timing dono cover hota hai." },
    { q: "Business start karne ka sahi time kaise pata chalega?", a: "Chart mein favorable periods dikhte hain. 45 min session mein detailed timing aur muhurta discuss ho sakta hai." },
    { q: "Kya yeh sirf job ke liye hai ya business ke liye bhi?", a: "Dono ke liye. Job, switch, promotion, business — career se related koi bhi sawal le sakte hain." },
  ],
  finalCtaTop: "Apna Career.",
  finalCtaBottom: "Apni Clarity.",
  finalCtaSub: "Bas janm ki details chahiye — baaki sab hum karte hain. 15 min se shuru karein — seedha apne career ke baare mein.",
};

export const CONSULTATION_VARIANTS: Record<string, ConsultationVariant> = {
  relationship: RELATIONSHIP,
  career: CAREER,
};

export const DEFAULT_CONSULTATION_VARIANT = GENERIC;

export function getConsultationVariant(slug: string): ConsultationVariant | null {
  return CONSULTATION_VARIANTS[slug] ?? null;
}
