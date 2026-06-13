import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  GOOGLE_PLACES_CACHE_TTL,
  GOOGLE_ROUTES_CACHE_TTL,
  RedisService,
} from "../redis/redis.service";

export interface GooglePlaceDetails {
  googlePlaceId: string;
  rating: number | null;
  userRatingCount: number | null;
  openingHours: unknown | null;
}

export interface GoogleRouteEstimate {
  distanceMeters: number;
  durationSeconds: number;
}

/**
 * Server-side Google API proxy. All Google Places / Routes calls go through
 * here — the frontend never talks to Google directly and the API keys never
 * leave this service. Responses are cached in Redis (Places 24h, Routes 1h).
 */
@Injectable()
export class GoogleApiService {
  private readonly placesKey: string | undefined;
  private readonly routesKey: string | undefined;

  constructor(config: ConfigService, private readonly redis: RedisService) {
    this.placesKey = config.get<string>("GOOGLE_PLACES_API_KEY");
    this.routesKey = config.get<string>("GOOGLE_ROUTES_API_KEY");
  }

  /**
   * Looks up live place details (rating, opening hours) by text query.
   * Returns null when the key is unset or the lookup fails — callers must
   * treat enrichment as optional.
   */
  async getPlaceDetails(name: string, lat: number, lng: number): Promise<GooglePlaceDetails | null> {
    if (!this.placesKey) return null;

    const cacheKey = `gplaces:${name}:${lat.toFixed(3)}:${lng.toFixed(3)}`;
    const cached = await this.redis.getJson<GooglePlaceDetails>(cacheKey);
    if (cached) return cached;

    try {
      const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": this.placesKey,
          "X-Goog-FieldMask":
            "places.id,places.rating,places.userRatingCount,places.regularOpeningHours",
        },
        body: JSON.stringify({
          textQuery: `${name}, Sri Lanka`,
          locationBias: { circle: { center: { latitude: lat, longitude: lng }, radius: 5000 } },
          maxResultCount: 1,
        }),
      });
      if (!res.ok) return null;

      const data = (await res.json()) as {
        places?: Array<{
          id: string;
          rating?: number;
          userRatingCount?: number;
          regularOpeningHours?: unknown;
        }>;
      };
      const place = data.places?.[0];
      if (!place) return null;

      const details: GooglePlaceDetails = {
        googlePlaceId: place.id,
        rating: place.rating ?? null,
        userRatingCount: place.userRatingCount ?? null,
        openingHours: place.regularOpeningHours ?? null,
      };
      await this.redis.setJson(cacheKey, details, GOOGLE_PLACES_CACHE_TTL);
      return details;
    } catch {
      return null;
    }
  }

  /**
   * Driving route estimate between two coordinates via the Routes API.
   * Cached for 1h. Returns null when unavailable.
   */
  async getRouteEstimate(
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number }
  ): Promise<GoogleRouteEstimate | null> {
    if (!this.routesKey) return null;

    const cacheKey = `groutes:${origin.lat.toFixed(3)},${origin.lng.toFixed(3)}:${destination.lat.toFixed(3)},${destination.lng.toFixed(3)}`;
    const cached = await this.redis.getJson<GoogleRouteEstimate>(cacheKey);
    if (cached) return cached;

    try {
      const res = await fetch("https://routes.googleapis.com/directions/v2:computeRoutes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": this.routesKey,
          "X-Goog-FieldMask": "routes.distanceMeters,routes.duration",
        },
        body: JSON.stringify({
          origin: { location: { latLng: { latitude: origin.lat, longitude: origin.lng } } },
          destination: {
            location: { latLng: { latitude: destination.lat, longitude: destination.lng } },
          },
          travelMode: "DRIVE",
        }),
      });
      if (!res.ok) return null;

      const data = (await res.json()) as {
        routes?: Array<{ distanceMeters: number; duration: string }>;
      };
      const route = data.routes?.[0];
      if (!route) return null;

      const estimate: GoogleRouteEstimate = {
        distanceMeters: route.distanceMeters,
        durationSeconds: parseInt(route.duration.replace("s", ""), 10) || 0,
      };
      await this.redis.setJson(cacheKey, estimate, GOOGLE_ROUTES_CACHE_TTL);
      return estimate;
    } catch {
      return null;
    }
  }
}
