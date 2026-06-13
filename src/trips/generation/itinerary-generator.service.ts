import { Injectable } from "@nestjs/common";
import type { Place as DbPlace } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import type {
  BudgetConfidence,
  BudgetStatus,
  GeneratedBudgetBreakdown,
  GeneratedItinerary,
  GeneratedItineraryDay,
  ItineraryItem,
  PlaceCategory,
  PlaceInterest,
  TripInput,
  TripPace,
} from "../../common/types/domain";
import type { GenPlace } from "./generation.types";
import {
  accommodationCostLkrPerNight,
  foodCostLkrPerPersonPerDay,
  getTransportLeg,
} from "./transport-data";

/**
 * Server-side itinerary generator — a 1:1 port of the frontend's rule-based
 * algorithm (travel-amigo/lib/generateItinerary.ts + lib/placeHelpers.ts),
 * with places sourced from PostgreSQL instead of static data files.
 *
 * The output shape (GeneratedItinerary) matches the frontend contract exactly,
 * so the existing itinerary view renders the response without mapping.
 */
@Injectable()
export class ItineraryGeneratorService {
  constructor(private readonly prisma: PrismaService) {}

  async generate(input: TripInput): Promise<GeneratedItinerary> {
    const interests = input.interests as PlaceInterest[];

    const allForDestination = await this.loadPlaces(input.destination);

    // 1. Filter by destination + interests + travel style
    let candidates = allForDestination.filter((p) => {
      const matchesStyle = p.suitableFor.includes(input.travelStyle);
      const matchesInterest =
        interests.length === 0 || p.interests.some((i) => interests.includes(i));
      return matchesStyle && matchesInterest;
    });
    const matchingCount = candidates.length;

    // 2. Broaden to all destination places if the pool is too thin
    const neededTotal = getDailyCapacity(input.pace) * input.duration;
    if (candidates.length < neededTotal) {
      candidates = allForDestination;
    }

    // 3. Split into day buckets
    const dayBuckets = splitPlacesIntoDays(candidates, input.duration, input.pace, interests);

    // 4. Build days with time slots
    const location = DESTINATION_LABEL[input.destination] ?? input.destination;
    const days: GeneratedItineraryDay[] = dayBuckets.map((places, idx) => {
      const dayNum = idx + 1;
      const items = assignTimeSlots(places, input.travelers);
      return {
        day: dayNum,
        title: getDayTitle(places, dayNum),
        location,
        items,
        transportNote: buildTransportNote(dayNum, input),
        totalCostLkr: items.reduce((s, item) => s + item.estimatedCostLkr, 0),
      };
    });

    // 5–7. Budget, status, confidence, warnings, tips
    const budget = calculateBudgetBreakdown(input, dayBuckets);
    const budgetStatus = getBudgetStatus(budget, input);
    const budgetConfidence = getBudgetConfidence(matchingCount, budgetStatus);
    const warnings = buildWarnings(input, matchingCount, budgetStatus);
    const tips = getTipsForDestination(input.destination);

    const now = new Date().toISOString();
    return {
      id: `gen-${input.destination}-${input.duration}d-${Date.now()}`,
      title: buildTitle(input),
      destination: input.destination,
      tripInput: input,
      days,
      budget,
      budgetStatus,
      budgetConfidence,
      warnings,
      tips,
      createdAt: now,
      generatedAt: now,
    };
  }

  /** Loads DB places for a destination, mapped back to the frontend Place shape. */
  async loadPlaces(destination: string): Promise<GenPlace[]> {
    const rows = await this.prisma.place.findMany({ where: { destination } });
    return rows.map(dbPlaceToGenPlace);
  }
}

/** Maps a Prisma Place row to the frontend Place contract. */
export function dbPlaceToGenPlace(row: DbPlace): GenPlace {
  return {
    id: row.id,
    name: row.name,
    destination: row.destination,
    category: row.type as PlaceCategory,
    tags: row.tags,
    shortDescription: row.description,
    estimatedVisitDurationMinutes: row.estimatedVisitDurationMinutes,
    estimatedCostLkr: row.estimatedCostLkr,
    bestTimeToVisit: row.bestTimeToVisit,
    travelTip: row.travelTip,
    latitude: row.lat,
    longitude: row.lng,
    gradientPlaceholder: row.gradientPlaceholder,
    suitableFor: row.suitableFor as GenPlace["suitableFor"],
    interests: row.interests as PlaceInterest[],
  };
}

