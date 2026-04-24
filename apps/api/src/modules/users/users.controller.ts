import { Controller, Get, Req, UseGuards } from "@nestjs/common";
import type { Request } from "express";
import { JwtAuthGuard } from "@/modules/auth/guards/jwt-auth.guard";
import { UsersService } from "./users.service";

type AuthenticatedRequest = Request & { user: { id: string } };

@Controller("users")
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get("me")
  findMe(@Req() request: AuthenticatedRequest) {
    return this.usersService.findSafeById(request.user.id);
  }
}
