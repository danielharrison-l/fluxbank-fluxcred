import { Body, Controller, Get, Post, Req, UseGuards } from "@nestjs/common";
import type { Request } from "express";
import { JwtAuthGuard } from "@/modules/auth/guards/jwt-auth.guard";
import { CreateFinancialMetricDto } from "./dto/create-financial-metric.dto";
import { FinancialMetricsService } from "./financial-metrics.service";

type AuthenticatedRequest = Request & { user: { id: string } };

@Controller("financial-metrics")
@UseGuards(JwtAuthGuard)
export class FinancialMetricsController {
  constructor(
    private readonly financialMetricsService: FinancialMetricsService,
  ) {}

  @Get()
  findAll(@Req() request: AuthenticatedRequest) {
    return this.financialMetricsService.findAll(request.user.id);
  }

  @Get("latest")
  findLatest(@Req() request: AuthenticatedRequest) {
    return this.financialMetricsService.findLatest(request.user.id);
  }

  @Post("calculate")
  calculate(
    @Req() request: AuthenticatedRequest,
    @Body() data: CreateFinancialMetricDto,
  ) {
    return this.financialMetricsService.calculate(request.user.id, data);
  }
}