// ── Constants (ported verbatim from the frontend) ──────────────────────────

const DESTINATION_LABEL: Record<string, string> = {
  ella: "Ella",
  kandy: "Kandy",
  galle: "Galle",
  "nuwara-eliya": "Nuwara Eliya",
  colombo: "Colombo",
};

const DAY_START_MINUTES = 8 * 60; // 08:00
const TRAVEL_BUFFER_MINUTES = 30;

export const categoryEmoji: Record<string, string> = {
  nature: "🌿",
  culture: "🛕",
  food: "🍛",
  adventure: "🧗",
  beach: "🏖️",
  photography: "📸",
  shopping: "🛍️",
  wellness: "🧘",
  wildlife: "🐆",
  viewpoint: "🔭",
  relaxation: "😌",
};

const CATEGORY_TITLES: Partial<Record<PlaceCategory, string[]>> = {
  nature: ["Into the Wilderness", "Nature & Trails", "Green Horizons", "Hills & Valleys"],
  culture: ["Cultural Immersion", "Heritage Trail", "Temples & Traditions", "Living History"],
  food: ["Taste of Sri Lanka", "Flavours & Markets", "Culinary Discovery"],
  adventure: ["Adventure Day", "Off the Beaten Path", "Trails & Peaks"],
  beach: ["Coastal Day", "Sun & Surf", "Seaside Escape"],
  photography: ["Golden Hour", "Through the Lens", "Frames & Light"],
  viewpoint: ["The Long View", "Elevated Horizons", "Panoramic Day"],
  shopping: ["Local Finds", "Markets & Crafts"],
  wellness: ["Rest & Restore", "Slow Travel Day"],
  wildlife: ["Wildlife Encounter", "Into the Wild"],
};

const LOCAL_TRANSPORT_NOTES: Record<string, string> = {
  public: "Getting around by local buses and three-wheelers (tuk-tuks).",
  private: "Private hired vehicle with driver for comfortable door-to-door travel.",
  mixed: "Mix of tuk-tuks for short hops and local buses for longer stretches.",
};

const DAILY_LOCAL_TRANSPORT_LKR: Record<string, number> = {
  public: 800,
  private: 2500,
  mixed: 1200,
};

const DESTINATION_TIPS: Record<string, string[]> = {
  ella: [
    "The Kandy–Ella train is world-famous — book reserved seats at least 3 days ahead.",
    "Start hikes before 7 am to beat the heat and cloud cover.",
    "Tuk-tuk fares in Ella are negotiable — agree on a price before you set off.",
    "Pack a layer for evenings; Ella gets cooler than expected at 1,000 m elevation.",
  ],
  kandy: [
    "The evening puja at the Temple of the Tooth (6:30 pm) is one of Sri Lanka's great experiences.",
    "Dress modestly (shoulders and knees covered) for all temple visits.",
    "Kandy's tuk-tuks don't always use meters — negotiate or use a ride-hailing app.",
    "The Kandyan dance show is touristy but genuinely impressive; the fire walk finale is unmissable.",
  ],
  galle: [
    "Galle Fort is best explored on foot — the rampart walk takes about 45 minutes at a leisurely pace.",
    "The south-coast sea can be rough May–October; check surf conditions before swimming.",
    "Pedlar Street and Church Street have the best cafés and boutiques inside the fort.",
    "Stilt fishermen near Koggala usually request a small fee for close-up photography.",
  ],
  "nuwara-eliya": [
    "Pack warm layers — Nuwara Eliya sits at 1,800 m and can dip below 10°C at night.",
    "The scenic train from Kandy to Nanu Oya station is one of the world's great rail journeys.",
    "Horton Plains clouds in after 10 am — start the World's End trail at dawn for the clearest views.",
    "April and August are the best months for the floral displays at Victoria Park and Hakgala Gardens.",
  ],
  colombo: [
    "Colombo's traffic can be severe — allow extra time between sights and travel during off-peak hours.",
    "The Fort and Pettah areas are safe for walking but keep valuables secure in market areas.",
    "Try kottu roti at a local spot for under LKR 500 — it's a better version than tourist restaurant prices.",
    "The Galle Face Green is at its best at sunset — arrive 30 minutes before for a good spot along the wall.",
  ],
};

