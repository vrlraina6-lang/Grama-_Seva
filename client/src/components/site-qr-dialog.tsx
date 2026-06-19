import { useEffect, useState, useRef } from "react";
import QRCode from "qrcode";
import { X, Download, Share2 } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export function SiteQrDialog({ children }: { children: React.ReactNode }) {
  const { lang } = useI18n();
  const [open, setOpen] = useState(false);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [siteUrl, setSiteUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    if (typeof window === "undefined") return;
    const url = window.location.origin + "/";
    setSiteUrl(url);
    setQrUrl(null);
    QRCode.toDataURL(url, {
      width: 280,
      margin: 2,
      color: {
        dark: "#064E3B",
        light: "#FDFBF7",
      },
      errorCorrectionLevel: "H",
    })
      .then(setQrUrl)
      .catch(() => setQrUrl(null));
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const handleClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("keydown", handleKey);
    document.addEventListener("mousedown", handleClick);
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.removeEventListener("mousedown", handleClick);
    };
  }, [open]);

  const handleDownload = () => {
    if (!qrUrl) return;
    const a = document.createElement("a");
    a.href = qrUrl;
    a.download = "gramaseva-website-qr.png";
    a.click();
  };

  const handleShare = async () => {
    if (!siteUrl) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: "GramaSeva",
          text: lang === "ta" ? "GramaSeva இணையதளத்திற்கு QR ஸ்கேன் செய்யவும்" : "Scan to visit GramaSeva website",
          url: siteUrl,
        });
        return;
      } catch {
        // fallthrough to copy
      }
    }
    try {
      await navigator.clipboard.writeText(siteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={lang === "ta" ? "இணையதள QR" : "Website QR"}
        className="grid h-9 w-9 place-items-center rounded-md border border-border bg-card text-foreground hover:bg-secondary transition-colors"
      >
        {children}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 h-screen w-screen p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            className="absolute left-1/2 top-1/2 max-h-[90vh] w-full max-w-sm -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl border border-border bg-card p-6 shadow-xl"
          >
            <div className="flex items-center justify-between gap-4">
              <h2 className="font-display text-xl text-foreground">
                {lang === "ta" ? "இந்த இணையதளத்திற்கான QR" : "QR for this website"}
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label={lang === "ta" ? "மூடு" : "Close"}
                className="grid h-8 w-8 place-items-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="mt-1 text-sm text-muted-foreground">
              {lang === "ta"
                ? "QR ஐ ஸ்கேன் செய்து GramaSeva இணையதளத்திற்கு செல்லவும்."
                : "Scan this QR code with any camera app to open the GramaSeva website."}
            </p>

            <div className="mt-5 flex flex-col items-center gap-4">
              <div className="rounded-lg border border-border bg-[#FDFBF7] p-3 shadow-sm">
                {qrUrl ? (
                  <img
                    src={qrUrl}
                    alt={lang === "ta" ? "இணையதள QR குறியீடு" : "Website QR code"}
                    className="h-44 w-44 sm:h-56 sm:w-56 rounded-md"
                  />
                ) : (
                  <div className="h-44 w-44 sm:h-56 sm:w-56 animate-pulse rounded-md bg-muted" />
                )}
              </div>

              <p className="text-center text-xs text-muted-foreground break-all px-2">
                {siteUrl || "..."}
              </p>

              <div className="flex w-full gap-2">
                <button
                  type="button"
                  onClick={handleDownload}
                  disabled={!qrUrl}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
                >
                  <Download className="h-4 w-4" />
                  {lang === "ta" ? "பதிவிறக்க" : "Download"}
                </button>
                <button
                  type="button"
                  onClick={handleShare}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
                >
                  <Share2 className="h-4 w-4" />
                  {copied ? (lang === "ta" ? "நகலெடுக்கப்பட்டது" : "Copied") : lang === "ta" ? "பகிர்" : "Share"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
