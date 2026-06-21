import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useI18n, bi, type Lang } from "@/lib/i18n";
import { findVillage, type Notice } from "@/data/villages";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import {
  ArrowLeft,
  Bell,
  Droplets,
  ScrollText,
  Mic,
  Search,
  Share2,
  MapPin,
} from "lucide-react";
import { QuickActions } from "@/components/quick-actions";
import { WardMap } from "@/components/ward-map";

export const Route = createFileRoute("/v/$slug")({
  loader: ({ params }) => {
    const village = findVillage(params.slug);
    if (!village) throw notFound();
    return { village };
  },
  head: ({ loaderData }) => {
    const v = loaderData?.village;
    const name = v ? `${v.name.en} (${v.name.ta})` : "Village";
    return {
      meta: [
        { title: `${name} — GramaSeva` },
        {
          name: "description",
          content: v
            ? `Notices, water schedule, complaints and government schemes for ${v.name.en}, ${v.district.en}.`
            : "Village dashboard on GramaSeva.",
        },
        { property: "og:title", content: `${name} — GramaSeva` },
      ],
    };
  },
  component: VillagePage,
  notFoundComponent: () => (
    <div className="grid min-h-screen place-items-center bg-background p-6 text-center">
      <div>
        <h1 className="font-display text-3xl text-foreground">Village not found</h1>
        <Link to="/" className="mt-4 inline-block text-accent underline">
          Back to all villages
        </Link>
      </div>
    </div>
  ),
});

const categoryStyles: Record<Notice["category"], { en: string; ta: string; cls: string }> = {
  water: { en: "Water", ta: "நீர்", cls: "bg-[color:var(--emerald)]/15 text-accent" },
  health: { en: "Health", ta: "சுகாதாரம்", cls: "bg-destructive/10 text-destructive" },
  event: { en: "Event", ta: "நிகழ்வு", cls: "bg-[color:var(--gold-raw)]/20 text-[color:var(--gold-foreground)]" },
  scheme: { en: "Scheme", ta: "திட்டம்", cls: "bg-primary/10 text-primary" },
  general: { en: "General", ta: "பொது", cls: "bg-muted text-muted-foreground" },
};

