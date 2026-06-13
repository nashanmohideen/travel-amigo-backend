import { Type } from "class-transformer";
import {
  IsArray,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from "class-validator";
import type {
  TransportMode,
  TravelStyle,
  TripPace,
} from "../../common/types/domain";

/**
 * TripInput contract from the frontend planning form
 * (travel-amigo/types/index.ts). Ranges mirror lib/validation/tripValidation.ts.
 */
export class GenerateTripDto {
  @IsString()
  @IsNotEmpty()
  destination!: string;

  @IsInt()
  @Min(1)
  @Max(14)
  duration!: number;

  @IsInt()
  @Min(1)
  @Max(20)
  travelers!: number;

  @IsInt()
  @Min(1)
  budgetLKR!: number;

  @IsIn(["budget", "balanced", "premium"])
  travelStyle!: TravelStyle;

  @IsArray()
  @IsString({ each: true })
  interests!: string[];

  @IsIn(["public", "private", "mixed"])
  transportMode!: TransportMode;

  @IsIn(["relaxed", "balanced", "packed"])
  pace!: TripPace;
}

/** Create/save a trip from a rendered GeneratedItinerary snapshot. */
export class CreateTripDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;

  @IsInt()
  @Min(0)
  budget!: number;

  /** The exact GeneratedItinerary rendered by the frontend. */
  @IsObject()
  itinerarySnapshot!: Record<string, unknown>;
}

export class UpdateTripDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  title?: string;

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  budget?: number;

  @IsOptional()
  @IsIn(["draft", "active", "archived"])
  status?: "draft" | "active" | "archived";

  @IsOptional()
  @IsObject()
  itinerarySnapshot?: Record<string, unknown>;
}

export class AddItineraryItemDto {
  @IsInt()
  @Min(1)
  dayNumber!: number;

  @IsString()
  @IsNotEmpty()
  placeId!: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsIn(["public", "private", "mixed"])
  transportMode?: TransportMode;
}

export class UpdateItineraryItemDto {
  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  duration?: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsIn(["public", "private", "mixed"])
  transportMode?: TransportMode;

  @IsOptional()
  @IsInt()
  @Min(0)
  estimatedCost?: number;
}

/** Wrapper kept for parity with the FE's nested update payloads. */
export class SnapshotDto {
  @IsObject()
  @ValidateNested()
  @Type(() => Object)
  snapshot!: Record<string, unknown>;
}
