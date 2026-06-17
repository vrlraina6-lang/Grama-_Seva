import { useEffect, useMemo, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useI18n, bi, type Lang } from "@/lib/i18n";
import { toast } from "sonner";
import type { Village, Notice } from "@/data/villages";
import {
  Camera,
  ShieldCheck,
  Droplets,
  Megaphone,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Upload,
  Share2,
  Bell,
} from "lucide-react";

type ActionKey = "report" | "schemes" | "water" | "notices";

const cardCopy = {
  en: {
    report: { title: "Report an issue", sub: "Pothole, garbage, streetlight" },
    schemes: { title: "Check scheme eligibility", sub: "See what you qualify for" },
    water: { title: "Today's water supply", sub: "Timings ward-by-ward" },
    notices: { title: "Notices", sub: "Latest from the panchayat" },
  },
  ta: {
    report: { title: "புகார் அளி", sub: "பள்ளம், குப்பை, தெரு விளக்கு" },
    schemes: { title: "திட்ட தகுதி சரிபார்", sub: "நீங்கள் எதற்கு தகுதி பெற்றுள்ளீர்கள்" },
    water: { title: "இன்றைய குடிநீர் வழங்கல்", sub: "வார்டு வாரியான நேரம்" },
    notices: { title: "அறிவிப்புகள்", sub: "பஞ்சாயத்தின் சமீபத்திய தகவல்கள்" },
  },
} as const;

export function QuickActions({ village }: { village: Village }) {
  const { lang } = useI18n();
  const [open, setOpen] = useState<ActionKey | null>(null);
  const copy = cardCopy[lang];

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card
          icon={Camera}
          title={copy.report.title}
          sub={copy.report.sub}
          tone="primary"
          onClick={() => setOpen("report")}
        />
        <Card
          icon={ShieldCheck}
          title={copy.schemes.title}
          sub={copy.schemes.sub}
          tone="gold"
          onClick={() => setOpen("schemes")}
        />
        <Card
          icon={Droplets}
          title={copy.water.title}
          sub={copy.water.sub}
          onClick={() => setOpen("water")}
        />
        <Card
          icon={Megaphone}
          title={copy.notices.title}
          sub={copy.notices.sub}
          onClick={() => setOpen("notices")}
        />
      </div>

      <ReportDialog open={open === "report"} onOpenChange={(o) => !o && setOpen(null)} village={village} lang={lang} />
      <SchemesDialog open={open === "schemes"} onOpenChange={(o) => !o && setOpen(null)} lang={lang} />
      <WaterDialog open={open === "water"} onOpenChange={(o) => !o && setOpen(null)} village={village} lang={lang} />
      <NoticesDialog open={open === "notices"} onOpenChange={(o) => !o && setOpen(null)} village={village} lang={lang} />
    </>
  );
}

