import { Body, Controller, HttpCode, Post, UseGuards } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { LoginDto, RefreshDto, RegisterDto, ResendVerificationDto, VerifyEmailDto } from "./dto/auth.dto";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { CurrentUser, type AuthUser } from "../common/decorators/current-user.decorator";

@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  /** POST /api/v1/auth/register — create account + send verification email. */
  @Post("register")
  registerAccount(@Body() dto: RegisterDto) {
    return this.auth.register(dto.email, dto.password);
  }

  /** POST /api/v1/auth/login — validate credentials, return token pair. */
  @Post("login")
  @HttpCode(200)
  loginWithCredentials(@Body() dto: LoginDto) {
    return this.auth.login(dto.email, dto.password);
  }

  /** POST /api/v1/auth/refresh — rotate refresh token, return new token pair. */
  @Post("refresh")
  @HttpCode(200)
  refreshAccessToken(@Body() dto: RefreshDto) {
    return this.auth.refresh(dto.refreshToken);
  }

  /** POST /api/v1/auth/logout — revoke the stored refresh token for this user. */
  @Post("logout")
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  async revokeSession(@CurrentUser() user: AuthUser) {
    await this.auth.logout(user.id);
    return { ok: true, message: "Logged out successfully" };
  }

  /** POST /api/v1/auth/verify-email — mark email as verified from signed token. */
  @Post("verify-email")
  @HttpCode(200)
  async verifyEmailToken(@Body() dto: VerifyEmailDto) {
    await this.auth.verifyEmail(dto.token);
    return { ok: true, message: "Email verified successfully" };
  }

  /**
   * POST /api/v1/auth/resend-verification — queue a new verification email.
   * Always returns 200 to avoid revealing whether the email address exists.
   */
  @Post("resend-verification")
  @HttpCode(200)
  async resendVerificationEmail(@Body() dto: ResendVerificationDto) {
    await this.auth.resendVerification(dto.email);
    return {
      ok: true,
      message: "If that address is registered and unverified, a new email has been sent.",
    };
  }
}
