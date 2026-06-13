import { Injectable } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

/**
 * Guest-friendly guard: attaches request.user when a valid bearer token is
 * present, but never rejects anonymous or invalid-token requests.
 */
@Injectable()
export class OptionalJwtGuard extends AuthGuard("jwt") {
  override handleRequest<TUser = unknown>(_err: unknown, user: TUser | false): TUser | undefined {
    return user || undefined;
  }
}
