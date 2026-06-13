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

  /** POST /api/v1/share — create a share token (guests allowed). */
  @Post("share")
  @UseGuards(OptionalJwtGuard)
  createShare(@Body() dto: CreateShareDto, @CurrentUser() user?: AuthUser) {
    return this.social.createShare(dto, user?.id);
  }

  /** GET /api/v1/share/:token — load a shared itinerary (public). */
  @Get("share/:token")
  getShared(@Param("token") token: string) {
    return this.social.getShared(token);
  }

  /** POST /api/v1/feedback — submit feedback (guests allowed). */
  @Post("feedback")
  @HttpCode(201)
  @UseGuards(OptionalJwtGuard)
  submitFeedback(@Body() dto: SubmitFeedbackDto, @CurrentUser() user?: AuthUser) {
    return this.social.submitFeedback(dto, user?.id);
  }

  /** GET /api/v1/feedback — list feedback (admin only). */
  @Get("feedback")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin")
  listFeedback() {
    return this.social.listFeedback();
  }
}
