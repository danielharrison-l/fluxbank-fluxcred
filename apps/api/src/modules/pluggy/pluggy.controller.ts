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
import { SavePluggyItemDto } from "./dto/save-pluggy-item.dto";
import { PluggyService } from "./pluggy.service";

type AuthenticatedRequest = Request & {
  user: { id: string };
};

@Controller("pluggy")
@UseGuards(JwtAuthGuard)
@ApiTags("Pluggy")
@ApiBearerAuth("jwt")
export class PluggyController {
  constructor(private readonly pluggyService: PluggyService) {}

  @Post("connect-token")
  @ApiOperation({ summary: "Create a Pluggy Connect token" })
  @ApiResponse({ status: 201, description: "Connect token created" })
  createConnectToken(@Req() request: AuthenticatedRequest) {
    return this.pluggyService.createConnectToken(request.user.id);
  }

  @Post("items")
  @ApiOperation({ summary: "Save a connected Pluggy item" })
  @ApiResponse({ status: 201, description: "Pluggy item saved" })
  saveItem(
    @Req() request: AuthenticatedRequest,
    @Body() data: SavePluggyItemDto,
  ) {
    return this.pluggyService.saveItem(request.user.id, data.itemId);
  }

  @Post("item")
  @ApiOperation({ summary: "Save a connected Pluggy item legacy route" })
  @ApiResponse({ status: 201, description: "Pluggy item saved" })
  saveItemLegacy(
    @Req() request: AuthenticatedRequest,
    @Body() data: SavePluggyItemDto,
  ) {
    return this.pluggyService.saveItem(request.user.id, data.itemId);
  }

  @Post("sync/:itemId")
  @ApiOperation({ summary: "Sync accounts and transactions for an item" })
  @ApiResponse({ status: 201, description: "Item sync finished" })
  syncItem(
    @Req() request: AuthenticatedRequest,
    @Param("itemId") itemId: string,
  ) {
    return this.pluggyService.syncItem(request.user.id, itemId);
  }

  @Post("sync/:itemId/accounts")
  @ApiOperation({ summary: "Sync accounts for a Pluggy item" })
  @ApiResponse({ status: 201, description: "Accounts synced" })
  syncAccounts(
    @Req() request: AuthenticatedRequest,
    @Param("itemId") itemId: string,
  ) {
    return this.pluggyService.syncAccounts(request.user.id, itemId);
  }

  @Post("sync/:itemId/transactions")
  @ApiOperation({ summary: "Sync transactions for a Pluggy item" })
  @ApiResponse({ status: 201, description: "Transactions synced" })
  syncTransactions(
    @Req() request: AuthenticatedRequest,
    @Param("itemId") itemId: string,
  ) {
    return this.pluggyService.syncTransactions(request.user.id, itemId);
  }

  @Get("items")
  @ApiOperation({ summary: "List Pluggy items for authenticated user" })
  @ApiResponse({ status: 200, description: "Pluggy items" })
  listItems(@Req() request: AuthenticatedRequest) {
    return this.pluggyService.listItems(request.user.id);
  }
}
