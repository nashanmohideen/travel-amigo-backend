import {
  IsBoolean,
  IsEmail,
  IsIn,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Max,
  Min,
} from "class-validator";

/**
 * POST /api/v1/share payload.
 * The frontend sends { itinerary } (CreateShareLinkRequest in
 * features/api/apiTypes.ts); authenticated clients may send tripId instead
 * to share an already-saved trip.
 */
export class CreateShareDto {
  @IsOptional()
  @IsString()
  tripId?: string;

  @IsOptional()
  @IsObject()
  itinerary?: Record<string, unknown>;

  /** Optional: queue a send-trip-invite email to this address. */
  @IsOptional()
  @IsEmail()
  inviteEmail?: string;
}

/**
 * POST /api/v1/feedback payload — the FE FeedbackInput shape
 * (FeedbackSubmission minus id/createdAt). Core fields are validated here;
 * the full payload is preserved verbatim in Feedback.payload.
 */
export class SubmitFeedbackDto {
  @IsIn(["yes", "maybe", "no"])
  wouldUse!: "yes" | "maybe" | "no";

  @IsInt()
  @Min(1)
  @Max(5)
  usefulnessRating!: number;

  @IsIn(["too_low", "reasonable", "too_high", "not_sure"])
  budgetRealism!: "too_low" | "reasonable" | "too_high" | "not_sure";

  @IsOptional()
  @IsString()
  missingOrUnrealistic?: string;

  @IsOptional()
  wantedNext?: string[];

  @IsOptional()
  @IsBoolean()
  wasEdited?: boolean;

  @IsOptional()
  @IsString()
  source?: string;

  @IsOptional()
  @IsString()
  itineraryId?: string | null;

  @IsOptional()
  @IsString()
  destination?: string | null;

  @IsOptional()
  durationDays?: number | null;

  @IsOptional()
  travellerCount?: number | null;

  @IsOptional()
  @IsString()
  travelStyle?: string | null;

  @IsOptional()
  @IsString()
  transportMode?: string | null;

  @IsOptional()
  @IsString()
  pace?: string | null;

  @IsOptional()
  @IsString()
  budgetStatus?: string | null;

  @IsOptional()
  @IsString()
  budgetConfidence?: string | null;

  @IsOptional()
  estimatedTotalLkr?: number | null;

  @IsOptional()
  userBudgetLkr?: number | null;
}
