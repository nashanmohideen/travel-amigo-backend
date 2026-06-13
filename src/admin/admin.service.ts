import { Injectable, NotFoundException } from "@nestjs/common";
import type { Feedback, Place, Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import type { UpdatePlaceDto } from "./dto/admin.dto";

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  listFeedback(): Promise<Feedback[]> {
    return this.prisma.feedback.findMany({
      orderBy: { createdAt: "desc" },
      include: { user: { select: { id: true, email: true } } },
    });
  }

  async updatePlace(id: string, dto: UpdatePlaceDto): Promise<Place> {
    const existing = await this.prisma.place.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException("Place not found");

    return this.prisma.place.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        bestTimeToVisit: dto.bestTimeToVisit,
        travelTip: dto.travelTip,
        estimatedCostLkr: dto.estimatedCostLkr,
        estimatedVisitDurationMinutes: dto.estimatedVisitDurationMinutes,
        rating: dto.rating,
        openingHours: dto.openingHours as Prisma.InputJsonValue | undefined,
        tags: dto.tags,
      },
    });
  }
}
