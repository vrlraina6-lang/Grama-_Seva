import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Lang = "en" | "ta";

type I18nCtx = {
  lang: Lang;
  setLang: (l: Lang) => void;
  toggle: () => void;
  t: (key: keyof typeof dict.en) => string;
};

const dict = {
  en: {
    appName: "GramaSeva",
    tagline: "One QR. One Village. One Voice.",
    heroLead:
      "A digital panchayat in your pocket — notices, water timings, complaints and government schemes for every village in Tamil Nadu.",
    findVillage: "Find your village",
    searchPlaceholder: "Search by village, district or pincode…",
    openDashboard: "Open dashboard",
    population: "Population",
    president: "Panchayat President",
    pincode: "Pincode",
    quickActions: "Quick actions",
    reportIssue: "Report an issue",
    reportIssueSub: "Pothole, garbage, streetlight",
    checkSchemes: "Check scheme eligibility",
    checkSchemesSub: "See what you qualify for",
    waterSchedule: "Today's water supply",
    waterScheduleSub: "Timings ward-by-ward",
    notices: "Notices",
    noticesSub: "Latest from the panchayat",
    noticeBoard: "Notice board",
    viewAll: "View all",
    wardMap: "Ward issue map",
    wardMapSub: "Pending • In progress • Resolved",
    voiceSearch: "Speak to search",
    languageToggle: "தமிழ்",
    share: "Share on WhatsApp",
    close: "Close",
    pending: "Pending",
    inProgress: "In progress",
    resolved: "Resolved",
    morning: "Morning",
    evening: "Evening",
    categoryWater: "Water",
    categoryHealth: "Health",
    categoryEvent: "Event",
    categoryScheme: "Scheme",
    categoryGeneral: "General",
    backHome: "All villages",
    featured: "Featured villages",
    why: "Built for rural Tamil Nadu",
    whySub:
      "Works offline. Speaks Tamil. Designed for grandmothers and college students alike.",
    f1: "Scan one QR",
    f1d: "Every village gets a unique code. No app install, no login needed.",
    f2: "Speak in Tamil",
    f2d: "Tap the mic and ask in Tamil. Built-in voice search for notices and schemes.",
    f3: "Works offline",
    f3d: "Cached notices and schedules stay readable when the network drops.",
    f4: "Track complaints",
    f4d: "Snap a photo. See your complaint move from pending to resolved on a live map.",
    footerNote: "An open civic platform. MIT licensed. Built with the village in mind.",
  },
  ta: {
    appName: "கிராமசேவை",
    tagline: "ஒரே QR. ஒரே கிராமம். ஒரே குரல்.",
    heroLead:
      "உங்கள் கைகளில் ஒரு டிஜிட்டல் பஞ்சாயத்து — அறிவிப்புகள், குடிநீர் நேரம், புகார்கள் மற்றும் தமிழ்நாட்டில் உள்ள ஒவ்வொரு கிராமத்திற்கான அரசுத் திட்டங்கள்.",
    findVillage: "உங்கள் கிராமத்தைத் தேடுங்கள்",
    searchPlaceholder: "கிராமம், மாவட்டம் அல்லது பின்கோடு மூலம் தேடுங்கள்…",
    openDashboard: "டாஷ்போர்டைத் திற",
    population: "மக்கள் தொகை",
    president: "பஞ்சாயத்து தலைவர்",
    pincode: "பின்கோடு",
    quickActions: "விரைவு செயல்கள்",
    reportIssue: "புகார் அளி",
    reportIssueSub: "பள்ளம், குப்பை, தெரு விளக்கு",
    checkSchemes: "திட்ட தகுதி சரிபார்",
    checkSchemesSub: "நீங்கள் எதற்கு தகுதி பெற்றுள்ளீர்கள்",
    waterSchedule: "இன்றைய குடிநீர் வழங்கல்",
    waterScheduleSub: "வார்டு வாரியான நேரம்",
    notices: "அறிவிப்புகள்",
    noticesSub: "பஞ்சாயத்தின் சமீபத்திய தகவல்கள்",
    noticeBoard: "அறிவிப்பு பலகை",
    viewAll: "அனைத்தையும் பார்",
    wardMap: "வார்டு புகார் வரைபடம்",
    wardMapSub: "நிலுவையில் • செயல்பாட்டில் • தீர்க்கப்பட்டது",
    voiceSearch: "பேசி தேடு",
    languageToggle: "English",
    share: "வாட்ஸ்அப்பில் பகிர்",
    close: "மூடு",
    pending: "நிலுவையில்",
    inProgress: "செயல்பாட்டில்",
    resolved: "தீர்க்கப்பட்டது",
    morning: "காலை",
    evening: "மாலை",
    categoryWater: "நீர்",
    categoryHealth: "சுகாதாரம்",
    categoryEvent: "நிகழ்வு",
    categoryScheme: "திட்டம்",
    categoryGeneral: "பொது",
    backHome: "அனைத்து கிராமங்கள்",
    featured: "சிறப்பு கிராமங்கள்",
    why: "தமிழ்நாட்டின் கிராமங்களுக்காக உருவாக்கப்பட்டது",
    whySub:
      "ஆஃப்லைனிலும் வேலை செய்கிறது. தமிழ் பேசுகிறது. பாட்டிக்கும் கல்லூரி மாணவருக்கும் ஏற்றது.",
    f1: "ஒரே QR ஸ்கேன்",
    f1d: "ஒவ்வொரு கிராமத்திற்கும் தனி குறியீடு. ஆப் நிறுவல் தேவையில்லை.",
    f2: "தமிழில் பேசு",
    f2d: "மைக்கைத் தொட்டு தமிழில் கேளுங்கள். அறிவிப்புகள் மற்றும் திட்டங்களுக்கான குரல் தேடல்.",
    f3: "ஆஃப்லைன் ஆதரவு",
    f3d: "நெட் இல்லாத போதும் சேமிக்கப்பட்ட தகவல்கள் தெரியும்.",
    f4: "புகார்களைக் கண்காணி",
    f4d: "புகைப்படம் எடு. உங்கள் புகார் நிலையை நேரடி வரைபடத்தில் பார்.",
    footerNote: "திறந்த குடிமை தளம். MIT உரிமம். கிராமத்திற்காக உருவாக்கப்பட்டது.",
  },
} as const;

const Ctx = createContext<I18nCtx | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("gramaseva.lang") as Lang | null;
      if (saved === "en" || saved === "ta") setLangState(saved);
    } catch {}
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem("gramaseva.lang", l);
      document.documentElement.lang = l;
    } catch {}
  };

  const value: I18nCtx = {
    lang,
    setLang,
    toggle: () => setLang(lang === "en" ? "ta" : "en"),
    t: (key) => dict[lang][key] ?? dict.en[key] ?? String(key),
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useI18n() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}

export function bi<T extends { en: string; ta: string }>(obj: T, lang: Lang) {
  return obj[lang];
}
