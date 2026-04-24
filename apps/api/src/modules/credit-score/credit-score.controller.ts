import { Body, Controller, Get, Post, Req, UseGuards } from "@nestjs/common";
import type { Request } from "express";
import { JwtAuthGuard } from "@/modules/auth/guards/jwt-auth.guard";
import { CreditScoreService } from "./credit-score.service";
import { CreateCreditScoreDto } from "./dto/create-credit-score.dto";

type AuthenticatedRequest = Request & { user: { id: string } };

@Controller("credit-score")
@UseGuards(JwtAuthGuard)
export class CreditScoreController {
  constructor(private readonly creditScoreService: CreditScoreService) {}

  @Get()
  findAll(@Req() request: AuthenticatedRequest) {
    return this.creditScoreService.findAll(request.user.id);
  }

  @Get("latest")
  findLatest(@Req() request: AuthenticatedRequest) {
    return this.creditScoreService.findLatest(request.user.id);
  }

  @Post("calculate")
  calculate(@Req() request: AuthenticatedRequest) {
    return this.creditScoreService.calculate(request.user.id);
  }

  @Post()
  create(
    @Req() request: AuthenticatedRequest,
    @Body() data: CreateCreditScoreDto,
  ) {
    return this.creditScoreService.create(request.user.id, data);
  }
}
