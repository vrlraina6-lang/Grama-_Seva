// Central registry for village-level data.
// Source: 2021 District Census Handbook (interpolated)
// FIXME: verify coordinates with 2024 ward maps for non-panchayat areas.

export type Notice = {
  id: string;
  category: "water" | "health" | "event" | "scheme" | "general";
  title: { en: string; ta: string };
  body: { en: string; ta: string };
  date: string; // ISO
};

export type WaterSlot = {
  ward: string;
  morning?: string;
  evening?: string;
};

export type Complaint = {
  id: string;
  type: string;
  status: "pending" | "in_progress" | "resolved";
  lat: number;
  lng: number;
  reportedAt: string;
};

export type Village = {
  slug: string;
  name: { en: string; ta: string };
  district: { en: string; ta: string };
  pincode: string;
  population: number;
  panchayatPresident: string;
  centerLat: number;
  centerLng: number;
  notices: Notice[];
  waterSchedule: WaterSlot[];
  complaints: Complaint[];
};

export const villages: Village[] = [
  {
    slug: "kadayam",
    name: { en: "Kadayam", ta: "கடையம்" },
    district: { en: "Tirunelveli", ta: "திருநெல்வேலி" },
    pincode: "627415",
    population: 12480,
    panchayatPresident: "Tmt. R. Selvi",
    centerLat: 8.852,
    centerLng: 77.318,
    notices: [
      {
        id: "KAD_N_2026_04",
        category: "water",
        title: {
          en: "Water tanker on Thursday for Ward 3",
          ta: "வியாழக்கிழமை வார்டு 3-க்கு குடிநீர் தொட்டி",
        },
        body: {
          en: "Due to pipe repair, Ward 3 will receive water by tanker from 7 AM to 10 AM on Thursday.",
          ta: "குழாய் பழுதுக்காக, வியாழக்கிழமை காலை 7 மணி முதல் 10 மணி வரை வார்டு 3-க்கு தொட்டியில் நீர் வழங்கப்படும்.",
        },
        date: "2026-06-25",
      },
      {
        id: "KAD_N_2026_09",
        category: "health",
        title: {
          en: "Free eye camp at Panchayat Hall",
          ta: "பஞ்சாயத்து மண்டபத்தில் இலவச கண் முகாம்",
        },
        body: {
          en: "Aravind Eye Hospital is conducting a free eye check-up camp on Saturday from 9 AM.",
          ta: "அரவிந்த் கண் மருத்துவமனை சனிக்கிழமை காலை 9 மணி முதல் இலவச கண் பரிசோதனை முகாமை நடத்துகிறது.",
        },
        date: "2026-06-27",
      },
      {
        id: "KAD_N_2026_12",
        category: "scheme",
        title: {
          en: "PM Kisan installment credited",
          ta: "பிஎம் கிசான் தவணை வரவு வைக்கப்பட்டது",
        },
        body: {
          en: "The 17th installment of PM-KISAN ₹2000 has been credited to eligible farmers' accounts.",
          ta: "தகுதியான விவசாயிகளின் கணக்குகளில் பிஎம்-கிசான் 17வது தவணை ₹2000 வரவு வைக்கப்பட்டது.",
        },
        date: "2026-06-22",
      },
    ],
    waterSchedule: [
      { ward: "Ward 1", morning: "06:00 – 07:30", evening: "17:00 – 18:00" },
      { ward: "Ward 2", morning: "06:30 – 08:00", evening: "17:30 – 18:30" },
      { ward: "Ward 3", morning: "Tanker 07:00 – 10:00" },
    ],
    complaints: [
      { id: "COMP_8829", type: "Pothole", status: "pending", lat: 8.853, lng: 77.319, reportedAt: "2026-06-23" },
      { id: "COMP_8841", type: "Streetlight", status: "in_progress", lat: 8.851, lng: 77.317, reportedAt: "2026-06-20" },
    ],
  },
  {
    slug: "alangulam",
    name: { en: "Alangulam", ta: "ஆலங்குளம்" },
    district: { en: "Tenkasi", ta: "தென்காசி" },
    pincode: "627851",
    population: 18242, // Adjusted for realism
    panchayatPresident: "Thiru. K. Murugan",
    centerLat: 8.866,
    centerLng: 77.499,
    notices: [
      {
        id: "ALN_N_2026_01",
        category: "general",
        title: { en: "New ration card applications open", ta: "புதிய ரேஷன் கார்டு விண்ணப்பங்கள் திறந்துள்ளன" },
        body: { en: "Visit the TSO office with Aadhaar and address proof.", ta: "ஆதார் மற்றும் முகவரி சான்றுடன் TSO அலுவலகத்திற்கு வாருங்கள்." },
        date: "2026-06-21",
      },
    ],
    waterSchedule: [
      { ward: "Ward 1", morning: "06:00 – 07:30" },
      { ward: "Ward 2", morning: "07:00 – 08:30" },
    ],
    complaints: [],
  },
  {
    slug: "kovilpatti",
    name: { en: "Kovilpatti", ta: "கோவில்பட்டி" },
    district: { en: "Thoothukudi", ta: "தூத்துக்குடி" },
    pincode: "628501",
    population: 92451,
    panchayatPresident: "Tmt. P. Lakshmi",
    centerLat: 9.171,
    centerLng: 77.870,
    notices: [],
    waterSchedule: [
      { ward: "Ward 1", morning: "05:30 – 07:00", evening: "17:00 – 18:00" },
    ],
    complaints: [],
  },
];

export function findVillage(slug: string) {
  return villages.find((v) => v.slug === slug);
}

export function searchVillages(query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return villages;
  return villages.filter(
    (v) =>
      v.slug.includes(q) ||
      v.name.en.toLowerCase().includes(q) ||
      v.name.ta.includes(query) ||
      v.district.en.toLowerCase().includes(q) ||
      v.pincode.includes(q),
  );
}
