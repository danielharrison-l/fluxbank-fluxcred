import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import type { Request } from "express";
import { JwtAuthGuard } from "@/modules/auth/guards/jwt-auth.guard";
import { SavePluggyItemDto } from "./dto/save-pluggy-item.dto";
import { PluggyService } from "./pluggy.service";

type AuthenticatedRequest = Request & {
  user: { id: string };
};

@Controller("pluggy")
@UseGuards(JwtAuthGuard)
export class PluggyController {
  constructor(private readonly pluggyService: PluggyService) {}

  @Post("connect-token")
  createConnectToken(@Req() request: AuthenticatedRequest) {
    return this.pluggyService.createConnectToken(request.user.id);
  }

  @Post("item")
  saveItem(
    @Req() request: AuthenticatedRequest,
    @Body() data: SavePluggyItemDto,
  ) {
    return this.pluggyService.saveItem(request.user.id, data.itemId);
  }

  @Post("sync/:itemId")
  syncItem(
    @Req() request: AuthenticatedRequest,
    @Param("itemId") itemId: string,
  ) {
    return this.pluggyService.syncItem(request.user.id, itemId);
  }

  @Get("items")
  listItems(@Req() request: AuthenticatedRequest) {
    return this.pluggyService.listItems(request.user.id);
  }
}
