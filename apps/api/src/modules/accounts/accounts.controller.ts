import { Controller, Get, Param, Query, Req, UseGuards } from "@nestjs/common";
import type { Request } from "express";
import { JwtAuthGuard } from "@/modules/auth/guards/jwt-auth.guard";
import { AccountsService } from "./accounts.service";
import { ListAccountsQueryDto } from "./dto/list-accounts-query.dto";

type AuthenticatedRequest = Request & { user: { id: string } };

@Controller("accounts")
@UseGuards(JwtAuthGuard)
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Get()
  findAll(
    @Req() request: AuthenticatedRequest,
    @Query() query: ListAccountsQueryDto,
  ) {
    return this.accountsService.findAll(request.user.id, query);
  }

  @Get(":id")
  findById(@Req() request: AuthenticatedRequest, @Param("id") id: string) {
    return this.accountsService.findById(request.user.id, id);
  }
}
