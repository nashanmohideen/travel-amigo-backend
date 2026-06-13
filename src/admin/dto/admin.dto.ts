import {
  IsArray,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
} from "class-validator";

/** PUT /api/v1/admin/places/:id — editable place content fields. */
export class UpdatePlaceDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  bestTimeToVisit?: string;

  @IsOptional()
  @IsString()
  travelTip?: string;

  @IsOptional()
  @IsNumber()
  estimatedCostLkr?: number;

  @IsOptional()
  @IsNumber()
  estimatedVisitDurationMinutes?: number;

  @IsOptional()
  @IsNumber()
  rating?: number;

  @IsOptional()
  @IsObject()
  openingHours?: Record<string, unknown>;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}
