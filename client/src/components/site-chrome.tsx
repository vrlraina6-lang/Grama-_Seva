import { Link } from "@tanstack/react-router";
import { useI18n } from "@/lib/i18n";
import { Languages, QrCode, Bell } from "lucide-react";
import { SiteQrDialog } from "./site-qr-dialog";

export function SiteHeader({ showBell = false }: { showBell?: boolean }) {
  const { t, lang, toggle } = useI18n();

  return (
    <header className="border-b border-border/60 bg-background/80 backdrop-blur sticky top-0 z-30">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link to="/" className="flex items-center gap-2 group">
          <span className="grid h-9 w-9 place-items-center rounded-md bg-primary text-primary-foreground shadow-sm">
            <QrCode className="h-5 w-5" />
          </span>
          <span className="leading-tight">
            <span className="block font-display text-lg text-foreground">
              {t("appName")}
            </span>
            <span className="block text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              {lang === "en" ? "Civic platform" : "குடிமை தளம்"}
            </span>
          </span>
        </Link>

        <div className="flex items-center gap-2">
          {showBell && (
            <button
              type="button"
              aria-label="Notifications"
              className="grid h-9 w-9 place-items-center rounded-md border border-border bg-card text-foreground hover:bg-secondary"
            >
              <Bell className="h-4 w-4" />
            </button>
          )}
          <SiteQrDialog>
            <QrCode className="h-4 w-4" />
          </SiteQrDialog>
          <button
            type="button"
            onClick={toggle}
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-sm font-medium text-foreground hover:bg-secondary transition-colors"
          >
            <Languages className="h-4 w-4" />
            <span className={lang === "en" ? "lang-ta" : ""}>{t("languageToggle")}</span>
          </button>
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  const { t } = useI18n();
  return (
    <footer className="mt-16 border-t border-border/60 bg-primary text-primary-foreground/90">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <div>
            <p className="font-display text-2xl">{t("appName")}</p>
            <p className="mt-1 text-sm opacity-80">{t("tagline")}</p>
          </div>
          <p className="text-xs opacity-70 max-w-xs sm:text-right">{t("footerNote")}</p>
        </div>
      </div>
    </footer>
  );
}
