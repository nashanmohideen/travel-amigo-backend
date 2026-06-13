// Copied from travel-amigo/data/transport.ts — transport cost/duration estimates.
import type { TransportLeg } from "./generation.types";

/**
 * Estimated transport costs and durations between common destinations.
 *
 * All costs are in LKR and reflect approximate 2024–2025 traveller prices
 * for the whole leg (not per person). Use as guidance only.
 *
 * `public`  = bus or train
 * `private` = hired tuktuk / car / van with driver
 * `mixed`   = recommended combination (e.g. train one way, tuk-tuk locally)
 */
export const transportLegs: TransportLeg[] = [
  // ── Colombo → Ella ────────────────────────────────────────────────────
  {
    id: "colombo-ella",
    from: "colombo",
    to: "ella",
    distanceKm: 230,
    options: [
      {
        mode: "public",
        estimatedCostLkr: 800,
        estimatedDurationMinutes: 420,
        notes: "Train from Colombo Fort → Ella via Kandy scenic route. Book 2nd-class reserved (~LKR 400–600) or 1st-class observation car in advance. Journey is approximately 7 hours.",
      },
      {
        mode: "private",
        estimatedCostLkr: 14000,
        estimatedDurationMinutes: 300,
        notes: "Hired AC car or van with driver. Approx 5 hours via highway. Comfortable but significantly more expensive.",
      },
      {
        mode: "mixed",
        estimatedCostLkr: 1200,
        estimatedDurationMinutes: 420,
        notes: "Recommended: scenic train from Colombo Fort to Ella (most atmospheric option). Add tuk-tuk for local hops in Ella (~LKR 300–400 per trip).",
      },
    ],
  },

  // ── Colombo → Kandy ───────────────────────────────────────────────────
  {
    id: "colombo-kandy",
    from: "colombo",
    to: "kandy",
    distanceKm: 115,
    options: [
      {
        mode: "public",
        estimatedCostLkr: 250,
        estimatedDurationMinutes: 180,
        notes: "Train from Colombo Fort to Kandy (~3 hrs). Buses also run frequently from Central Bus Stand (~2.5 hrs, LKR 150). Reserve train seats ahead.",
      },
      {
        mode: "private",
        estimatedCostLkr: 7500,
        estimatedDurationMinutes: 150,
        notes: "Hired AC car/van. Approx 2.5 hours — can be longer in traffic near the highway.",
      },
      {
        mode: "mixed",
        estimatedCostLkr: 400,
        estimatedDurationMinutes: 180,
        notes: "Train from Colombo Fort to Kandy (comfortable and scenic). Local buses or tuk-tuks for Kandy sightseeing.",
      },
    ],
  },

  // ── Colombo → Galle ───────────────────────────────────────────────────
  {
    id: "colombo-galle",
    from: "colombo",
    to: "galle",
    distanceKm: 120,
    options: [
      {
        mode: "public",
        estimatedCostLkr: 300,
        estimatedDurationMinutes: 150,
        notes: "Coastal train from Colombo Fort to Galle (~2.5 hrs). The ocean-side view from the sea-facing seats is spectacular. Buses also frequent (LKR 200, 2 hrs via expressway).",
      },
      {
        mode: "private",
        estimatedCostLkr: 7000,
        estimatedDurationMinutes: 90,
        notes: "Southern Expressway to Galle: fastest route at ~1.5 hrs in a hired car.",
      },
      {
        mode: "mixed",
        estimatedCostLkr: 400,
        estimatedDurationMinutes: 150,
        notes: "Coastal train is the scenic and budget-friendly favourite. Tuk-tuks within Galle Fort (~LKR 200–300 per trip).",
      },
    ],
  },

  // ── Colombo → Nuwara Eliya ────────────────────────────────────────────
  {
    id: "colombo-nuwara-eliya",
    from: "colombo",
    to: "nuwara-eliya",
    distanceKm: 180,
    options: [
      {
        mode: "public",
        estimatedCostLkr: 600,
        estimatedDurationMinutes: 360,
        notes: "Train from Colombo Fort to Nanu Oya station (~6 hrs), then tuk-tuk or taxi 10 km to Nuwara Eliya town (~LKR 400). The Kandy–Nanu Oya section is breathtaking.",
      },
      {
        mode: "private",
        estimatedCostLkr: 12000,
        estimatedDurationMinutes: 270,
        notes: "Hired car via highway and hill roads. Approximately 4.5 hours depending on traffic and conditions.",
      },
      {
        mode: "mixed",
        estimatedCostLkr: 900,
        estimatedDurationMinutes: 360,
        notes: "Train to Nanu Oya (book reserved seats), then tuk-tuk into town. Best bang-for-buck scenic experience.",
      },
    ],
  },

  // ── Kandy → Ella ─────────────────────────────────────────────────────
  {
    id: "kandy-ella",
    from: "kandy",
    to: "ella",
    distanceKm: 140,
    options: [
      {
        mode: "public",
        estimatedCostLkr: 550,
        estimatedDurationMinutes: 360,
        notes: "The famous scenic train from Kandy to Ella (~6 hrs) is one of the world's great rail journeys. Book the 2nd-class reserved or blue-train observation car well in advance.",
      },
      {
        mode: "private",
        estimatedCostLkr: 9000,
        estimatedDurationMinutes: 210,
        notes: "Hired car/van ~3.5 hrs via Nuwara Eliya or Badulla route. Flexible stops along the way.",
      },
      {
        mode: "mixed",
        estimatedCostLkr: 700,
        estimatedDurationMinutes: 360,
        notes: "Train is strongly recommended for this leg — the view through the tea estates and around the spiralling Demodara Loop bridge is unmissable.",
      },
    ],
  },

  // ── Kandy → Nuwara Eliya ─────────────────────────────────────────────
  {
    id: "kandy-nuwara-eliya",
    from: "kandy",
    to: "nuwara-eliya",
    distanceKm: 75,
    options: [
      {
        mode: "public",
        estimatedCostLkr: 350,
        estimatedDurationMinutes: 210,
        notes: "Train from Kandy to Nanu Oya (~3.5 hrs, scenic), then tuk-tuk to Nuwara Eliya. Alternatively, buses run every 30 minutes from Kandy bus stand (~2.5 hrs, LKR 200).",
      },
      {
        mode: "private",
        estimatedCostLkr: 5500,
        estimatedDurationMinutes: 150,
        notes: "Hired car/van. About 2.5 hours through winding mountain roads. Consider a driver who knows the B routes.",
      },
      {
        mode: "mixed",
        estimatedCostLkr: 500,
        estimatedDurationMinutes: 210,
        notes: "Bus from Kandy to Nuwara Eliya direct (most frequent option) with a tuk-tuk supplement locally.",
      },
    ],
  },

  // ── Galle → Ella ─────────────────────────────────────────────────────
  {
    id: "galle-ella",
    from: "galle",
    to: "ella",
    distanceKm: 195,
    options: [
      {
        mode: "public",
        estimatedCostLkr: 700,
        estimatedDurationMinutes: 390,
        notes: "Train from Galle to Ella via Colombo Fort and Kandy – requires a transfer. Allow a full day. Direct buses to Ella via Wellawaya are available (~6 hrs, LKR 550).",
      },
      {
        mode: "private",
        estimatedCostLkr: 12000,
        estimatedDurationMinutes: 300,
        notes: "Direct hire car via Colombo highway and B-roads (~5 hrs). Often the most practical option from the south coast.",
      },
      {
        mode: "mixed",
        estimatedCostLkr: 800,
        estimatedDurationMinutes: 390,
        notes: "Bus to Wellawaya, then local bus or tuk-tuk to Ella. Budget option requiring flexibility on timing.",
      },
    ],
  },

  // ── Ella → Galle ─────────────────────────────────────────────────────
  {
    id: "ella-galle",
    from: "ella",
    to: "galle",
    distanceKm: 195,
    options: [
      {
        mode: "public",
        estimatedCostLkr: 700,
        estimatedDurationMinutes: 390,
        notes: "Bus Ella → Wellawaya, transfer to Matara, then coastal train or bus to Galle. Approximately 6–7 hours total.",
      },
      {
        mode: "private",
        estimatedCostLkr: 12000,
        estimatedDurationMinutes: 300,
        notes: "Hired car ~5 hours. Can stop at Udawalawe National Park en route.",
      },
      {
        mode: "mixed",
        estimatedCostLkr: 900,
        estimatedDurationMinutes: 360,
        notes: "Hired van to Matara (2.5 hrs), then scenic coastal train to Galle (45 min). Good balance of cost and comfort.",
      },
    ],
  },

  // ── Nuwara Eliya → Ella ───────────────────────────────────────────────
  {
    id: "nuwara-eliya-ella",
    from: "nuwara-eliya",
    to: "ella",
    distanceKm: 64,
    options: [
      {
        mode: "public",
        estimatedCostLkr: 350,
        estimatedDurationMinutes: 150,
        notes: "Train from Nanu Oya (10 km from Nuwara Eliya) to Ella (~2.5 hrs, continuing the hill-country scenic route). Tuk-tuk to Nanu Oya station ~LKR 400.",
      },
      {
        mode: "private",
        estimatedCostLkr: 5000,
        estimatedDurationMinutes: 120,
        notes: "Hired car/tuk-tuk ~2 hours via mountain roads. Shorter but more winding than the train journey.",
      },
      {
        mode: "mixed",
        estimatedCostLkr: 600,
        estimatedDurationMinutes: 150,
        notes: "Tuk-tuk to Nanu Oya station (LKR 400), scenic train to Ella. Highly recommended continuation of the hill-country rail journey.",
      },
    ],
  },
];

