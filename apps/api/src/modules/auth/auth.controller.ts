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
import { ForgotPasswordDto } from "./dto/forgot-password.dto";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";
import { ResendVerificationDto } from "./dto/resend-verification.dto";
import { ResetPasswordDto } from "./dto/reset-password.dto";
import { VerifyEmailDto } from "./dto/verify-email.dto";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";

@Controller("auth")
@ApiTags("Auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("register")
  @ApiOperation({ summary: "Register a user" })
  @ApiResponse({ status: 201, description: "User registered" })
  async register(@Body() data: RegisterDto) {
    return this.authService.register(data);
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

    const {
      refreshToken: _refreshToken,
      user: _user,
      ...authResponse
    } = authResult;
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

  @Post("verify-email")
  @ApiOperation({ summary: "Verify account email" })
  @ApiResponse({ status: 201, description: "Email verified" })
  verifyEmail(@Body() data: VerifyEmailDto) {
    return this.authService.verifyEmail(data.token);
  }

  @Post("resend-verification")
  @ApiOperation({ summary: "Resend account verification email" })
  @ApiResponse({ status: 201, description: "Verification email sent" })
  resendVerification(@Body() data: ResendVerificationDto) {
    return this.authService.resendVerificationEmail(data.email);
  }

  @Post("forgot-password")
  @ApiOperation({ summary: "Request password reset email" })
  @ApiResponse({ status: 201, description: "Reset email requested" })
  forgotPassword(@Body() data: ForgotPasswordDto) {
    return this.authService.requestPasswordReset(data.email);
  }

  @Post("reset-password")
  @ApiOperation({ summary: "Reset account password" })
  @ApiResponse({ status: 201, description: "Password reset successful" })
  resetPassword(@Body() data: ResetPasswordDto) {
    return this.authService.resetPassword(data.token, data.password);
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
