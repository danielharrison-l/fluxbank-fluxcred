import { Controller, Get, Req, UseGuards } from "@nestjs/common";
import type { Request } from "express";
import { JwtAuthGuard } from "@/modules/auth/guards/jwt-auth.guard";
import { DashboardService } from "./dashboard.service";

type AuthenticatedRequest = Request & { user: { id: string } };

@Controller("dashboard")
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  getDashboard(@Req() request: AuthenticatedRequest) {
    return this.dashboardService.getDashboard(request.user.id);
  }
}
