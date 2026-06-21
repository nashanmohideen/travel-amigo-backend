import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  UseGuards,
} from "@nestjs/common";
import { SocialService } from "./social.service";
import { CreateShareDto, SubmitFeedbackDto } from "./dto/social.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { OptionalJwtGuard } from "../auth/guards/optional-jwt.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { CurrentUser, type AuthUser } from "../common/decorators/current-user.decorator";

@Controller()
export class SocialController {
  constructor(private readonly social: SocialService) {}

  /** POST /api/v1/share/create-link — generate a share token for a trip (guests allowed). */
  @Post("share/create-link")
  @UseGuards(OptionalJwtGuard)
  createShareLink(@Body() dto: CreateShareDto, @CurrentUser() user?: AuthUser) {
    return this.social.createShare(dto, user?.id);
  }

  /** GET /api/v1/share/:token/view — resolve a share token and return the shared itinerary (public). */
  @Get("share/:token/view")
  getSharedItinerary(@Param("token") token: string) {
    return this.social.getShared(token);
  }

  /** POST /api/v1/feedback/submit — submit user feedback (guests allowed). */
  @Post("feedback/submit")
  @HttpCode(201)
  @UseGuards(OptionalJwtGuard)
  submitUserFeedback(@Body() dto: SubmitFeedbackDto, @CurrentUser() user?: AuthUser) {
    return this.social.submitFeedback(dto, user?.id);
  }

  /** GET /api/v1/feedback/all — list all feedback submissions (admin only). */
  @Get("feedback/all")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin")
  listAllFeedback() {
    return this.social.listFeedback();
  }
}
