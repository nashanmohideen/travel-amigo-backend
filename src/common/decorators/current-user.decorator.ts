import { createParamDecorator, ExecutionContext } from "@nestjs/common";

/** Authenticated user attached to the request by the JWT strategies. */
export interface AuthUser {
  id: string;
  email: string;
  role: "user" | "admin";
}

/**
 * Injects the authenticated user (or undefined when the route uses
 * OptionalJwtGuard and the request is anonymous).
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthUser | undefined => {
    const request = ctx.switchToHttp().getRequest<{ user?: AuthUser }>();
    return request.user;
  }
);
