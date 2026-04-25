import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import type { Request } from "express";
import { JwtAuthGuard } from "@/modules/auth/guards/jwt-auth.guard";
import { CreditRequestsService } from "./credit-requests.service";
import { CreateCreditRequestDto } from "./dto/create-credit-request.dto";

type AuthenticatedRequest = Request & { user: { id: string } };

@Controller("credit-requests")
@UseGuards(JwtAuthGuard)
@ApiTags("CreditRequests")
@ApiBearerAuth("jwt")
export class CreditRequestsController {
  constructor(private readonly creditRequestsService: CreditRequestsService) {}

  @Get()
  @ApiOperation({ summary: "List credit requests" })
  @ApiResponse({ status: 200, description: "Credit requests" })
  findAll(@Req() request: AuthenticatedRequest) {
    return this.creditRequestsService.findAll(request.user.id);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get credit request by id" })
  @ApiResponse({ status: 200, description: "Credit request" })
  @ApiResponse({ status: 404, description: "Credit request not found" })
  findById(@Req() request: AuthenticatedRequest, @Param("id") id: string) {
    return this.creditRequestsService.findById(request.user.id, id);
  }

  @Post()
  @ApiOperation({ summary: "Request credit" })
  @ApiResponse({ status: 201, description: "Credit request created" })
  create(
    @Req() request: AuthenticatedRequest,
    @Body() data: CreateCreditRequestDto,
  ) {
    return this.creditRequestsService.create(request.user.id, data);
  }
}
