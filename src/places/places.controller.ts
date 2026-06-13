import { Controller, Get, Param, Query, UseGuards } from "@nestjs/common";
import { PlacesService } from "./places.service";
import { ListPlacesQueryDto } from "./dto/places.dto";
import { OptionalJwtGuard } from "../auth/guards/optional-jwt.guard";

/**
 * Place catalogue. All Google Places API traffic happens server-side in
 * GoogleApiService (Redis-cached) — the frontend never calls Google directly.
 */
@Controller("places")
@UseGuards(OptionalJwtGuard)
export class PlacesController {
  constructor(private readonly places: PlacesService) {}

  /** GET /api/v1/places?destination=ella&category=nature&interests=nature,photography */
  @Get()
  list(@Query() query: ListPlacesQueryDto) {
    return this.places.list(query);
  }

  /** GET /api/v1/places/:id — detail with cached Google enrichment. */
  @Get(":id")
  get(@Param("id") id: string) {
    return this.places.getById(id);
  }
}
