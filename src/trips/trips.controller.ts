import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Put,
  UseGuards,
} from "@nestjs/common";
import { TripsService } from "./trips.service";
import {
  AddItineraryItemDto,
  CreateTripDto,
  GenerateTripDto,
  UpdateItineraryItemDto,
  UpdateTripDto,
} from "./dto/trips.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { OptionalJwtGuard } from "../auth/guards/optional-jwt.guard";
import { GenerateRateLimitGuard } from "../common/guards/rate-limit.guard";
import { CurrentUser, type AuthUser } from "../common/decorators/current-user.decorator";

@Controller("trips")
export class TripsController {
  constructor(private readonly trips: TripsService) {}

  /**
   * POST /api/v1/trips/generate-itinerary — generate an itinerary from TripInput.
   * Guests allowed (OptionalJwtGuard); rate-limited to 10/hour per IP.
   * Response: GeneratedItinerary (frontend contract).
   */
  @Post("generate-itinerary")
  @HttpCode(200)
  @UseGuards(OptionalJwtGuard, GenerateRateLimitGuard)
  generateItinerary(@Body() dto: GenerateTripDto) {
    return this.trips.generate(dto);
  }

  /** GET /api/v1/trips/my-trips — list all saved trips for the authenticated user. */
  @Get("my-trips")
  @UseGuards(JwtAuthGuard)
  listUserTrips(@CurrentUser() user: AuthUser) {
    return this.trips.list(user.id);
  }

  /** GET /api/v1/trips/:id/details — get a single trip by ID (must belong to user). */
  @Get(":id/details")
  @UseGuards(JwtAuthGuard)
  getTripById(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.trips.getById(user.id, id);
  }

  /** POST /api/v1/trips/save-itinerary — save a generated/edited itinerary as a new trip. */
  @Post("save-itinerary")
  @UseGuards(JwtAuthGuard)
  createTrip(@CurrentUser() user: AuthUser, @Body() dto: CreateTripDto) {
    return this.trips.create(user.id, dto);
  }

  /** PUT /api/v1/trips/:id/update-details — update trip metadata and/or itinerary snapshot. */
  @Put(":id/update-details")
  @UseGuards(JwtAuthGuard)
  updateTrip(@CurrentUser() user: AuthUser, @Param("id") id: string, @Body() dto: UpdateTripDto) {
    return this.trips.update(user.id, id, dto);
  }

  /** DELETE /api/v1/trips/:id/delete — permanently delete a trip. */
  @Delete(":id/delete")
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  async deleteTrip(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    await this.trips.remove(user.id, id);
    return { ok: true, message: "Trip deleted successfully" };
  }

  /** POST /api/v1/trips/:id/add-item — add a new itinerary item to a trip day. */
  @Post(":id/add-item")
  @UseGuards(JwtAuthGuard)
  addItineraryItem(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Body() dto: AddItineraryItemDto
  ) {
    return this.trips.addItem(user.id, id, dto);
  }

  /** PUT /api/v1/trips/:id/items/:itemId/update — update an existing itinerary item. */
  @Put(":id/items/:itemId/update")
  @UseGuards(JwtAuthGuard)
  updateItineraryItem(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Param("itemId") itemId: string,
    @Body() dto: UpdateItineraryItemDto
  ) {
    return this.trips.updateItem(user.id, id, itemId, dto);
  }

  /** DELETE /api/v1/trips/:id/items/:itemId/remove — remove an item from an itinerary. */
  @Delete(":id/items/:itemId/remove")
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  removeItineraryItem(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Param("itemId") itemId: string
  ) {
    return this.trips.removeItem(user.id, id, itemId);
  }

  /** POST /api/v1/trips/:id/request-pdf-export — queue async PDF export for a trip. */
  @Post(":id/request-pdf-export")
  @HttpCode(202)
  @UseGuards(JwtAuthGuard)
  requestPdfExport(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.trips.requestPdfExport(user.id, id);
  }
}
