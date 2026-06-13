import { SetMetadata } from "@nestjs/common";

export const ROLES_KEY = "roles";

/** Restricts a route to users with one of the given roles (use with RolesGuard). */
export const Roles = (...roles: Array<"user" | "admin">) => SetMetadata(ROLES_KEY, roles);
