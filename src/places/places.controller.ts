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

  /** GET /api/v1/places/available-destinations — list distinct destination names from the database. */
  @Get("available-destinations")
  listAvailableDestinations() {
    return this.places.listDestinations();
  }

  /** GET /api/v1/places/search?destination=ella&category=nature&interests=nature,photography */
  @Get("search")
  listPlaces(@Query() query: ListPlacesQueryDto) {
    return this.places.list(query);
  }

  /** GET /api/v1/places/:id/details — get place detail with cached Google enrichment (rating, hours). */
  @Get(":id/details")
  getPlaceById(@Param("id") id: string) {
    return this.places.getById(id);
  }
}
