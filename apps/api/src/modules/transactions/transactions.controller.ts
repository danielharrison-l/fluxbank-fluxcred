import { Controller, Get, Query, Req, UseGuards } from "@nestjs/common";
import type { Request } from "express";
import { JwtAuthGuard } from "@/modules/auth/guards/jwt-auth.guard";
import { ListTransactionsQueryDto } from "./dto/list-transactions-query.dto";
import { TransactionsService } from "./transactions.service";

type AuthenticatedRequest = Request & { user: { id: string } };

@Controller("transactions")
@UseGuards(JwtAuthGuard)
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Get()
  findAll(
    @Req() request: AuthenticatedRequest,
    @Query() query: ListTransactionsQueryDto,
  ) {
    return this.transactionsService.findAll(request.user.id, query);
  }
}
