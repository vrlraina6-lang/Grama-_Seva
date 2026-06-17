import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useI18n, bi } from "@/lib/i18n";
import { searchVillages, villages } from "@/data/villages";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { FeatureCards, useTamilVoice } from "@/components/feature-actions";
import {
  Search,
  QrCode,
  Mic,
  MapPin,
  ArrowRight,
  Users,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "GramaSeva — One QR. One Village. One Voice." },
      {
        name: "description",
        content:
          "A digital panchayat for rural Tamil Nadu. Notices, water timings, complaints and government schemes — in Tamil and English, offline-ready.",
      },
      { property: "og:title", content: "GramaSeva — One QR. One Village. One Voice." },
      {
        property: "og:description",
        content:
          "Scan your village QR to see notices, water timings, file complaints and check government schemes — in Tamil + English.",
      },
    ],
  }),
  component: LandingPage,
});

function LandingPage() {
  const { t, lang } = useI18n();
  const [query, setQuery] = useState("");
  const navigate = useNavigate();
  const results = useMemo(() => searchVillages(query).slice(0, 6), [query]);
  const voice = useTamilVoice();

  useEffect(() => {
    if (voice.transcript) setQuery(voice.transcript);
  }, [voice.transcript]);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* Hero band */}
      <section className="relative overflow-hidden border-b border-border/60 bg-primary text-primary-foreground">
        <div className="absolute inset-0 kolam-pattern-gold opacity-40" aria-hidden />
        <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-[color:var(--gold-raw)]/25 blur-3xl" aria-hidden />

        <div className="relative mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
          <p className="inline-flex items-center gap-2 rounded-full border border-[color:var(--gold-raw)]/40 bg-[color:var(--gold-raw)]/15 px-3 py-1 text-xs uppercase tracking-[0.2em] text-[color:var(--gold-raw)]">
            <QrCode className="h-3.5 w-3.5" /> {t("tagline")}
          </p>

          <h1 className={`mt-6 max-w-3xl font-display text-5xl leading-[1.05] sm:text-6xl text-balance ${lang === "ta" ? "lang-ta" : ""}`}>
            {lang === "en" ? (
              <>
                A digital <span className="text-[color:var(--gold-raw)]">panchayat</span> for every village in Tamil Nadu.
              </>
            ) : (
              <>
                தமிழ்நாட்டின் ஒவ்வொரு கிராமத்திற்கும் ஒரு{" "}
                <span className="text-[color:var(--gold-raw)]">டிஜிட்டல் பஞ்சாயத்து</span>.
              </>
            )}
          </h1>

          <p className={`mt-5 max-w-2xl text-base sm:text-lg opacity-90 ${lang === "ta" ? "lang-ta" : ""}`}>
            {t("heroLead")}
          </p>

          {/* Search */}
          <div className="mt-10 max-w-2xl">
            <label className="block text-xs uppercase tracking-[0.2em] text-[color:var(--gold-raw)] mb-2">
              {t("findVillage")}
            </label>
            <div className="flex items-stretch gap-2 rounded-xl border border-[color:var(--gold-raw)]/30 bg-background/95 p-1.5 shadow-2xl">
              <div className="flex flex-1 items-center gap-2 px-3">
                <Search className="h-5 w-5 text-muted-foreground" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t("searchPlaceholder")}
                  className="w-full bg-transparent py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none"
                />
              </div>
              <button
                type="button"
                aria-label={t("voiceSearch")}
                onClick={() => (voice.listening ? voice.stop() : voice.start("ta-IN"))}
                className={`grid h-11 w-11 place-items-center rounded-lg transition-colors ${
                  voice.listening
                    ? "bg-destructive text-destructive-foreground animate-pulse"
                    : "bg-secondary text-secondary-foreground hover:bg-accent hover:text-accent-foreground"
                }`}
              >
                <Mic className="h-5 w-5" />
              </button>
            </div>

            {query && (
              <ul className="mt-3 divide-y divide-border rounded-xl border border-border bg-card text-card-foreground shadow-lg">
                {results.length === 0 && (
                  <li className="px-4 py-3 text-sm text-muted-foreground">
                    {lang === "en" ? "No villages found." : "கிராமங்கள் இல்லை."}
                  </li>
                )}
                {results.map((v) => (
                  <li key={v.slug}>
                    <button
                      type="button"
                      onClick={() => navigate({ to: "/v/$slug", params: { slug: v.slug } })}
                      className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-secondary"
                    >
                      <span>
                        <span className="block font-medium text-foreground">
                          {bi(v.name, lang)}
                        </span>
                        <span className="block text-xs text-muted-foreground">
                          {bi(v.district, lang)} · {v.pincode}
                        </span>
                      </span>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>

      {/* Featured villages */}
      <section className="border-b border-border/60">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="mb-8 flex items-end justify-between gap-4">
            <h2 className={`font-display text-3xl text-foreground ${lang === "ta" ? "lang-ta" : ""}`}>
              {t("featured")}
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {villages.map((v) => (
              <Link
                key={v.slug}
                to="/v/$slug"
                params={{ slug: v.slug }}
                className="group relative overflow-hidden rounded-xl border border-border bg-card p-6 transition-all hover:-translate-y-0.5 hover:border-accent hover:shadow-xl"
              >
                <div className="absolute inset-0 kolam-pattern opacity-30 transition-opacity group-hover:opacity-50" aria-hidden />
                <div className="relative">
                  <p className="font-display text-2xl text-foreground lang-ta">{v.name.ta}</p>
                  <p className="text-sm text-muted-foreground">{v.name.en}</p>
                  <div className="mt-5 flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" /> {bi(v.district, lang)}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" /> {v.population.toLocaleString()}
                    </span>
                  </div>
                  <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-accent">
                    {t("openDashboard")} <ArrowRight className="h-4 w-4" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Why band */}
      <section className="bg-secondary/50">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <h2 className={`max-w-2xl font-display text-4xl text-foreground text-balance ${lang === "ta" ? "lang-ta" : ""}`}>
            {t("why")}
          </h2>
          <p className={`mt-3 max-w-2xl text-muted-foreground ${lang === "ta" ? "lang-ta" : ""}`}>
            {t("whySub")}
          </p>

          <FeatureCards />
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
