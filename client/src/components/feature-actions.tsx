import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { QrCode, Mic, WifiOff, MapPin, ArrowRight, Wifi, X, Camera, Loader2 } from "lucide-react";
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
import { useI18n, bi } from "@/lib/i18n";
import { searchVillages, villages, type Complaint, type Village } from "@/data/villages";

type CardKey = "qr" | "voice" | "offline" | "complaints";

const cardDefs: { key: CardKey; icon: typeof QrCode; titleEn: string; titleTa: string; descEn: string; descTa: string }[] = [
  {
    key: "qr",
    icon: QrCode,
    titleEn: "Scan one QR",
    titleTa: "ஒரு QR ஸ்கேன்",
    descEn: "Every village gets a unique code. No app install, no login needed.",
    descTa: "ஒவ்வொரு கிராமத்திற்கும் தனி குறியீடு. செயலி நிறுவல் இல்லை.",
  },
  {
    key: "voice",
    icon: Mic,
    titleEn: "Speak in Tamil",
    titleTa: "தமிழில் பேசுங்கள்",
    descEn: "Tap the mic and ask in Tamil. Built-in voice search for notices and schemes.",
    descTa: "மைக் தட்டி தமிழில் கேளுங்கள். அறிவிப்புகள் மற்றும் திட்டங்களுக்கான குரல் தேடல்.",
  },
  {
    key: "offline",
    icon: WifiOff,
    titleEn: "Works offline",
    titleTa: "ஆஃப்லைனில் வேலை செய்யும்",
    descEn: "Cached notices and schedules stay readable when the network drops.",
    descTa: "நெட்வொர்க் இல்லாதபோதும் அறிவிப்புகள் மற்றும் அட்டவணைகள் கிடைக்கும்.",
  },
  {
    key: "complaints",
    icon: MapPin,
    titleEn: "Track complaints",
    titleTa: "புகார்களைப் கண்காணி",
    descEn: "Snap a photo. See your complaint move from pending to resolved on a live map.",
    descTa: "புகைப்படம் எடுங்கள். உங்கள் புகார் தீர்க்கப்படும் வரை கண்காணியுங்கள்.",
  },
];

export function FeatureCards() {
  const { lang } = useI18n();
  const [open, setOpen] = useState<CardKey | null>(null);

  return (
    <>
      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {cardDefs.map(({ key, icon: Icon, titleEn, titleTa, descEn, descTa }) => (
          <button
            key={key}
            type="button"
            onClick={() => setOpen(key)}
            className="group text-left rounded-xl border border-border bg-card p-6 transition-all hover:-translate-y-0.5 hover:border-accent hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-accent"
          >
            <span className="grid h-11 w-11 place-items-center rounded-lg bg-primary text-primary-foreground transition-transform group-hover:scale-110">
              <Icon className="h-5 w-5" />
            </span>
            <p className={`mt-5 font-display text-lg text-foreground ${lang === "ta" ? "lang-ta" : ""}`}>
              {lang === "ta" ? titleTa : titleEn}
            </p>
            <p className={`mt-1 text-sm text-muted-foreground ${lang === "ta" ? "lang-ta" : ""}`}>
              {lang === "ta" ? descTa : descEn}
            </p>
            <span className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-accent opacity-0 transition-opacity group-hover:opacity-100">
              {lang === "ta" ? "திற" : "Open"} <ArrowRight className="h-3 w-3" />
            </span>
          </button>
        ))}
      </div>

      <QrDialog open={open === "qr"} onClose={() => setOpen(null)} />
      <VoiceDialog open={open === "voice"} onClose={() => setOpen(null)} />
      <OfflineDialog open={open === "offline"} onClose={() => setOpen(null)} />
      <ComplaintsDialog open={open === "complaints"} onClose={() => setOpen(null)} />
    </>
  );
}

/* ---------------- QR ---------------- */

function QrDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { lang } = useI18n();
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [manualCode, setManualCode] = useState("");

  useEffect(() => {
    if (!open) {
      stopCamera();
      setError(null);
      setInfo(null);
      setScanning(false);
      setManualCode("");
      return;
    }
    startCamera();
    return stopCamera;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function stopCamera() {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }

  async function startCamera() {
    setError(null);
    setInfo(null);
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setError(
        lang === "ta"
          ? "கேமரா ஆதரிக்கப்படவில்லை. கீழே குறியீடு/பின்கோடு உள்ளிடவும்."
          : "Camera not available. Enter a village code or pincode below.",
      );
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute("playsinline", "true");
        await videoRef.current.play();
      }
      setScanning(true);
      const jsQR = (await import("jsqr")).default;
      const canvas = canvasRef.current ?? document.createElement("canvas");
      canvasRef.current = canvas;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });

      const tick = () => {
        if (!streamRef.current || !videoRef.current || !ctx) return;
        const v = videoRef.current;
        if (v.readyState === v.HAVE_ENOUGH_DATA) {
          const w = v.videoWidth;
          const h = v.videoHeight;
          if (w && h) {
            canvas.width = w;
            canvas.height = h;
            ctx.drawImage(v, 0, 0, w, h);
            try {
              const img = ctx.getImageData(0, 0, w, h);
              const code = jsQR(img.data, w, h, { inversionAttempts: "dontInvert" });
              if (code?.data) {
                handleCode(code.data);
                return;
              }
            } catch {
              /* ignore */
            }
          }
        }
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    } catch {
      setError(
        lang === "ta"
          ? "கேமராவைத் திறக்க முடியவில்லை. கிராம பெயர் அல்லது பின்கோடு உள்ளிடவும்."
          : "Couldn't open camera. Enter a village name or pincode below.",
      );
    }
  }

  function resolveQuery(raw: string): Village | null {
    const q = raw.trim();
    if (!q) return null;
    // strip URL → take last segment
    const tail = q.split(/[/?#]/).filter(Boolean).pop() ?? q;
    const lower = tail.toLowerCase();
    // pincode (6 digits)
    if (/^\d{6}$/.test(tail)) {
      return villages.find((v) => v.pincode === tail) ?? null;
    }
    // slug match
    const bySlug = villages.find((v) => v.slug.toLowerCase() === lower);
    if (bySlug) return bySlug;
    // name match (en or ta)
    return (
      villages.find(
        (v) =>
          v.name.en.toLowerCase() === lower ||
          v.name.en.toLowerCase().includes(lower) ||
          v.name.ta.includes(q),
      ) ?? null
    );
  }

  function handleCode(raw: string) {
    const match = resolveQuery(raw);
    if (match) {
      stopCamera();
      setScanning(false);
      onClose();
      navigate({ to: "/v/$slug", params: { slug: match.slug } });
    } else {
      setInfo(null);
      setError(
        lang === "ta"
          ? `கிராமம் கண்டுபிடிக்கப்படவில்லை: ${raw}`
          : `No village found for: ${raw}`,
      );
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className={lang === "ta" ? "lang-ta" : ""}>
            {lang === "ta" ? "கிராம QR-ஐ ஸ்கேன் செய்யவும்" : "Scan a village QR"}
          </DialogTitle>
          <DialogDescription className={lang === "ta" ? "lang-ta" : ""}>
            {lang === "ta"
              ? "QR-ஐ காட்டவும், அல்லது கிராம பெயர்/பின்கோடு உள்ளிடவும்."
              : "Point camera at the village QR, or enter a village name or 6-digit pincode."}
          </DialogDescription>
        </DialogHeader>

        <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-secondary">
          <video ref={videoRef} className="h-full w-full object-cover" muted playsInline autoPlay />
          {!scanning && !error && (
            <div className="absolute inset-0 grid place-items-center text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          )}
          {scanning && (
            <div className="pointer-events-none absolute inset-6 rounded-lg border-2 border-[color:var(--gold-raw)]/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]" />
          )}
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}
        {info && <p className="text-sm text-muted-foreground">{info}</p>}

        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (manualCode.trim()) handleCode(manualCode);
          }}
        >
          <Input
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            placeholder={lang === "ta" ? "கடையம் அல்லது 627415" : "kadayam or 627415"}
            inputMode="text"
          />
          <Button type="submit" disabled={!manualCode.trim()}>
            {lang === "ta" ? "செல்" : "Go"}
          </Button>
        </form>

        <p className="text-xs text-muted-foreground">
          {lang === "ta" ? "முயற்சிக்க: " : "Try: "}
          {villages.map((v, i) => (
            <span key={v.slug}>
              <button
                className="underline hover:text-accent"
                onClick={() => handleCode(v.slug)}
              >
                {v.slug} ({v.pincode})
              </button>
              {i < villages.length - 1 ? ", " : ""}
            </span>
          ))}
        </p>
      </DialogContent>
    </Dialog>
  );
}

/* ---------------- Voice ---------------- */

export function useTamilVoice() {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const recRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    setSupported(!!SR);
  }, []);

  function start(lang: "ta-IN" | "en-IN" = "ta-IN") {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      setError("Speech recognition not supported in this browser.");
      return;
    }
    setError(null);
    setTranscript("");
    const rec = new SR();
    rec.lang = lang;
    rec.interimResults = true;
    rec.continuous = false;
    rec.onresult = (e: any) => {
      let txt = "";
      for (let i = 0; i < e.results.length; i++) txt += e.results[i][0].transcript;
      setTranscript(txt);
    };
    rec.onerror = (e: any) => {
      setError(e.error || "recognition error");
      setListening(false);
    };
    rec.onend = () => setListening(false);
    recRef.current = rec;
    rec.start();
    setListening(true);
  }

  function stop() {
    recRef.current?.stop();
    setListening(false);
  }

  return { supported, listening, transcript, error, start, stop, setTranscript };
}

function VoiceDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { lang } = useI18n();
  const navigate = useNavigate();
  const { supported, listening, transcript, error, start, stop } = useTamilVoice();
  const results = transcript ? searchVillages(transcript).slice(0, 5) : [];

  useEffect(() => {
    if (!open && listening) stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className={lang === "ta" ? "lang-ta" : ""}>
            {lang === "ta" ? "தமிழில் பேசுங்கள்" : "Speak in Tamil"}
          </DialogTitle>
          <DialogDescription className={lang === "ta" ? "lang-ta" : ""}>
            {lang === "ta"
              ? "மைக் பட்டனைத் தட்டி உங்கள் கிராமத்தின் பெயரைச் சொல்லுங்கள்."
              : "Tap the mic and say your village name in Tamil or English."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 py-4">
          <button
            type="button"
            onClick={() => (listening ? stop() : start("ta-IN"))}
            disabled={!supported}
            className={`grid h-24 w-24 place-items-center rounded-full text-primary-foreground shadow-lg transition-all ${
              listening ? "bg-destructive animate-pulse" : "bg-primary hover:scale-105"
            } disabled:opacity-50`}
            aria-label={listening ? "Stop" : "Start"}
          >
            {listening ? <X className="h-10 w-10" /> : <Mic className="h-10 w-10" />}
          </button>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            {!supported
              ? lang === "ta"
                ? "ஆதரிக்கப்படவில்லை"
                : "Not supported"
              : listening
                ? lang === "ta"
                  ? "கேட்கிறேன்..."
                  : "Listening..."
                : lang === "ta"
                  ? "தயார்"
                  : "Ready"}
          </p>

          {transcript && (
            <p className="rounded-lg bg-secondary px-4 py-2 text-center font-display text-lg lang-ta">
              "{transcript}"
            </p>
          )}
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        {results.length > 0 && (
          <ul className="divide-y divide-border rounded-lg border border-border">
            {results.map((v) => (
              <li key={v.slug}>
                <button
                  className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-secondary"
                  onClick={() => {
                    onClose();
                    navigate({ to: "/v/$slug", params: { slug: v.slug } });
                  }}
                >
                  <span>
                    <span className="block font-medium lang-ta">{v.name.ta}</span>
                    <span className="block text-xs text-muted-foreground">
                      {v.name.en} · {bi(v.district, lang)}
                    </span>
                  </span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
}

/* ---------------- Offline ---------------- */

const CACHE_KEY = "gramaseva:cached-villages";

function OfflineDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { lang } = useI18n();
  const navigate = useNavigate();
  const [online, setOnline] = useState(typeof navigator !== "undefined" ? navigator.onLine : true);
  const [cached, setCached] = useState<string[]>([]);

  useEffect(() => {
    function up() {
      setOnline(navigator.onLine);
    }
    window.addEventListener("online", up);
    window.addEventListener("offline", up);
    return () => {
      window.removeEventListener("online", up);
      window.removeEventListener("offline", up);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      setCached(raw ? JSON.parse(raw) : []);
    } catch {
      setCached([]);
    }
  }, [open]);

  function cacheVillage(v: Village) {
    const next = Array.from(new Set([...cached, v.slug]));
    localStorage.setItem(CACHE_KEY, JSON.stringify(next));
    localStorage.setItem(`gramaseva:village:${v.slug}`, JSON.stringify(v));
    setCached(next);
  }

  function clearCache() {
    localStorage.removeItem(CACHE_KEY);
    villages.forEach((v) => localStorage.removeItem(`gramaseva:village:${v.slug}`));
    setCached([]);
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className={lang === "ta" ? "lang-ta" : ""}>
            {lang === "ta" ? "ஆஃப்லைன் சேமிப்பு" : "Offline cache"}
          </DialogTitle>
          <DialogDescription className={lang === "ta" ? "lang-ta" : ""}>
            {lang === "ta"
              ? "உங்கள் கிராமங்களைச் சேமிக்கவும் — நெட்வொர்க் இல்லாதபோதும் படிக்கலாம்."
              : "Save villages locally — read notices and schedules when offline."}
          </DialogDescription>
        </DialogHeader>

        <div
          className={`flex items-center gap-3 rounded-lg border px-4 py-3 ${
            online ? "border-emerald-500/40 bg-emerald-500/10" : "border-amber-500/40 bg-amber-500/10"
          }`}
        >
          {online ? (
            <Wifi className="h-5 w-5 text-emerald-600" />
          ) : (
            <WifiOff className="h-5 w-5 text-amber-600" />
          )}
          <span className="text-sm font-medium">
            {online
              ? lang === "ta"
                ? "ஆன்லைனில் உள்ளீர்கள்"
                : "You're online"
              : lang === "ta"
                ? "ஆஃப்லைனில் உள்ளீர்கள் — சேமித்த தரவு மட்டுமே"
                : "You're offline — cached data only"}
          </span>
        </div>

        <ul className="divide-y divide-border rounded-lg border border-border">
          {villages.map((v) => {
            const isCached = cached.includes(v.slug);
            return (
              <li key={v.slug} className="flex items-center justify-between gap-3 px-4 py-3">
                <button
                  className="flex-1 text-left"
                  onClick={() => {
                    onClose();
                    navigate({ to: "/v/$slug", params: { slug: v.slug } });
                  }}
                >
                  <span className="block font-medium lang-ta">{v.name.ta}</span>
                  <span className="block text-xs text-muted-foreground">{v.name.en}</span>
                </button>
                {isCached ? (
                  <span className="rounded-full bg-emerald-600/15 px-2 py-0.5 text-xs font-medium text-emerald-700">
                    {lang === "ta" ? "சேமிக்கப்பட்டது" : "Cached"}
                  </span>
                ) : (
                  <Button size="sm" variant="outline" onClick={() => cacheVillage(v)}>
                    {lang === "ta" ? "சேமி" : "Cache"}
                  </Button>
                )}
              </li>
            );
          })}
        </ul>

        <DialogFooter>
          <Button variant="ghost" size="sm" onClick={clearCache} disabled={cached.length === 0}>
            {lang === "ta" ? "சேமிப்பை அழி" : "Clear cache"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ---------------- Complaints ---------------- */

function ComplaintsDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { lang } = useI18n();
  const navigate = useNavigate();
  const all: Array<Complaint & { village: Village }> = villages.flatMap((v) =>
    v.complaints.map((c) => ({ ...c, village: v })),
  );

  const counts = {
    pending: all.filter((c) => c.status === "pending").length,
    in_progress: all.filter((c) => c.status === "in_progress").length,
    resolved: all.filter((c) => c.status === "resolved").length,
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className={lang === "ta" ? "lang-ta" : ""}>
            {lang === "ta" ? "புகார் கண்காணிப்பு" : "Complaint tracker"}
          </DialogTitle>
          <DialogDescription className={lang === "ta" ? "lang-ta" : ""}>
            {lang === "ta"
              ? "அனைத்து கிராமங்களில் இருந்தும் சமீபத்திய புகார்கள்."
              : "Live complaints across all registered villages."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-2">
          <StatTile color="amber" label={lang === "ta" ? "நிலுவை" : "Pending"} value={counts.pending} />
          <StatTile color="blue" label={lang === "ta" ? "செயலில்" : "In progress"} value={counts.in_progress} />
          <StatTile color="emerald" label={lang === "ta" ? "தீர்க்கப்பட்டது" : "Resolved"} value={counts.resolved} />
        </div>

        <ul className="max-h-72 divide-y divide-border overflow-y-auto rounded-lg border border-border">
          {all.length === 0 && (
            <li className="px-4 py-8 text-center text-sm text-muted-foreground">
              {lang === "ta" ? "புகார்கள் இல்லை." : "No complaints yet."}
            </li>
          )}
          {all
            .sort((a, b) => b.reportedAt.localeCompare(a.reportedAt))
            .map((c) => (
              <li key={`${c.village.slug}-${c.id}`} className="flex items-center justify-between gap-3 px-4 py-3">
                <div>
                  <p className="text-sm font-medium">{c.type}</p>
                  <p className="text-xs text-muted-foreground">
                    {bi(c.village.name, lang)} · {c.reportedAt}
                  </p>
                </div>
                <StatusBadge status={c.status} lang={lang} />
              </li>
            ))}
        </ul>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              onClose();
              navigate({ to: "/v/$slug", params: { slug: "kadayam" } });
            }}
          >
            <Camera className="mr-2 h-4 w-4" />
            {lang === "ta" ? "புதிய புகார்" : "File a complaint"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function StatTile({ color, label, value }: { color: "amber" | "blue" | "emerald"; label: string; value: number }) {
  const cls = {
    amber: "bg-amber-500/10 text-amber-700 border-amber-500/30",
    blue: "bg-blue-500/10 text-blue-700 border-blue-500/30",
    emerald: "bg-emerald-500/10 text-emerald-700 border-emerald-500/30",
  }[color];
  return (
    <div className={`rounded-lg border px-3 py-2 ${cls}`}>
      <p className="text-2xl font-display">{value}</p>
      <p className="text-[10px] uppercase tracking-wider">{label}</p>
    </div>
  );
}

function StatusBadge({ status, lang }: { status: Complaint["status"]; lang: "en" | "ta" }) {
  const map = {
    pending: { en: "Pending", ta: "நிலுவை", cls: "bg-amber-500/15 text-amber-700" },
    in_progress: { en: "In progress", ta: "செயலில்", cls: "bg-blue-500/15 text-blue-700" },
    resolved: { en: "Resolved", ta: "தீர்க்கப்பட்டது", cls: "bg-emerald-500/15 text-emerald-700" },
  }[status];
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${map.cls}`}>
      {lang === "ta" ? map.ta : map.en}
    </span>
  );
}
