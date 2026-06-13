import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { createHash, randomUUID } from "node:crypto";
import { PrismaService } from "../prisma/prisma.service";
import { EmailQueueService } from "../jobs/email/email-queue.service";

const ACCESS_TOKEN_TTL = "15m";
const REFRESH_TOKEN_TTL = "7d";
const VERIFY_TOKEN_TTL = "24h";
const BCRYPT_ROUNDS = 12;

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse extends TokenPair {
  user: { id: string; email: string; role: string; emailVerified: boolean };
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly emailQueue: EmailQueueService
  ) {}

  /** Register a new user, queue a verification email, return a token pair. */
  async register(email: string, password: string): Promise<AuthResponse> {
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new ConflictException("An account with this email already exists");
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const user = await this.prisma.user.create({
      data: { email, passwordHash },
    });

    const verifyToken = await this.jwt.signAsync(
      { sub: user.id, email: user.email, type: "verify-email" },
      { secret: this.secret(), expiresIn: VERIFY_TOKEN_TTL }
    );
    await this.emailQueue.enqueueVerificationEmail(user.email, verifyToken);

    return this.issueTokens(user.id, user.email, user.role, user.emailVerified);
  }

  /** Validate credentials and return a fresh token pair. */
  async login(email: string, password: string): Promise<AuthResponse> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      throw new UnauthorizedException("Invalid email or password");
    }
    return this.issueTokens(user.id, user.email, user.role, user.emailVerified);
  }

  /**
   * Refresh-token rotation: verify the presented refresh JWT, compare it
   * against the stored hash, then issue (and store) a brand new pair.
   * A reused/stale refresh token fails the hash comparison and is rejected.
   */
  async refresh(refreshToken: string): Promise<AuthResponse> {
    let payload: { sub: string; type: string };
    try {
      payload = await this.jwt.verifyAsync(refreshToken, { secret: this.refreshSecret() });
    } catch {
      throw new UnauthorizedException("Invalid refresh token");
    }
    if (payload.type !== "refresh") {
      throw new UnauthorizedException("Invalid token type");
    }

    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
    if (
      !user?.refreshToken ||
      !(await bcrypt.compare(digestToken(refreshToken), user.refreshToken))
    ) {
      throw new UnauthorizedException("Refresh token revoked");
    }

    return this.issueTokens(user.id, user.email, user.role, user.emailVerified);
  }

  /** Invalidate the stored refresh token. */
  async logout(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });
  }

  /** Mark the user's email as verified from a signed verify-email token. */
  async verifyEmail(token: string): Promise<void> {
    let payload: { sub: string; type: string };
    try {
      payload = await this.jwt.verifyAsync(token, { secret: this.secret() });
    } catch {
      throw new UnauthorizedException("Invalid or expired verification token");
    }
    if (payload.type !== "verify-email") {
      throw new UnauthorizedException("Invalid token type");
    }
    await this.prisma.user.update({
      where: { id: payload.sub },
      data: { emailVerified: true },
    });
  }

  // ── internals ────────────────────────────────────────────────────────────

  private async issueTokens(
    id: string,
    email: string,
    role: string,
    emailVerified: boolean
  ): Promise<AuthResponse> {
    const accessToken = await this.jwt.signAsync(
      { sub: id, email, role, type: "access" },
      { secret: this.secret(), expiresIn: ACCESS_TOKEN_TTL }
    );
    // jti guarantees every refresh token is unique, so rotation always
    // invalidates the previous one even within the same second
    const refreshToken = await this.jwt.signAsync(
      { sub: id, type: "refresh", jti: randomUUID() },
      { secret: this.refreshSecret(), expiresIn: REFRESH_TOKEN_TTL }
    );

    await this.prisma.user.update({
      where: { id },
      data: { refreshToken: await bcrypt.hash(digestToken(refreshToken), BCRYPT_ROUNDS) },
    });

    return { accessToken, refreshToken, user: { id, email, role, emailVerified } };
  }

  private secret(): string {
    return this.config.get<string>("JWT_SECRET") ?? "dev-only-secret";
  }

  private refreshSecret(): string {
    return this.config.get<string>("JWT_REFRESH_SECRET") ?? "dev-only-refresh-secret";
  }
}

/**
 * bcrypt truncates input at 72 bytes — JWTs for the same user share their
 * first 72 bytes, so hash a fixed-length SHA-256 digest of the token instead.
 */
function digestToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
