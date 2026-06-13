import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { randomBytes } from "node:crypto";
import type { Feedback, Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { EmailQueueService } from "../jobs/email/email-queue.service";
import type { GeneratedItinerary } from "../common/types/domain";
import type { CreateShareDto, SubmitFeedbackDto } from "./dto/social.dto";

const SHARE_TOKEN_TTL_DAYS = 30;

/** Reserved system account that owns trips shared by anonymous guests. */
const GUEST_USER_EMAIL = "guest@travelamigo.system";

/** Response shape the frontend ShareModal consumes (ShareLinkResponse). */
export interface ShareLinkResult {
  ok: true;
  token: string;
  url: string;
  expiresAt: string | null;
}

@Injectable()
export class SocialService {
  private readonly clientUrl: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailQueue: EmailQueueService,
    config: ConfigService
  ) {
    this.clientUrl = config.get<string>("CLIENT_URL") ?? "http://localhost:3000";
  }

  /**
   * Create a share token. Authenticated users can share a saved trip by
   * tripId; otherwise the posted itinerary snapshot is stored as a trip
   * (owned by the caller, or by the reserved guest account for anonymous
   * shares) so the share link resolves server-side — no more browser-local
   * share links.
   */
  async createShare(dto: CreateShareDto, userId?: string): Promise<ShareLinkResult> {
    let tripId = dto.tripId;

    if (tripId) {
      const trip = await this.prisma.trip.findFirst({
        where: { id: tripId, ...(userId ? { userId } : {}) },
      });
      if (!trip) throw new NotFoundException("Trip not found");
    } else {
      const itinerary = dto.itinerary as unknown as GeneratedItinerary | undefined;
      if (!itinerary || !Array.isArray(itinerary.days)) {
        throw new BadRequestException("Provide tripId or a GeneratedItinerary in 'itinerary'");
      }
      const ownerId = userId ?? (await this.ensureGuestUser());
      const trip = await this.prisma.trip.create({
        data: {
          userId: ownerId,
          title: itinerary.title ?? "Shared itinerary",
          budget: itinerary.tripInput?.budgetLKR ?? 0,
          status: "draft",
          itinerarySnapshot: itinerary as unknown as Prisma.InputJsonValue,
        },
      });
      tripId = trip.id;
    }

    const token = randomBytes(16).toString("hex");
    const expiresAt = new Date(Date.now() + SHARE_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);
    const share = await this.prisma.shareToken.create({
      data: { tripId, token, expiresAt },
      include: { trip: true },
    });

    const url = `${this.clientUrl}/shared/${token}`;
    if (dto.inviteEmail) {
      await this.emailQueue.enqueueTripInvite(dto.inviteEmail, share.trip.title, url);
    }

    return { ok: true, token, url, expiresAt: expiresAt.toISOString() };
  }

  /** Public: resolve a share token to its itinerary snapshot and count the view. */
  async getShared(token: string): Promise<GeneratedItinerary> {
    const share = await this.prisma.shareToken.findUnique({
      where: { token },
      include: { trip: true },
    });
    if (!share) throw new NotFoundException("Shared itinerary not found");
    if (share.expiresAt && share.expiresAt < new Date()) {
      throw new NotFoundException("This share link has expired");
    }

    await this.prisma.shareToken.update({
      where: { id: share.id },
      data: { viewCount: { increment: 1 } },
    });

    return share.trip.itinerarySnapshot as unknown as GeneratedItinerary;
  }

  /** Store feedback; the full FE payload is preserved in Feedback.payload. */
  async submitFeedback(
    dto: SubmitFeedbackDto,
    userId?: string
  ): Promise<{ ok: true; id: string; message: string }> {
    // FE itineraryId is a client-generated id — only link when it matches a real trip
    let tripId: string | null = null;
    if (dto.itineraryId) {
      const trip = await this.prisma.trip.findUnique({ where: { id: dto.itineraryId } });
      tripId = trip?.id ?? null;
    }

    const feedback = await this.prisma.feedback.create({
      data: {
        userId: userId ?? null,
        tripId,
        type: dto.source ?? "itinerary_page",
        content: dto.missingOrUnrealistic ?? "",
        rating: dto.usefulnessRating,
        payload: dto as unknown as Prisma.InputJsonValue,
      },
    });

    return { ok: true, id: feedback.id, message: "Feedback submitted" };
  }

  /** Admin-gated listing, newest first. */
  listFeedback(): Promise<Feedback[]> {
    return this.prisma.feedback.findMany({ orderBy: { createdAt: "desc" } });
  }

  // ── internals ────────────────────────────────────────────────────────────

  private async ensureGuestUser(): Promise<string> {
    const guest = await this.prisma.user.upsert({
      where: { email: GUEST_USER_EMAIL },
      create: {
        email: GUEST_USER_EMAIL,
        // Random unusable password hash — this account can never log in
        passwordHash: randomBytes(32).toString("hex"),
      },
      update: {},
    });
    return guest.id;
  }
}
