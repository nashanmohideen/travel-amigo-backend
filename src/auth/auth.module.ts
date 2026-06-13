import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { JwtStrategy } from "./strategies/jwt.strategy";
import { JobsModule } from "../jobs/jobs.module";

@Module({
  imports: [
    PassportModule,
    // Secrets/expiry are provided per-sign in AuthService so access and
    // refresh tokens can use different secrets.
    JwtModule.register({}),
    JobsModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [JwtStrategy],
})
export class AuthModule {}