// ── Helper: get leg for a given from/to pair ─────────────────────────────────

/**
 * Returns the transport leg for a from/to pair, checking both directions.
 * Returns undefined if no route is defined.
 */
export function getTransportLeg(
  from: string,
  to: string
): TransportLeg | undefined {
  const direct = transportLegs.find(
    (l) => l.from === from && l.to === to
  );
  if (direct) return direct;

  // Return the reverse leg with from/to swapped — costs are symmetric
  const reverse = transportLegs.find(
    (l) => l.from === to && l.to === from
  );
  if (reverse) {
    return { ...reverse, from, to, id: `${from}-${to}` };
  }

  return undefined;
}

/**
 * Estimated accommodation costs in LKR per room per night by travel style.
 * These are rough mid-point estimates for illustrative purposes.
 */
export const accommodationCostLkrPerNight: Record<
  "budget" | "balanced" | "premium",
  Record<string, number>
> = {
  budget: {
    ella: 3500,
    kandy: 3000,
    galle: 4000,
    "nuwara-eliya": 3000,
    colombo: 4500,
  },
  balanced: {
    ella: 8000,
    kandy: 7000,
    galle: 10000,
    "nuwara-eliya": 7500,
    colombo: 12000,
  },
  premium: {
    ella: 25000,
    kandy: 22000,
    galle: 35000,
    "nuwara-eliya": 28000,
    colombo: 45000,
  },
};

/**
 * Estimated daily food costs in LKR per person by travel style.
 */
export const foodCostLkrPerPersonPerDay: Record<
  "budget" | "balanced" | "premium",
  number
> = {
  budget: 1200,
  balanced: 3000,
  premium: 7000,
};
