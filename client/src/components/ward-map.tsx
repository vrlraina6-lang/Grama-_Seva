import { useEffect, useRef, useState } from "react";
import type { Complaint, Village } from "@/data/villages";
import { Locate, Loader2 } from "lucide-react";

type LatLng = { lat: number; lng: number };

const STATUS_COLOR: Record<Complaint["status"], string> = {
  pending: "#dc2626",
  in_progress: "#f59e0b",
  resolved: "#16a34a",
};

const STATUS_LABEL: Record<Complaint["status"], { en: string; ta: string }> = {
  pending: { en: "Pending", ta: "நிலுவையில்" },
  in_progress: { en: "In progress", ta: "செயல்பாட்டில்" },
  resolved: { en: "Resolved", ta: "தீர்க்கப்பட்டது" },
};

export function WardMap({
  village,
  lang,
}: {
  village: Village;
  lang: "en" | "ta";
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const userMarkerRef = useRef<any>(null);
  const userCircleRef = useRef<any>(null);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userPos, setUserPos] = useState<LatLng | null>(null);

  // Initialize the map
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const L = (await import("leaflet")).default;
      await import("leaflet/dist/leaflet.css");
      if (cancelled || !containerRef.current || mapRef.current) return;

      const map = L.map(containerRef.current, {
        center: [village.centerLat, village.centerLng],
        zoom: 14,
        scrollWheelZoom: false,
      });
      mapRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "© OpenStreetMap",
      }).addTo(map);

      // Village center marker
      L.circleMarker([village.centerLat, village.centerLng], {
        radius: 7,
        color: "#065f46",
        weight: 2,
        fillColor: "#10b981",
        fillOpacity: 0.9,
      })
        .addTo(map)
        .bindPopup(
          `<strong>${village.name.en}</strong><br/>${village.name.ta}<br/><span style="color:#6b7280">${village.pincode}</span>`,
        );

      // Complaint markers
      const bounds = L.latLngBounds([[village.centerLat, village.centerLng]]);
      village.complaints.forEach((c) => {
        const color = STATUS_COLOR[c.status];
        const label =
          lang === "ta" ? STATUS_LABEL[c.status].ta : STATUS_LABEL[c.status].en;
        L.circleMarker([c.lat, c.lng], {
          radius: 9,
          color,
          weight: 2,
          fillColor: color,
          fillOpacity: 0.55,
        })
          .addTo(map)
          .bindPopup(
            `<strong>${c.type}</strong><br/><span style="color:${color}">● ${label}</span><br/><span style="color:#6b7280">${new Date(c.reportedAt).toLocaleDateString()}</span>`,
          );
        bounds.extend([c.lat, c.lng]);
      });

      if (village.complaints.length > 0) {
        map.fitBounds(bounds, { padding: [24, 24], maxZoom: 15 });
      }

      // Fix tile sizing inside flex/grid container
      setTimeout(() => map.invalidateSize(), 100);
    })();

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [village, lang]);

  const locateMe = async () => {
    setError(null);
    if (!("geolocation" in navigator)) {
      setError(lang === "ta" ? "இடம் ஆதரிக்கப்படவில்லை" : "Geolocation not supported");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        setUserPos({ lat: latitude, lng: longitude });
        const L = (await import("leaflet")).default;
        const map = mapRef.current;
        if (!map) {
          setLocating(false);
          return;
        }
        if (userMarkerRef.current) map.removeLayer(userMarkerRef.current);
        if (userCircleRef.current) map.removeLayer(userCircleRef.current);

        userCircleRef.current = L.circle([latitude, longitude], {
          radius: accuracy,
          color: "#2563eb",
          weight: 1,
          fillColor: "#3b82f6",
          fillOpacity: 0.15,
        }).addTo(map);

        userMarkerRef.current = L.circleMarker([latitude, longitude], {
          radius: 8,
          color: "#ffffff",
          weight: 3,
          fillColor: "#2563eb",
          fillOpacity: 1,
        })
          .addTo(map)
          .bindPopup(lang === "ta" ? "நீங்கள் இங்கே" : "You are here")
          .openPopup();

        map.flyTo([latitude, longitude], 15, { duration: 1.2 });
        setLocating(false);
      },
      (err) => {
        setLocating(false);
        const msg =
          err.code === err.PERMISSION_DENIED
            ? lang === "ta"
              ? "இடம் அனுமதி மறுக்கப்பட்டது"
              : "Location permission denied"
            : lang === "ta"
              ? "இடத்தை பெற முடியவில்லை"
              : "Could not get location";
        setError(msg);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 },
    );
  };

  return (
    <div className="space-y-3">
      <div className="relative aspect-[4/3] overflow-hidden rounded-lg border border-border bg-secondary">
        <div ref={containerRef} className="absolute inset-0 z-0" />
        <button
          type="button"
          onClick={locateMe}
          disabled={locating}
          className="absolute right-3 top-3 z-[400] inline-flex items-center gap-1.5 rounded-md bg-card/95 px-2.5 py-1.5 text-xs font-medium text-card-foreground shadow-md ring-1 ring-border backdrop-blur transition hover:bg-card disabled:opacity-60"
        >
          {locating ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Locate className="h-3.5 w-3.5" />
          )}
          {locating
            ? lang === "ta"
              ? "தேடுகிறது…"
              : "Locating…"
            : lang === "ta"
              ? "என் இடம்"
              : "My location"}
        </button>
      </div>
      {error && (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      )}
      {userPos && !error && (
        <p className="text-xs text-muted-foreground">
          {lang === "ta" ? "உங்கள் இடம்: " : "Your location: "}
          {userPos.lat.toFixed(4)}, {userPos.lng.toFixed(4)}
        </p>
      )}
    </div>
  );
}
