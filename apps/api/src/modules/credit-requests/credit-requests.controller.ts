import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import type { Request } from "express";
import { JwtAuthGuard } from "@/modules/auth/guards/jwt-auth.guard";
import { CreditRequestsService } from "./credit-requests.service";
import { CreateCreditRequestDto } from "./dto/create-credit-request.dto";
import { DecideCreditRequestDto } from "./dto/decide-credit-request.dto";

type AuthenticatedRequest = Request & { user: { id: string } };

@Controller("credit-requests")
@UseGuards(JwtAuthGuard)
export class CreditRequestsController {
  constructor(private readonly creditRequestsService: CreditRequestsService) {}

  @Get()
  findAll(@Req() request: AuthenticatedRequest) {
    return this.creditRequestsService.findAll(request.user.id);
  }

  @Get(":id")
  findById(@Req() request: AuthenticatedRequest, @Param("id") id: string) {
    return this.creditRequestsService.findById(request.user.id, id);
  }

  @Post()
  create(
    @Req() request: AuthenticatedRequest,
    @Body() data: CreateCreditRequestDto,
  ) {
    return this.creditRequestsService.create(request.user.id, data);
  }

  @Patch(":id/decision")
  decide(
    @Req() request: AuthenticatedRequest,
    @Param("id") id: string,
    @Body() data: DecideCreditRequestDto,
  ) {
    return this.creditRequestsService.decide(request.user.id, id, data);
  }
}
