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
   * POST /api/v1/trips/generate — generate an itinerary from TripInput.
   * Guests allowed (OptionalJwtGuard); rate-limited to 10/hour per IP.
   * Response: GeneratedItinerary (frontend contract).
   */
  @Post("generate")
  @HttpCode(200)
  @UseGuards(OptionalJwtGuard, GenerateRateLimitGuard)
  generate(@Body() dto: GenerateTripDto) {
    return this.trips.generate(dto);
  }

  /** GET /api/v1/trips — list the user's saved trips. */
  @Get()
  @UseGuards(JwtAuthGuard)
  list(@CurrentUser() user: AuthUser) {
    return this.trips.list(user.id);
  }

  /** GET /api/v1/trips/:id */
  @Get(":id")
  @UseGuards(JwtAuthGuard)
  get(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.trips.getById(user.id, id);
  }

  /** POST /api/v1/trips — save a generated/edited itinerary as a trip. */
  @Post()
  @UseGuards(JwtAuthGuard)
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateTripDto) {
    return this.trips.create(user.id, dto);
  }

  /** PUT /api/v1/trips/:id — update trip metadata and/or itinerary snapshot. */
  @Put(":id")
  @UseGuards(JwtAuthGuard)
  update(@CurrentUser() user: AuthUser, @Param("id") id: string, @Body() dto: UpdateTripDto) {
    return this.trips.update(user.id, id, dto);
  }

  /** DELETE /api/v1/trips/:id */
  @Delete(":id")
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  async remove(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    await this.trips.remove(user.id, id);
    return { ok: true, message: "Trip deleted" };
  }

  /** POST /api/v1/trips/:id/items — add an itinerary item. */
  @Post(":id/items")
  @UseGuards(JwtAuthGuard)
  addItem(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Body() dto: AddItineraryItemDto
  ) {
    return this.trips.addItem(user.id, id, dto);
  }

  /** PUT /api/v1/trips/:id/items/:itemId — edit an itinerary item. */
  @Put(":id/items/:itemId")
  @UseGuards(JwtAuthGuard)
  updateItem(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Param("itemId") itemId: string,
    @Body() dto: UpdateItineraryItemDto
  ) {
    return this.trips.updateItem(user.id, id, itemId, dto);
  }

  /** DELETE /api/v1/trips/:id/items/:itemId — remove an itinerary item. */
  @Delete(":id/items/:itemId")
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  removeItem(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Param("itemId") itemId: string
  ) {
    return this.trips.removeItem(user.id, id, itemId);
  }

  /** POST /api/v1/trips/:id/export-pdf — queue async PDF generation. */
  @Post(":id/export-pdf")
  @HttpCode(202)
  @UseGuards(JwtAuthGuard)
  exportPdf(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.trips.requestPdfExport(user.id, id);
  }
}