function fmtDate(iso: string, lang: Lang) {
  try {
    return new Date(iso).toLocaleDateString(lang === "ta" ? "ta-IN" : "en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function VillagePage() {
  const { slug } = Route.useParams();
  const village = findVillage(slug)!;
  const { t, lang } = useI18n();
  const [q, setQ] = useState("");

  const filteredNotices = useMemo<Notice[]>(() => {
    const term = q.trim().toLowerCase();
    if (!term) return village.notices;
    return village.notices.filter(
      (n) =>
        n.title.en.toLowerCase().includes(term) ||
        n.title.ta.includes(q) ||
        n.body.en.toLowerCase().includes(term),
    );
  }, [q, village.notices]);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader showBell />

      {/* Village banner */}
      <section className="relative overflow-hidden border-b border-border/60 bg-primary text-primary-foreground">
        <div className="absolute inset-0 kolam-pattern-gold opacity-30" aria-hidden />
        <div className="relative mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm text-primary-foreground/80 hover:text-primary-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> {t("backHome")}
          </Link>

          <div className="mt-6 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--gold-raw)]">
                {bi(village.district, lang)} · {village.pincode}
              </p>
              <h1 className="mt-2 font-display text-5xl sm:text-6xl">
                <span className="lang-ta">{village.name.ta}</span>
                <span className="ml-3 text-3xl opacity-70">{village.name.en}</span>
              </h1>
            </div>

            <dl className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm sm:grid-cols-3">
              <Stat label={t("population")} value={village.population.toLocaleString()} />
              <Stat label={t("president")} value={village.panchayatPresident} />
              <Stat label={t("pincode")} value={village.pincode} />
            </dl>
          </div>

          {/* Search row */}
          <div className="mt-10 flex items-stretch gap-2 rounded-xl border border-[color:var(--gold-raw)]/30 bg-background/95 p-1.5 shadow-2xl max-w-2xl">
            <div className="flex flex-1 items-center gap-2 px-3">
              <Search className="h-5 w-5 text-muted-foreground" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={lang === "en" ? "Search notices…" : "அறிவிப்புகளைத் தேடு…"}
                className="w-full bg-transparent py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none"
              />
            </div>
            <button
              aria-label={t("voiceSearch")}
              type="button"
              className="grid h-11 w-11 place-items-center rounded-lg bg-secondary text-secondary-foreground hover:bg-accent hover:text-accent-foreground"
            >
              <Mic className="h-5 w-5" />
            </button>
          </div>
        </div>
      </section>

      {/* Quick actions */}
      <Section title={t("quickActions")} lang={lang}>
        <QuickActions village={village} />
      </Section>

      {/* Notices */}
      <Section title={t("noticeBoard")} lang={lang} eyebrow={<ScrollText className="h-4 w-4" />}>
        <div className="grid gap-4 lg:grid-cols-2">
          {filteredNotices.length === 0 && (
            <p className="text-muted-foreground">
              {lang === "en" ? "No notices yet." : "இன்னும் அறிவிப்புகள் இல்லை."}
            </p>
          )}
          {filteredNotices.map((n) => {
            const cat = categoryStyles[n.category];
            return (
              <article
                key={n.id}
                className="rounded-xl border border-border bg-card p-5 transition-shadow hover:shadow-lg"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${cat.cls}`}>
                    {lang === "ta" ? cat.ta : cat.en}
                  </span>
                  <time className="text-xs text-muted-foreground">{fmtDate(n.date, lang)}</time>
                </div>
                <h3 className={`mt-3 font-display text-xl text-card-foreground ${lang === "ta" ? "lang-ta" : ""}`}>
                  {bi(n.title, lang)}
                </h3>
                <p className={`mt-2 text-sm text-muted-foreground ${lang === "ta" ? "lang-ta" : ""}`}>
                  {bi(n.body, lang)}
                </p>
                <div className="mt-4 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => {
                      const title = bi(n.title, lang);
                      const body = bi(n.body, lang);
                      const dateStr = fmtDate(n.date, lang);
                      const footer = lang === "ta"
                        ? `— ${village.name.ta} ஊராட்சி`
                        : `— ${village.name.en} Panchayat`;
                      const text = `*${title}*\n${body}\n\n📅 ${dateStr}\n${footer}`;
                      const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
                      window.open(url, "_blank", "noopener,noreferrer");
                    }}
                    className="inline-flex items-center gap-1.5 text-xs text-accent hover:underline"
                  >
                    <Share2 className="h-3.5 w-3.5" /> {t("share")}
                  </button>
                  <Bell className="h-4 w-4 text-muted-foreground" />
                </div>
              </article>
            );
          })}
        </div>
      </Section>

      {/* Water schedule + Ward map side by side on lg */}
      <Section title={t("waterSchedule")} lang={lang} eyebrow={<Droplets className="h-4 w-4" />}>
        <div className="grid gap-6 lg:grid-cols-5">
          <div className="lg:col-span-3 overflow-hidden rounded-xl border border-border bg-card">
            <table className="w-full text-sm">
              <thead className="bg-secondary text-secondary-foreground">
                <tr>
                  <th className="px-5 py-3 text-left font-medium">{lang === "en" ? "Ward" : "வார்டு"}</th>
                  <th className="px-5 py-3 text-left font-medium">{t("morning")}</th>
                  <th className="px-5 py-3 text-left font-medium">{t("evening")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {village.waterSchedule.map((w) => (
                  <tr key={w.ward} className="text-card-foreground">
                    <td className="px-5 py-3 font-medium">{w.ward}</td>
                    <td className="px-5 py-3 text-muted-foreground">{w.morning ?? "—"}</td>
                    <td className="px-5 py-3 text-muted-foreground">{w.evening ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Ward map preview */}
          <div className="lg:col-span-2 rounded-xl border border-border bg-card p-5">
            <div className="flex items-center justify-between">
              <h3 className={`font-display text-lg text-card-foreground ${lang === "ta" ? "lang-ta" : ""}`}>
                {t("wardMap")}
              </h3>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className={`mt-1 text-xs text-muted-foreground ${lang === "ta" ? "lang-ta" : ""}`}>
              {t("wardMapSub")}
            </p>

            {/* Real live map */}
            <div className="mt-4">
              <WardMap village={village} lang={lang} />
            </div>

            <ul className="mt-4 space-y-1.5 text-xs">
              <Legend color="var(--destructive)" label={t("pending")} count={village.complaints.filter(c => c.status === "pending").length} />
              <Legend color="var(--warning)" label={t("inProgress")} count={village.complaints.filter(c => c.status === "in_progress").length} />
              <Legend color="var(--success)" label={t("resolved")} count={village.complaints.filter(c => c.status === "resolved").length} />
            </ul>
          </div>
        </div>
      </Section>

      <SiteFooter />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[10px] uppercase tracking-[0.18em] text-primary-foreground/60">{label}</dt>
      <dd className="mt-0.5 font-display text-lg text-primary-foreground">{value}</dd>
    </div>
  );
}

function Section({
  title,
  eyebrow,
  children,
  lang,
}: {
  title: string;
  eyebrow?: React.ReactNode;
  children: React.ReactNode;
  lang: Lang;
}) {
  return (
    <section className="border-b border-border/40">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="mb-6 flex items-center gap-2 text-muted-foreground">
          {eyebrow}
          <h2 className={`font-display text-2xl text-foreground ${lang === "ta" ? "lang-ta" : ""}`}>
            {title}
          </h2>
        </div>
        {children}
      </div>
    </section>
  );
}


function Legend({ color, label, count }: { color: string; label: string; count: number }) {
  return (
    <li className="flex items-center justify-between gap-2 text-card-foreground">
      <span className="flex items-center gap-2">
        <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
        {label}
      </span>
      <span className="text-muted-foreground">{count}</span>
    </li>
  );
}