// ── Pure helpers (ported verbatim) ──────────────────────────────────────────

function toTimeString(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function getDailyCapacity(pace: TripPace): number {
  return { relaxed: 2, balanced: 3, packed: 4 }[pace];
}

function scorePlaceByInterests(place: GenPlace, interests: PlaceInterest[]): number {
  if (interests.length === 0) return 50;
  const matches = place.interests.filter((i) => interests.includes(i)).length;
  return Math.round((matches / Math.max(place.interests.length, 1)) * 100);
}

export function rankPlaces(candidates: GenPlace[], interests: PlaceInterest[]): GenPlace[] {
  return [...candidates].sort(
    (a, b) => scorePlaceByInterests(b, interests) - scorePlaceByInterests(a, interests)
  );
}

function selectPlacesForDay(
  candidates: GenPlace[],
  interests: PlaceInterest[],
  maxPlaces: number,
  availableMinutes = 480
): GenPlace[] {
  const ranked = rankPlaces(candidates, interests);
  const selected: GenPlace[] = [];
  let totalMinutes = 0;

  for (const place of ranked) {
    if (selected.length >= maxPlaces) break;
    if (totalMinutes + place.estimatedVisitDurationMinutes > availableMinutes) continue;
    selected.push(place);
    totalMinutes += place.estimatedVisitDurationMinutes;
  }
  return selected;
}

export function splitPlacesIntoDays(
  candidates: GenPlace[],
  duration: number,
  pace: TripPace,
  interests: PlaceInterest[]
): GenPlace[][] {
  const capacity = getDailyCapacity(pace);
  const MAX_DAY_MINUTES = 9 * 60;

  const ranked = rankPlaces(candidates, interests);
  const used = new Set<string>();
  const days: GenPlace[][] = [];

  for (let d = 0; d < duration; d++) {
    const pool = ranked.filter((p) => !used.has(p.id));
    const dayPlaces = selectPlacesForDay(pool, interests, capacity, MAX_DAY_MINUTES);
    dayPlaces.forEach((p) => used.add(p.id));
    days.push(dayPlaces);
  }
  return days;
}

export function assignTimeSlots(places: GenPlace[], travelers: number): ItineraryItem[] {
  let cursor = DAY_START_MINUTES;

  return places.map((place, idx) => {
    const startMin = cursor;
    const endMin = cursor + place.estimatedVisitDurationMinutes;
    cursor = endMin + TRAVEL_BUFFER_MINUTES;

    return {
      id: `item-${place.id}-${idx}`,
      placeId: place.id,
      placeName: place.name,
      category: place.category,
      startTime: toTimeString(startMin),
      endTime: toTimeString(endMin),
      estimatedCostLkr: place.estimatedCostLkr * travelers,
      notes: place.travelTip,
      emoji: categoryEmoji[place.category] ?? "📍",
      shortDescription: place.shortDescription,
      bestTimeToVisit: place.bestTimeToVisit,
      estimatedVisitDurationMinutes: place.estimatedVisitDurationMinutes,
      gradientPlaceholder: place.gradientPlaceholder,
    };
  });
}

function getDayTitle(places: GenPlace[], dayNum: number): string {
  const lead = places[0];
  if (!lead) return `Day ${dayNum} — Explore`;
  const options = CATEGORY_TITLES[lead.category] ?? ["Explore"];
  return options[(dayNum - 1) % options.length];
}

function buildTransportNote(dayNum: number, input: TripInput): string {
  if (dayNum === 1 && input.destination !== "colombo") {
    const leg = getTransportLeg("colombo", input.destination);
    const option =
      leg?.options.find((o) => o.mode === input.transportMode) ??
      leg?.options.find((o) => o.mode === "mixed") ??
      leg?.options[0];
    if (option) return option.notes;
  }
  return LOCAL_TRANSPORT_NOTES[input.transportMode] ?? "Tuk-tuk recommended.";
}

export function calculateBudgetBreakdown(
  input: TripInput,
  dayBuckets: GenPlace[][]
): GeneratedBudgetBreakdown {
  const { destination, duration, travelers, travelStyle, transportMode } = input;

  const activities = dayBuckets
    .flat()
    .reduce((sum, p) => sum + p.estimatedCostLkr * travelers, 0);

  const rooms = Math.ceil(travelers / 2);
  const nightRate = accommodationCostLkrPerNight[travelStyle]?.[destination] ?? 6000;
  const accommodation = rooms * duration * nightRate;

  const foodRate = foodCostLkrPerPersonPerDay[travelStyle] ?? 2000;
  const food = foodRate * travelers * duration;

  const leg = getTransportLeg("colombo", destination);
  const arrivalOption =
    leg?.options.find((o) => o.mode === transportMode) ??
    leg?.options.find((o) => o.mode === "mixed") ??
    leg?.options[0];
  const arrivalCost = destination === "colombo" ? 0 : (arrivalOption?.estimatedCostLkr ?? 3000);
  const localCost = (DAILY_LOCAL_TRANSPORT_LKR[transportMode] ?? 1200) * duration;
  const transport = arrivalCost + localCost;

  const subtotal = activities + accommodation + food + transport;
  const buffer = Math.round(subtotal * 0.1);
  const miscellaneous = 0;
  const total = subtotal + buffer;
  const perPerson = Math.round(total / Math.max(travelers, 1));

  return {
    accommodation,
    food,
    transport,
    activities,
    buffer,
    miscellaneous,
    total,
    perPerson,
    currency: "LKR",
  };
}

export function getBudgetStatus(
  breakdown: GeneratedBudgetBreakdown,
  input: TripInput
): BudgetStatus {
  const ratio = breakdown.total / Math.max(input.budgetLKR, 1);
  if (ratio <= 0.9) return "within_budget";
  if (ratio <= 1.1) return "tight_budget";
  return "over_budget";
}

function getBudgetConfidence(matchingPlacesCount: number, status: BudgetStatus): BudgetConfidence {
  if (status === "within_budget" && matchingPlacesCount >= 6) return "high";
  if (status === "over_budget" || matchingPlacesCount < 4) return "low";
  return "medium";
}

function buildWarnings(
  input: TripInput,
  matchingPlacesCount: number,
  status: BudgetStatus
): string[] {
  const warnings: string[] = [];

  const perPersonPerDay =
    input.budgetLKR / (Math.max(input.travelers, 1) * Math.max(input.duration, 1));
  if (perPersonPerDay < 3500) {
    warnings.push(
      "Very low daily budget — some accommodation and activity costs may exceed this allowance."
    );
  }

  const neededPlaces = getDailyCapacity(input.pace) * input.duration;
  if (matchingPlacesCount < neededPlaces) {
    warnings.push(
      `Only ${matchingPlacesCount} place${matchingPlacesCount === 1 ? "" : "s"} match your selected interests. Some days may have fewer activities than planned.`
    );
  }

  if (status === "over_budget") {
    warnings.push(
      "Estimated total cost exceeds your stated budget. Consider reducing the trip length, number of travellers, or choosing a lower travel style."
    );
  } else if (status === "tight_budget") {
    warnings.push(
      "Estimated costs are close to your budget. Build in a small contingency for tuk-tuks, snacks, and unexpected extras."
    );
  }

  if (input.pace === "packed") {
    warnings.push(
      "Packed pace may feel rushed in Sri Lanka — roads and tuk-tuks can be slower than expected. Allow buffer time between activities."
    );
  }

  warnings.push(
    "All costs are estimates based on approximate 2024–2025 traveller prices and may vary significantly."
  );

  return warnings;
}

function buildTitle(input: TripInput): string {
  const dest = DESTINATION_LABEL[input.destination] ?? input.destination;
  const styleLabel: Record<string, string> = {
    budget: "Budget",
    balanced: "Classic",
    premium: "Luxury",
  };
  return `${input.duration}-Day ${styleLabel[input.travelStyle] ?? "Classic"} ${dest}`;
}

export function getTipsForDestination(destination: string): string[] {
  return (
    DESTINATION_TIPS[destination] ?? [
      "Carry small LKR denominations for tuk-tuks and market stalls.",
      "Dress respectfully at religious sites — cover shoulders and knees.",
      "Bottled water is widely available; roadside king coconut (thambili) is safe and refreshing.",
    ]
  );
}
