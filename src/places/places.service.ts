import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { GoogleApiService } from "./google-api.service";
import { dbPlaceToGenPlace } from "../trips/generation/itinerary-generator.service";
import type { GenPlace } from "../trips/generation/generation.types";
import type { ListPlacesQueryDto } from "./dto/places.dto";

/** Place detail = FE Place shape + optional live Google enrichment. */
export interface PlaceDetail extends GenPlace {
  rating: number | null;
  openingHours: unknown | null;
  googlePlaceId: string | null;
}

@Injectable()
export class PlacesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly google: GoogleApiService
  ) {}

  /** Distinct destination strings ordered alphabetically (1h Redis TTL on caller). */
  async listDestinations(): Promise<string[]> {
    const rows = await this.prisma.place.findMany({
      select: { destination: true },
      distinct: ["destination"],
      orderBy: { destination: "asc" },
    });
    return rows.map((r) => r.destination);
  }

  /** Filterable list, returned in the FE Place shape. */
  async list(query: ListPlacesQueryDto): Promise<GenPlace[]> {
    const where: Prisma.PlaceWhereInput = {};
    if (query.destination) where.destination = query.destination;
    if (query.category) where.type = query.category;
    if (query.travelStyle) where.suitableFor = { has: query.travelStyle };
    if (query.interests) {
      const tags = query.interests.split(",").map((s) => s.trim()).filter(Boolean);
      if (tags.length > 0) where.interests = { hasSome: tags };
    }

    const rows = await this.prisma.place.findMany({ where, orderBy: { name: "asc" } });
    return rows.map(dbPlaceToGenPlace);
  }

  /**
   * Place detail with Google Places enrichment (rating/opening hours),
   * cached in Redis for 24h by GoogleApiService. Enrichment results are
   * persisted onto the Place row so subsequent loads are warm.
   */
  async getById(id: string): Promise<PlaceDetail> {
    const row = await this.prisma.place.findUnique({ where: { id } });
    if (!row) throw new NotFoundException("Place not found");

    let { googlePlaceId, rating, openingHours } = row;
    if (!googlePlaceId) {
      const details = await this.google.getPlaceDetails(row.name, row.lat, row.lng);
      if (details) {
        googlePlaceId = details.googlePlaceId;
        rating = details.rating;
        openingHours = details.openingHours as Prisma.JsonValue;
        await this.prisma.place.update({
          where: { id },
          data: {
            googlePlaceId,
            rating,
            openingHours: (details.openingHours ?? Prisma.JsonNull) as Prisma.InputJsonValue,
          },
        });
      }
    }

    return {
      ...dbPlaceToGenPlace(row),
      rating,
      openingHours,
      googlePlaceId,
    };
  }
}
