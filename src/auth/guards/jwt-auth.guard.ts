import { Injectable } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

/** Standard bearer-token guard — rejects anonymous requests with 401. */
@Injectable()
export class JwtAuthGuard extends AuthGuard("jwt") {}
