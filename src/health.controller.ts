import { Controller, Get } from "@nestjs/common";

/** GET /api/v1/health — liveness probe used by Vercel and uptime monitors. */
@Controller("health")
export class HealthController {
  @Get()
  checkApiHealth() {
    return { status: "ok", timestamp: new Date().toISOString() };
  }
}
