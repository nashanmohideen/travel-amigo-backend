/**
 * Domain types mirroring the frontend contract (travel-amigo/types/index.ts).
 * These are the exact shapes the frontend renders — keep field names in sync.
 */

export type TravelStyle = "budget" | "balanced" | "premium";
export type TransportMode = "public" | "private" | "mixed";
export type TripPace = "relaxed" | "balanced" | "packed";

export type PlaceCategory =
  | "nature"
  | "culture"
  | "food"
  | "adventure"
  | "beach"
  | "photography"
  | "shopping"
  | "wellness"
  | "wildlife"
  | "viewpoint";

export type PlaceInterest =
  | "nature"
  | "culture"
  | "food"
  | "adventure"
  | "beaches"
  | "photography"
  | "family"
  | "relaxation";

export interface TripInput {
  destination: string;
  duration: number;
  travelers: number;
  budgetLKR: number;
  travelStyle: TravelStyle;
  interests: string[];
  transportMode: TransportMode;
  pace: TripPace;
}

export interface ItineraryItem {
  id: string;
  placeId: string;
  placeName: string;
  category: PlaceCategory;
  startTime: string;
  endTime: string;
  estimatedCostLkr: number;
  notes: string;
  emoji: string;
  shortDescription: string;
  bestTimeToVisit: string;
  estimatedVisitDurationMinutes: number;
  gradientPlaceholder: string;
}

export interface GeneratedItineraryDay {
  day: number;
  title: string;
  location: string;
  items: ItineraryItem[];
  transportNote: string;
  totalCostLkr: number;
}

export type BudgetStatus = "within_budget" | "tight_budget" | "over_budget";
export type BudgetConfidence = "high" | "medium" | "low";

export interface GeneratedBudgetBreakdown {
  accommodation: number;
  food: number;
  transport: number;
  activities: number;
  buffer: number;
  miscellaneous: number;
  total: number;
  perPerson: number;
  currency: "LKR";
}

export interface GeneratedItinerary {
  id: string;
  title: string;
  destination: string;
  tripInput: TripInput;
  days: GeneratedItineraryDay[];
  budget: GeneratedBudgetBreakdown;
  budgetStatus: BudgetStatus;
  budgetConfidence: BudgetConfidence;
  warnings: string[];
  tips: string[];
  createdAt: string;
  generatedAt: string;
}

/** Standard error shape expected by the frontend (features/api/apiTypes.ts). */
export interface ApiError {
  message: string;
  code?: string;
  details?: unknown;
}
