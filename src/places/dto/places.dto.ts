import { IsIn, IsOptional, IsString } from "class-validator";

/** Query filters for GET /api/v1/places (mirrors the FE PlaceSearchParams). */
export class ListPlacesQueryDto {
  @IsOptional()
  @IsString()
  destination?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsIn(["budget", "balanced", "premium"])
  travelStyle?: "budget" | "balanced" | "premium";

  /** Comma-separated interest tags, e.g. "nature,photography". */
  @IsOptional()
  @IsString()
  interests?: string;
}
