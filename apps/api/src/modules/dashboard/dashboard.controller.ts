import { Controller, Get, Req, UseGuards } from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import type { Request } from "express";
import { JwtAuthGuard } from "@/modules/auth/guards/jwt-auth.guard";
import { DashboardService } from "./dashboard.service";

type AuthenticatedRequest = Request & { user: { id: string } };

@Controller("dashboard")
@UseGuards(JwtAuthGuard)
@ApiTags("Dashboard")
@ApiBearerAuth("jwt")
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  @ApiOperation({ summary: "Get user financial dashboard" })
  @ApiResponse({ status: 200, description: "Dashboard summary" })
  getDashboard(@Req() request: AuthenticatedRequest) {
    return this.dashboardService.getDashboard(request.user.id);
  }
}
