import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type { Prisma, Trip } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import {
  ItineraryGeneratorService,
  assignTimeSlots,
  dbPlaceToGenPlace,
  categoryEmoji,
} from "./generation/itinerary-generator.service";
import { PdfQueueService } from "../jobs/pdf/pdf-queue.service";
import type {
  GeneratedItinerary,
  GeneratedItineraryDay,
  ItineraryItem,
  TripInput,
} from "../common/types/domain";
import type {
  AddItineraryItemDto,
  CreateTripDto,
  UpdateItineraryItemDto,
  UpdateTripDto,
} from "./dto/trips.dto";

type TripWithDays = Prisma.TripGetPayload<{
  include: { days: { include: { items: true } } };
}>;

@Injectable()
export class TripsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly generator: ItineraryGeneratorService,
    private readonly pdfQueue: PdfQueueService
  ) {}

  /** Generate an itinerary (guests allowed; nothing is persisted here). */
  generate(input: TripInput): Promise<GeneratedItinerary> {
    return this.generator.generate(input);
  }

  /** List the user's saved trips (snapshot included so the FE can render directly). */
  list(userId: string): Promise<Trip[]> {
    return this.prisma.trip.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
    });
  }

  async getById(userId: string, id: string): Promise<TripWithDays> {
    const trip = await this.prisma.trip.findFirst({
      where: { id, userId },
      include: { days: { orderBy: { dayNumber: "asc" }, include: { items: { orderBy: { order: "asc" } } } } },
    });
    if (!trip) throw new NotFoundException("Trip not found");
    return trip;
  }

  /**
   * Save a trip. Creates Trip + ItineraryDay + ItineraryItem rows from the
   * snapshot in one transaction; the snapshot Json preserves the exact
   * rendered state.
   */
  async create(userId: string, dto: CreateTripDto): Promise<Trip> {
    const snapshot = dto.itinerarySnapshot as unknown as GeneratedItinerary;
    this.assertSnapshotShape(snapshot);

    return this.prisma.$transaction(async (tx) => {
      const trip = await tx.trip.create({
        data: {
          userId,
          title: dto.title,
          startDate: dto.startDate ? new Date(dto.startDate) : null,
          endDate: dto.endDate ? new Date(dto.endDate) : null,
          budget: dto.budget,
          itinerarySnapshot: snapshot as unknown as Prisma.InputJsonValue,
        },
      });
      await this.createDaysFromSnapshot(tx, trip.id, snapshot);
      return trip;
    });
  }

  /** Update trip metadata and/or replace the itinerary (snapshot rewritten on every save). */
  async update(userId: string, id: string, dto: UpdateTripDto): Promise<Trip> {
    await this.getById(userId, id);

    return this.prisma.$transaction(async (tx) => {
      const data: Prisma.TripUpdateInput = {};
      if (dto.title !== undefined) data.title = dto.title;
      if (dto.startDate !== undefined) data.startDate = new Date(dto.startDate);
      if (dto.endDate !== undefined) data.endDate = new Date(dto.endDate);
      if (dto.budget !== undefined) data.budget = dto.budget;
      if (dto.status !== undefined) data.status = dto.status;

      if (dto.itinerarySnapshot !== undefined) {
        const snapshot = dto.itinerarySnapshot as unknown as GeneratedItinerary;
        this.assertSnapshotShape(snapshot);
        data.itinerarySnapshot = snapshot as unknown as Prisma.InputJsonValue;
        // Rebuild normalized rows to match the new snapshot
        await tx.itineraryDay.deleteMany({ where: { tripId: id } });
        await this.createDaysFromSnapshot(tx, id, snapshot);
      }

      return tx.trip.update({ where: { id }, data });
    });
  }

  async remove(userId: string, id: string): Promise<void> {
    await this.getById(userId, id);
    await this.prisma.trip.delete({ where: { id } });
  }

  /** Add an itinerary item to a day, then resync the snapshot Json. */
  async addItem(userId: string, tripId: string, dto: AddItineraryItemDto): Promise<Trip> {
    await this.getById(userId, tripId);

    return this.prisma.$transaction(async (tx) => {
      const day = await tx.itineraryDay.findFirst({
        where: { tripId, dayNumber: dto.dayNumber },
        include: { items: true },
      });
      if (!day) throw new NotFoundException(`Day ${dto.dayNumber} not found on this trip`);

      const place = await tx.place.findUnique({ where: { id: dto.placeId } });
      if (!place) throw new BadRequestException(`Unknown place: ${dto.placeId}`);

      await tx.itineraryItem.create({
        data: {
          dayId: day.id,
          placeId: place.id,
          order: dto.order ?? day.items.length,
          duration: place.estimatedVisitDurationMinutes,
          notes: dto.notes ?? place.travelTip,
          transportMode: dto.transportMode ?? "mixed",
          estimatedCost: place.estimatedCostLkr,
        },
      });

      return this.resyncSnapshot(tx, tripId);
    });
  }

  /** Edit an itinerary item, then resync the snapshot Json. */
  async updateItem(
    userId: string,
    tripId: string,
    itemId: string,
    dto: UpdateItineraryItemDto
  ): Promise<Trip> {
    await this.getById(userId, tripId);

    return this.prisma.$transaction(async (tx) => {
      const item = await tx.itineraryItem.findFirst({
        where: { id: itemId, day: { tripId } },
      });
      if (!item) throw new NotFoundException("Itinerary item not found");

      await tx.itineraryItem.update({
        where: { id: itemId },
        data: {
          order: dto.order,
          duration: dto.duration,
          notes: dto.notes,
          transportMode: dto.transportMode,
          estimatedCost: dto.estimatedCost,
        },
      });

      return this.resyncSnapshot(tx, tripId);
    });
  }

  /** Remove an itinerary item, then resync the snapshot Json. */
  async removeItem(userId: string, tripId: string, itemId: string): Promise<Trip> {
    await this.getById(userId, tripId);

    return this.prisma.$transaction(async (tx) => {
      const item = await tx.itineraryItem.findFirst({
        where: { id: itemId, day: { tripId } },
      });
      if (!item) throw new NotFoundException("Itinerary item not found");

      await tx.itineraryItem.delete({ where: { id: itemId } });
      return this.resyncSnapshot(tx, tripId);
    });
  }

  /** Queue async PDF export; the worker writes Trip.pdfUrl when finished. */
  async requestPdfExport(userId: string, tripId: string): Promise<{ ok: boolean; message: string }> {
    await this.getById(userId, tripId);
    await this.pdfQueue.enqueueGeneratePdf(tripId);
    return { ok: true, message: "PDF generation queued — pdfUrl will appear on the trip shortly" };
  }

  // ── internals ────────────────────────────────────────────────────────────

  private assertSnapshotShape(snapshot: GeneratedItinerary): void {
    if (!snapshot || !Array.isArray(snapshot.days) || !snapshot.tripInput) {
      throw new BadRequestException("itinerarySnapshot must be a GeneratedItinerary");
    }
  }

  /** Creates ItineraryDay + ItineraryItem rows mirroring a snapshot. */
  private async createDaysFromSnapshot(
    tx: Prisma.TransactionClient,
    tripId: string,
    snapshot: GeneratedItinerary
  ): Promise<void> {
    const knownPlaceIds = new Set(
      (
        await tx.place.findMany({
          where: { id: { in: snapshot.days.flatMap((d) => d.items.map((i) => i.placeId)) } },
          select: { id: true },
        })
      ).map((p) => p.id)
    );

    for (const day of snapshot.days) {
      await tx.itineraryDay.create({
        data: {
          tripId,
          dayNumber: day.day,
          title: day.title,
          location: day.location,
          transportNote: day.transportNote,
          totalCostLkr: day.totalCostLkr,
          items: {
            create: day.items
              // Skip items referencing places not in the DB (e.g. stale FE data)
              .filter((item) => knownPlaceIds.has(item.placeId))
              .map((item, idx) => ({
                placeId: item.placeId,
                order: idx,
                duration: item.estimatedVisitDurationMinutes,
                notes: item.notes,
                transportMode: snapshot.tripInput.transportMode,
                estimatedCost: item.estimatedCostLkr,
                startTime: item.startTime,
                endTime: item.endTime,
              })),
          },
        },
      });
    }
  }

  /**
   * Rebuilds the itinerarySnapshot Json from the normalized rows after an
   * item-level edit, reassigning time slots and recalculating day totals —
   * the snapshot is written on every save so the rendered state is preserved.
   */
  private async resyncSnapshot(tx: Prisma.TransactionClient, tripId: string): Promise<Trip> {
    const trip = await tx.trip.findUniqueOrThrow({
      where: { id: tripId },
      include: {
        days: {
          orderBy: { dayNumber: "asc" },
          include: { items: { orderBy: { order: "asc" }, include: { place: true } } },
        },
      },
    });

    const snapshot = trip.itinerarySnapshot as unknown as GeneratedItinerary;
    const travelers = snapshot.tripInput?.travelers ?? 1;

    const days: GeneratedItineraryDay[] = trip.days.map((day) => {
      const genPlaces = day.items.map((i) => dbPlaceToGenPlace(i.place));
      const items: ItineraryItem[] = assignTimeSlots(genPlaces, travelers).map((slot, idx) => ({
        ...slot,
        notes: day.items[idx].notes || slot.notes,
        emoji: categoryEmoji[slot.category] ?? "📍",
      }));
      return {
        day: day.dayNumber,
        title: day.title,
        location: day.location,
        transportNote: day.transportNote,
        items,
        totalCostLkr: items.reduce((s, i) => s + i.estimatedCostLkr, 0),
      };
    });

    const activities = days.flatMap((d) => d.items).reduce((s, i) => s + i.estimatedCostLkr, 0);
    const { accommodation, food, transport, miscellaneous } = snapshot.budget;
    const subtotal = activities + accommodation + food + transport;
    const buffer = Math.round(subtotal * 0.1);
    const total = subtotal + buffer;
    const perPerson = Math.round(total / Math.max(travelers, 1));

    const updatedSnapshot: GeneratedItinerary = {
      ...snapshot,
      days,
      budget: {
        ...snapshot.budget,
        activities,
        buffer,
        miscellaneous,
        total,
        perPerson,
      },
    };

    // Persist refreshed day totals alongside the snapshot
    for (const day of trip.days) {
      const updated = days.find((d) => d.day === day.dayNumber);
      if (updated) {
        await tx.itineraryDay.update({
          where: { id: day.id },
          data: { totalCostLkr: updated.totalCostLkr },
        });
      }
    }

    return tx.trip.update({
      where: { id: tripId },
      data: { itinerarySnapshot: updatedSnapshot as unknown as Prisma.InputJsonValue },
    });
  }
}
