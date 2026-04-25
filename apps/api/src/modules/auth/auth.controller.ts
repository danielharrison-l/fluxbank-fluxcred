import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import type { Request, Response } from "express";
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
  async register(
    @Body() data: RegisterDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const authResult = await this.authService.register(data);

    this.writeRefreshCookie(response, authResult.refreshToken);

    const { refreshToken: _refreshToken, ...authResponse } = authResult;
    return authResponse;
  }

  @Post("login")
  @ApiOperation({ summary: "Login and get an access token" })
  @ApiResponse({ status: 201, description: "Login successful" })
  @ApiResponse({ status: 401, description: "Invalid credentials" })
  async login(
    @Body() data: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const authResult = await this.authService.login(data);

    this.writeRefreshCookie(response, authResult.refreshToken);

    const { refreshToken: _refreshToken, ...authResponse } = authResult;
    return authResponse;
  }

  @Post("refresh")
  @ApiOperation({ summary: "Refresh access token" })
  @ApiResponse({ status: 201, description: "Access token refreshed" })
  @ApiResponse({ status: 401, description: "Invalid refresh session" })
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const authResult = await this.authService.refreshAccessToken(
      this.readRefreshCookie(request),
    );

    this.writeRefreshCookie(response, authResult.refreshToken);

    const { refreshToken: _refreshToken, user: _user, ...authResponse } =
      authResult;
    return authResponse;
  }

  @Post("logout")
  @ApiOperation({ summary: "Logout current session" })
  @ApiResponse({ status: 201, description: "Logout successful" })
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    await this.authService.logout(this.readRefreshCookie(request));
    response.clearCookie(
      this.authService.getRefreshCookieName(),
      this.authService.getRefreshCookieOptions(),
    );

    return { success: true };
  }

  @Get("me")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("jwt")
  @ApiOperation({ summary: "Get authenticated user" })
  @ApiResponse({ status: 200, description: "Authenticated user" })
  me(@Req() request: Request) {
    return request.user;
  }

  private writeRefreshCookie(response: Response, refreshToken: string) {
    response.cookie(
      this.authService.getRefreshCookieName(),
      refreshToken,
      this.authService.getRefreshCookieOptions(),
    );
  }

  private readRefreshCookie(request: Request) {
    const cookieName = this.authService.getRefreshCookieName();
    const header = request.headers.cookie;

    if (!header) {
      return undefined;
    }

    const cookie = header
      .split(";")
      .map((part) => part.trim())
      .find((part) => part.startsWith(`${cookieName}=`));

    if (!cookie) {
      return undefined;
    }

    return decodeURIComponent(cookie.slice(cookieName.length + 1));
  }
}
