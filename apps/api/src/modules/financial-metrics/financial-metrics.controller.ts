import { Body, Controller, Get, Post, Req, UseGuards } from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import type { Request } from "express";
import { JwtAuthGuard } from "@/modules/auth/guards/jwt-auth.guard";
import { CreateFinancialMetricDto } from "./dto/create-financial-metric.dto";
import { FinancialMetricsService } from "./financial-metrics.service";

type AuthenticatedRequest = Request & { user: { id: string } };

@Controller("financial-metrics")
@UseGuards(JwtAuthGuard)
@ApiTags("FinancialMetrics")
@ApiBearerAuth("jwt")
export class FinancialMetricsController {
  constructor(
    private readonly financialMetricsService: FinancialMetricsService,
  ) {}

  @Get()
  @ApiOperation({ summary: "List financial metrics" })
  @ApiResponse({ status: 200, description: "Financial metrics" })
  findAll(@Req() request: AuthenticatedRequest) {
    return this.financialMetricsService.findAll(request.user.id);
  }

  @Get("latest")
  @ApiOperation({ summary: "Get latest financial metric" })
  @ApiResponse({ status: 200, description: "Latest financial metric" })
  findLatest(@Req() request: AuthenticatedRequest) {
    return this.financialMetricsService.findLatest(request.user.id);
  }

  @Post("calculate")
  @ApiOperation({ summary: "Calculate financial metrics" })
  @ApiResponse({ status: 201, description: "Financial metric calculated" })
  calculate(
    @Req() request: AuthenticatedRequest,
    @Body() data: CreateFinancialMetricDto,
  ) {
    return this.financialMetricsService.calculate(request.user.id, data);
  }
}
