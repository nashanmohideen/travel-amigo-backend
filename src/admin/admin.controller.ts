import { Body, Controller, Get, Param, Put, UseGuards } from "@nestjs/common";
import { AdminService } from "./admin.service";
import { UpdatePlaceDto } from "./dto/admin.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";

/** All admin routes require an authenticated user with role 'admin'. */
@Controller("admin")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("admin")
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  /** GET /api/v1/admin/feedback/all — retrieve all user feedback submissions. */
  @Get("feedback/all")
  listAllFeedbackSubmissions() {
    return this.admin.listFeedback();
  }

  /** PUT /api/v1/admin/places/:id/update-content — update place content (name, description, etc). */
  @Put("places/:id/update-content")
  updatePlaceContent(@Param("id") id: string, @Body() dto: UpdatePlaceDto) {
    return this.admin.updatePlace(id, dto);
  }
}
