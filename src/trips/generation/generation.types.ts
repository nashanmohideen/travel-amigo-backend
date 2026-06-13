/**
 * Internal types for the itinerary generation engine (ported from the
 * frontend's lib/generateItinerary.ts + lib/placeHelpers.ts).
 */

import type {
  PlaceCategory,
  PlaceInterest,
  TransportMode,
  TravelStyle,
} from "../../common/types/domain";

/** Frontend Place shape (travel-amigo/types/index.ts) used by the generator. */
export interface GenPlace {
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

/** Estimated transport options between two destinations. */
export interface TransportLeg {
  id: string;
  from: string;
  to: string;
  distanceKm: number;
  options: {
    mode: TransportMode;
    estimatedCostLkr: number;
    estimatedDurationMinutes: number;
    notes: string;
  }[];
}
