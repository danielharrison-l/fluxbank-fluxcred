import { Body, Controller, Get, Post, Req, UseGuards } from "@nestjs/common";
import type { Request } from "express";
import { JwtAuthGuard } from "@/modules/auth/guards/jwt-auth.guard";
import { DemoService } from "./demo.service";
import { ConnectDemoProfileDto } from "./dto/connect-demo-profile.dto";

type AuthenticatedRequest = Request & { user: { id: string } };

@Controller("demo")
@UseGuards(JwtAuthGuard)
export class DemoController {
  constructor(private readonly demoService: DemoService) {}

  @Get("items")
  listItems(@Req() request: AuthenticatedRequest) {
    return this.demoService.listItems(request.user.id);
  }

  @Post("connect")
  connect(
    @Req() request: AuthenticatedRequest,
    @Body() data: ConnectDemoProfileDto,
  ) {
    return this.demoService.connect(request.user.id, data.profile);
  }

  @Post("reset")
  reset(@Req() request: AuthenticatedRequest) {
    return this.demoService.reset(request.user.id);
  }
}
