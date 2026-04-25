import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import type { Request } from "express";

@Injectable()
export class AdminApiKeyGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    const adminApiKey = process.env.ADMIN_API_KEY?.trim();

    if (!adminApiKey) {
      throw new UnauthorizedException("ADMIN_API_KEY is not configured");
    }

    const request = context.switchToHttp().getRequest<Request>();
    const providedApiKey = request.header("x-admin-api-key")?.trim();

    if (providedApiKey !== adminApiKey) {
      throw new UnauthorizedException("Invalid admin API key");
    }

    return true;
  }
}
