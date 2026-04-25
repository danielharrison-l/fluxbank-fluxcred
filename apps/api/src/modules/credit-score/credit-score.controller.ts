import { Body, Controller, Get, Post, Req, UseGuards } from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import type { Request } from "express";
import { JwtAuthGuard } from "@/modules/auth/guards/jwt-auth.guard";
import { CreditScoreService } from "./credit-score.service";
import { CreateCreditScoreDto } from "./dto/create-credit-score.dto";

type AuthenticatedRequest = Request & { user: { id: string } };

@Controller("credit-score")
@UseGuards(JwtAuthGuard)
@ApiTags("CreditScore")
@ApiBearerAuth("jwt")
export class CreditScoreController {
  constructor(private readonly creditScoreService: CreditScoreService) {}

  @Get()
  @ApiOperation({ summary: "List credit scores" })
  @ApiResponse({ status: 200, description: "Credit scores" })
  findAll(@Req() request: AuthenticatedRequest) {
    return this.creditScoreService.findAll(request.user.id);
  }

  @Get("latest")
  @ApiOperation({ summary: "Get latest credit score" })
  @ApiResponse({ status: 200, description: "Latest credit score" })
  findLatest(@Req() request: AuthenticatedRequest) {
    return this.creditScoreService.findLatest(request.user.id);
  }

  @Post("calculate")
  @ApiOperation({ summary: "Calculate credit score from latest metrics" })
  @ApiResponse({ status: 201, description: "Credit score calculated" })
  calculate(@Req() request: AuthenticatedRequest) {
    return this.creditScoreService.calculate(request.user.id);
  }

  @Post()
  @ApiOperation({ summary: "Create credit score from a metric" })
  @ApiResponse({ status: 201, description: "Credit score created" })
  create(
    @Req() request: AuthenticatedRequest,
    @Body() data: CreateCreditScoreDto,
  ) {
    return this.creditScoreService.create(request.user.id, data);
  }
}