function Card({
  icon: Icon,
  title,
  sub,
  tone = "default",
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  sub: string;
  tone?: "primary" | "gold" | "default";
  onClick: () => void;
}) {
  const toneCls =
    tone === "primary"
      ? "bg-primary text-primary-foreground border-primary"
      : tone === "gold"
        ? "bg-[color:var(--gold-raw)] text-[color:var(--gold-foreground)] border-[color:var(--gold-raw)]"
        : "bg-card text-card-foreground border-border";
  const iconCls = tone === "default" ? "bg-secondary text-accent" : "bg-black/10 text-current";
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative overflow-hidden rounded-xl border p-5 text-left transition-all hover:-translate-y-0.5 hover:shadow-xl ${toneCls}`}
    >
      <span className={`grid h-11 w-11 place-items-center rounded-lg ${iconCls}`}>
        <Icon className="h-5 w-5" />
      </span>
      <p className="mt-5 font-display text-lg">{title}</p>
      <p className="mt-1 text-sm opacity-80">{sub}</p>
      <ChevronRight className="absolute right-4 top-5 h-4 w-4 opacity-50 transition-transform group-hover:translate-x-1" />
    </button>
  );
}

/* ============== REPORT AN ISSUE ============== */

type LocalComplaint = {
  id: string;
  villageSlug: string;
  type: string;
  ward: string;
  description: string;
  photo?: string;
  status: "pending" | "in_progress" | "resolved";
  reportedAt: string;
};

const ISSUE_TYPES = [
  { en: "Pothole", ta: "பள்ளம்" },
  { en: "Garbage", ta: "குப்பை" },
  { en: "Streetlight", ta: "தெரு விளக்கு" },
  { en: "Water leak", ta: "நீர் கசிவு" },
  { en: "Drainage", ta: "வடிகால்" },
  { en: "Other", ta: "மற்றவை" },
];

function loadComplaints(slug: string): LocalComplaint[] {
  try {
    const raw = localStorage.getItem("gramaseva.complaints");
    if (!raw) return [];
    return (JSON.parse(raw) as LocalComplaint[]).filter((c) => c.villageSlug === slug);
  } catch {
    return [];
  }
}

function saveComplaint(c: LocalComplaint) {
  try {
    const raw = localStorage.getItem("gramaseva.complaints");
    const all: LocalComplaint[] = raw ? JSON.parse(raw) : [];
    all.unshift(c);
    localStorage.setItem("gramaseva.complaints", JSON.stringify(all));
  } catch {}
}

function ReportDialog({
  open,
  onOpenChange,
  village,
  lang,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  village: Village;
  lang: Lang;
}) {
  const [type, setType] = useState(ISSUE_TYPES[0].en);
  const [ward, setWard] = useState(village.waterSchedule[0]?.ward ?? "Ward 1");
  const [desc, setDesc] = useState("");
  const [photo, setPhoto] = useState<string | undefined>();
  const fileRef = useRef<HTMLInputElement>(null);
  const [mine, setMine] = useState<LocalComplaint[]>([]);

  useEffect(() => {
    if (open) setMine(loadComplaints(village.slug));
  }, [open, village.slug]);

  const onFile = (f: File | undefined) => {
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => setPhoto(reader.result as string);
    reader.readAsDataURL(f);
  };

  const submit = () => {
    if (!desc.trim()) {
      toast.error(lang === "en" ? "Please describe the issue" : "புகாரை விவரிக்கவும்");
      return;
    }
    const c: LocalComplaint = {
      id: `local-${Date.now()}`,
      villageSlug: village.slug,
      type,
      ward,
      description: desc.trim(),
      photo,
      status: "pending",
      reportedAt: new Date().toISOString(),
    };
    saveComplaint(c);
    setMine([c, ...mine]);
    setDesc("");
    setPhoto(undefined);
    toast.success(
      lang === "en"
        ? `Complaint #${c.id.slice(-4)} submitted`
        : `புகார் #${c.id.slice(-4)} பதிவாகியது`,
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">
            {lang === "en" ? "Report an issue" : "புகார் அளி"}
          </DialogTitle>
          <DialogDescription>
            {lang === "en"
              ? `Submit a civic complaint for ${village.name.en}. Stays offline if no network.`
              : `${village.name.ta}-க்கான குடிமை புகாரை சமர்ப்பிக்கவும். நெட் இல்லாதபோதும் சேமிக்கப்படும்.`}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label>{lang === "en" ? "Issue type" : "புகார் வகை"}</Label>
            <div className="flex flex-wrap gap-2">
              {ISSUE_TYPES.map((it) => (
                <button
                  key={it.en}
                  type="button"
                  onClick={() => setType(it.en)}
                  className={`rounded-full border px-3 py-1.5 text-sm transition ${
                    type === it.en
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card text-card-foreground hover:border-primary/50"
                  }`}
                >
                  {bi(it, lang)}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="ward">{lang === "en" ? "Ward" : "வார்டு"}</Label>
            <select
              id="ward"
              value={ward}
              onChange={(e) => setWard(e.target.value)}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              {village.waterSchedule.map((w) => (
                <option key={w.ward} value={w.ward}>
                  {w.ward}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="desc">{lang === "en" ? "Description" : "விவரம்"}</Label>
            <Textarea
              id="desc"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder={lang === "en" ? "Where and what is the problem?" : "எங்கே, என்ன பிரச்சனை?"}
              rows={3}
            />
          </div>

          <div className="grid gap-2">
            <Label>{lang === "en" ? "Photo" : "புகைப்படம்"}</Label>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => onFile(e.target.files?.[0])}
            />
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  if (fileRef.current) {
                    fileRef.current.setAttribute("capture", "environment");
                    fileRef.current.click();
                  }
                }}
              >
                <Camera className="mr-2 h-4 w-4" />
                {lang === "en" ? "Take photo" : "புகைப்படம் எடு"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  if (fileRef.current) {
                    fileRef.current.removeAttribute("capture");
                    fileRef.current.click();
                  }
                }}
              >
                <Upload className="mr-2 h-4 w-4" />
                {lang === "en" ? "Upload" : "பதிவேற்று"}
              </Button>
            </div>
            {photo && (
              <img src={photo} alt="preview" className="mt-2 max-h-40 rounded-md border border-border object-cover" />
            )}
          </div>
        </div>

        {mine.length > 0 && (
          <div className="mt-4 border-t border-border pt-4">
            <p className="mb-2 text-sm font-medium">
              {lang === "en" ? "Your recent complaints" : "உங்கள் சமீபத்திய புகார்கள்"}
            </p>
            <ul className="space-y-2 max-h-48 overflow-y-auto">
              {mine.map((c) => (
                <li key={c.id} className="flex items-center justify-between gap-2 rounded-md border border-border p-2 text-sm">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{c.type} · {c.ward}</p>
                    <p className="text-xs text-muted-foreground truncate">{c.description}</p>
                  </div>
                  <Badge variant={c.status === "resolved" ? "default" : "secondary"} className="shrink-0">
                    {c.status}
                  </Badge>
                </li>
              ))}
            </ul>
          </div>
        )}

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            {lang === "en" ? "Close" : "மூடு"}
          </Button>
          <Button onClick={submit}>{lang === "en" ? "Submit complaint" : "புகார் சமர்ப்பி"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ============== SCHEMES ============== */

type SchemeAnswer = {
  age: number;
  gender: "male" | "female" | "other";
  income: number; // annual ₹
  isFarmer: boolean;
  hasLand: boolean;
  isStudent: boolean;
  hasRationCard: boolean;
};

type Scheme = {
  id: string;
  name: { en: string; ta: string };
  benefit: { en: string; ta: string };
  eligible: (a: SchemeAnswer) => boolean;
  reasonNo: { en: string; ta: string };
};

const SCHEMES: Scheme[] = [
  {
    id: "pmkisan",
    name: { en: "PM-KISAN", ta: "பிஎம்-கிசான்" },
    benefit: { en: "₹6,000/year to small farmers", ta: "சிறு விவசாயிகளுக்கு ஆண்டுக்கு ₹6,000" },
    eligible: (a) => a.isFarmer && a.hasLand,
    reasonNo: { en: "Requires landholding farmer", ta: "நிலம் வைத்த விவசாயி தேவை" },
  },
  {
    id: "ujjwala",
    name: { en: "PM Ujjwala Yojana", ta: "பிஎம் உஜ்வலா யோஜனா" },
    benefit: { en: "Free LPG connection", ta: "இலவச எல்பிஜி இணைப்பு" },
    eligible: (a) => a.gender === "female" && a.income < 200000,
    reasonNo: { en: "For women in low-income households", ta: "குறைந்த வருமான பெண்களுக்கு" },
  },
  {
    id: "vidhwa",
    name: { en: "Old Age Pension", ta: "முதியோர் ஓய்வூதியம்" },
    benefit: { en: "₹1,000/month pension", ta: "மாதம் ₹1,000 ஓய்வூதியம்" },
    eligible: (a) => a.age >= 60 && a.income < 100000,
    reasonNo: { en: "Age 60+ with low income", ta: "60+ வயது, குறைந்த வருமானம்" },
  },
  {
    id: "scholarship",
    name: { en: "TN Student Scholarship", ta: "தமிழ்நாடு மாணவர் உதவித்தொகை" },
    benefit: { en: "Tuition + book grants", ta: "கல்விக்கட்டணம் + புத்தக உதவி" },
    eligible: (a) => a.isStudent && a.age < 25 && a.income < 250000,
    reasonNo: { en: "Students under 25 from low-income families", ta: "25-க்கு கீழ் குறைந்த வருமான மாணவர்கள்" },
  },
  {
    id: "amma",
    name: { en: "Amma Maternity Benefit", ta: "அம்மா மகப்பேறு திட்டம்" },
    benefit: { en: "₹18,000 maternity assistance", ta: "₹18,000 மகப்பேறு உதவி" },
    eligible: (a) => a.gender === "female" && a.age >= 19 && a.age <= 45 && a.income < 200000,
    reasonNo: { en: "Women 19–45, low income", ta: "19–45 வயது பெண்கள், குறைந்த வருமானம்" },
  },
  {
    id: "ration",
    name: { en: "PDS Subsidised Rice", ta: "பொது விநியோக அரிசி" },
    benefit: { en: "Free / subsidised rice", ta: "இலவச / மானிய அரிசி" },
    eligible: (a) => a.hasRationCard,
    reasonNo: { en: "Requires a TN ration card", ta: "தமிழ்நாடு ரேஷன் கார்டு தேவை" },
  },
];

function SchemesDialog({
  open,
  onOpenChange,
  lang,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  lang: Lang;
}) {
  const [a, setA] = useState<SchemeAnswer>({
    age: 35,
    gender: "female",
    income: 120000,
    isFarmer: false,
    hasLand: false,
    isStudent: false,
    hasRationCard: true,
  });
  const [checked, setChecked] = useState(false);

  const results = useMemo(() => SCHEMES.map((s) => ({ s, ok: s.eligible(a) })), [a]);
  const eligibleCount = results.filter((r) => r.ok).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">
            {lang === "en" ? "Check scheme eligibility" : "திட்ட தகுதி சரிபார்"}
          </DialogTitle>
          <DialogDescription>
            {lang === "en"
              ? "Answer a few questions — rule-based, runs in your browser."
              : "சில கேள்விகளுக்கு பதிலளி — உங்கள் உலாவியில் இயங்குகிறது."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label>{lang === "en" ? "Age" : "வயது"}</Label>
            <Input
              type="number"
              value={a.age}
              onChange={(e) => setA({ ...a, age: Number(e.target.value) || 0 })}
            />
          </div>
          <div className="grid gap-2">
            <Label>{lang === "en" ? "Gender" : "பாலினம்"}</Label>
            <select
              value={a.gender}
              onChange={(e) => setA({ ...a, gender: e.target.value as SchemeAnswer["gender"] })}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="female">{lang === "en" ? "Female" : "பெண்"}</option>
              <option value="male">{lang === "en" ? "Male" : "ஆண்"}</option>
              <option value="other">{lang === "en" ? "Other" : "மற்றவை"}</option>
            </select>
          </div>
          <div className="grid gap-2 sm:col-span-2">
            <Label>{lang === "en" ? "Annual household income (₹)" : "ஆண்டு குடும்ப வருமானம் (₹)"}</Label>
            <Input
              type="number"
              value={a.income}
              onChange={(e) => setA({ ...a, income: Number(e.target.value) || 0 })}
            />
          </div>
          <CheckRow label={lang === "en" ? "I am a farmer" : "நான் விவசாயி"} checked={a.isFarmer} onChange={(v) => setA({ ...a, isFarmer: v })} />
          <CheckRow label={lang === "en" ? "I own agricultural land" : "எனக்கு விவசாய நிலம் உள்ளது"} checked={a.hasLand} onChange={(v) => setA({ ...a, hasLand: v })} />
          <CheckRow label={lang === "en" ? "I am a student" : "நான் மாணவர்"} checked={a.isStudent} onChange={(v) => setA({ ...a, isStudent: v })} />
          <CheckRow label={lang === "en" ? "I have a TN ration card" : "என்னிடம் தமிழ்நாடு ரேஷன் கார்டு உள்ளது"} checked={a.hasRationCard} onChange={(v) => setA({ ...a, hasRationCard: v })} />
        </div>

        {checked && (
          <div className="mt-4 border-t border-border pt-4">
            <p className="mb-3 text-sm font-medium">
              {lang === "en"
                ? `You qualify for ${eligibleCount} of ${SCHEMES.length} schemes`
                : `${SCHEMES.length}-ல் ${eligibleCount} திட்டங்களுக்கு தகுதி பெற்றுள்ளீர்கள்`}
            </p>
            <ul className="space-y-2">
              {results.map(({ s, ok }) => (
                <li
                  key={s.id}
                  className={`flex items-start gap-3 rounded-lg border p-3 ${
                    ok ? "border-emerald-500/30 bg-emerald-500/5" : "border-border bg-muted/30"
                  }`}
                >
                  {ok ? (
                    <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-600" />
                  ) : (
                    <XCircle className="mt-0.5 h-5 w-5 text-muted-foreground" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{bi(s.name, lang)}</p>
                    <p className="text-sm text-muted-foreground">{bi(s.benefit, lang)}</p>
                    {!ok && <p className="mt-1 text-xs text-muted-foreground italic">{bi(s.reasonNo, lang)}</p>}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            {lang === "en" ? "Close" : "மூடு"}
          </Button>
          <Button onClick={() => setChecked(true)}>
            {lang === "en" ? "Check eligibility" : "தகுதியை சரிபார்"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CheckRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 rounded-md border border-border bg-card p-3 text-sm">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 accent-[color:var(--emerald)]"
      />
      <span>{label}</span>
    </label>
  );
}

/* ============== WATER ============== */

function WaterDialog({
  open,
  onOpenChange,
  village,
  lang,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  village: Village;
  lang: Lang;
}) {
  const today = new Date().toLocaleDateString(lang === "ta" ? "ta-IN" : "en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl flex items-center gap-2">
            <Droplets className="h-5 w-5 text-accent" />
            {lang === "en" ? "Today's water supply" : "இன்றைய குடிநீர் வழங்கல்"}
          </DialogTitle>
          <DialogDescription>{today} · {bi(village.name, lang)}</DialogDescription>
        </DialogHeader>

        <div className="overflow-hidden rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-secondary text-secondary-foreground">
              <tr>
                <th className="px-4 py-2 text-left font-medium">{lang === "en" ? "Ward" : "வார்டு"}</th>
                <th className="px-4 py-2 text-left font-medium">{lang === "en" ? "Morning" : "காலை"}</th>
                <th className="px-4 py-2 text-left font-medium">{lang === "en" ? "Evening" : "மாலை"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {village.waterSchedule.map((w) => (
                <tr key={w.ward}>
                  <td className="px-4 py-2 font-medium">{w.ward}</td>
                  <td className="px-4 py-2 text-muted-foreground">{w.morning ?? "—"}</td>
                  <td className="px-4 py-2 text-muted-foreground">{w.evening ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              const lines = village.waterSchedule
                .map((w) => `${w.ward}: ${w.morning ?? "—"} / ${w.evening ?? "—"}`)
                .join("\n");
              const text = `${lang === "en" ? "Water supply" : "குடிநீர்"} · ${village.name.en}\n${lines}`;
              const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
              window.open(url, "_blank");
            }}
          >
            <Share2 className="mr-2 h-4 w-4" />
            {lang === "en" ? "Share on WhatsApp" : "வாட்ஸ்அப்பில் பகிர்"}
          </Button>
          <Button onClick={() => onOpenChange(false)}>{lang === "en" ? "Done" : "முடிந்தது"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ============== NOTICES ============== */

const NOTICE_LABELS: Record<Notice["category"], { en: string; ta: string }> = {
  water: { en: "Water", ta: "நீர்" },
  health: { en: "Health", ta: "சுகாதாரம்" },
  event: { en: "Event", ta: "நிகழ்வு" },
  scheme: { en: "Scheme", ta: "திட்டம்" },
  general: { en: "General", ta: "பொது" },
};

function NoticesDialog({
  open,
  onOpenChange,
  village,
  lang,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  village: Village;
  lang: Lang;
}) {
  const speak = (text: string) => {
    try {
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = lang === "ta" ? "ta-IN" : "en-IN";
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utter);
    } catch {}
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-accent" />
            {lang === "en" ? "All notices" : "அனைத்து அறிவிப்புகள்"}
          </DialogTitle>
          <DialogDescription>{bi(village.name, lang)} · {village.notices.length}</DialogDescription>
        </DialogHeader>

        {village.notices.length === 0 ? (
          <p className="text-muted-foreground">{lang === "en" ? "No notices yet." : "அறிவிப்புகள் இல்லை."}</p>
        ) : (
          <ul className="space-y-3">
            {village.notices.map((n) => (
              <li key={n.id} className="rounded-lg border border-border bg-card p-4">
                <div className="flex items-center justify-between">
                  <Badge variant="secondary">{bi(NOTICE_LABELS[n.category], lang)}</Badge>
                  <time className="text-xs text-muted-foreground">
                    {new Date(n.date).toLocaleDateString(lang === "ta" ? "ta-IN" : "en-IN")}
                  </time>
                </div>
                <h4 className="mt-2 font-display text-lg">{bi(n.title, lang)}</h4>
                <p className="mt-1 text-sm text-muted-foreground">{bi(n.body, lang)}</p>
                <div className="mt-3 flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => speak(`${bi(n.title, lang)}. ${bi(n.body, lang)}`)}>
                    <Bell className="mr-1.5 h-3.5 w-3.5" />
                    {lang === "en" ? "Read aloud" : "சத்தமாக படி"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const text = `${bi(n.title, lang)}\n\n${bi(n.body, lang)}\n\n— ${village.name.en} Panchayat`;
                      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
                    }}
                  >
                    <Share2 className="mr-1.5 h-3.5 w-3.5" />
                    {lang === "en" ? "Share" : "பகிர்"}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>{lang === "en" ? "Close" : "மூடு"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
