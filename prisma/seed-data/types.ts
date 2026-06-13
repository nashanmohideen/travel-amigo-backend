/**
 * Local copies of the frontend domain types (travel-amigo/types/index.ts)
 * used by the database seed. Keep in sync with the frontend contract.
 */

export type Region = "coast" | "cultural" | "hill-country" | "wildlife";

export interface Destination {
  id: string;
  name: string;
  region: Region;
  description: string;
  highlights: string[];
  bestFor: string[];
  emoji: string;
}

export type TravelStyle = "budget" | "balanced" | "premium";

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

/** A single point of interest within a destination. */
export interface Place {
  id: string;
  name: string;
  destination: string;
  category: PlaceCategory;
  tags: string[];
  shortDescription: string;
  estimatedVisitDurationMinutes: number;
  estimatedCostLkr: number;
  bestTimeToVisit: string;
  travelTip: string;
  latitude: number;
  longitude: number;
  gradientPlaceholder: string;
  suitableFor: TravelStyle[];
  interests: PlaceInterest[];
}
