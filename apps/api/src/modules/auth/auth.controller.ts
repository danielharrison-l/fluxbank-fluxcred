import { Body, Controller, Get, Post, Req, UseGuards } from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import type { Request } from "express";
import { AuthService } from "./auth.service";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";

@Controller("auth")
@ApiTags("Auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("register")
  @ApiOperation({ summary: "Register a user" })
  @ApiResponse({ status: 201, description: "User registered" })
  register(@Body() data: RegisterDto) {
    return this.authService.register(data);
  }

  @Post("login")
  @ApiOperation({ summary: "Login and get an access token" })
  @ApiResponse({ status: 201, description: "Login successful" })
  @ApiResponse({ status: 401, description: "Invalid credentials" })
  login(@Body() data: LoginDto) {
    return this.authService.login(data);
  }

  @Get("me")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("jwt")
  @ApiOperation({ summary: "Get authenticated user" })
  @ApiResponse({ status: 200, description: "Authenticated user" })
  me(@Req() request: Request) {
    return request.user;
  }
}
