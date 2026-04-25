import { createHash, randomBytes, randomUUID } from "node:crypto";
import {
  BadRequestException,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { MailService } from "@/modules/mail/mail.service";
import { UsersService } from "@/modules/users/users.service";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";

type AuthenticatedUser = {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  phone: string | null;
  document: string | null;
  emailVerifiedAt: Date | null;
  emailVerificationTokenHash: string | null;
  emailVerificationTokenExpiresAt: Date | null;
  passwordResetTokenHash: string | null;
  passwordResetTokenExpiresAt: Date | null;
  refreshTokenHash: string | null;
  refreshTokenExpiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class AuthService {
  private readonly accessTokenTtl =
    process.env.ACCESS_TOKEN_TTL?.trim() || "15m";
  private readonly refreshTokenTtl =
    process.env.REFRESH_TOKEN_TTL?.trim() || "7d";
  private readonly emailVerificationTtl =
    process.env.EMAIL_VERIFICATION_TTL?.trim() || "24h";
  private readonly passwordResetTtl =
    process.env.PASSWORD_RESET_TTL?.trim() || "1h";
  private readonly refreshTokenSecret =
    process.env.JWT_REFRESH_SECRET?.trim() ||
    process.env.JWT_SECRET ||
    (() => {
      throw new Error("JWT_SECRET must be defined in environment variables");
    })();

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
  ) {}

  async register(data: RegisterDto) {
    const passwordHash = await bcrypt.hash(data.password, 12);
    const verificationToken = this.generateOpaqueToken();
    const user = await this.usersService.createUser({
      ...data,
      passwordHash,
      emailVerifiedAt: null,
      emailVerificationTokenHash: this.hashToken(verificationToken),
      emailVerificationTokenExpiresAt: new Date(
        Date.now() + this.parseDurationToMs(this.emailVerificationTtl),
      ),
    });

    try {
      await this.mailService.sendEmailVerification({
        email: user.email,
        name: user.name,
        token: verificationToken,
      });
    } catch (error) {
      await this.usersService.deleteUser(user.id);

      if (error instanceof ServiceUnavailableException) {
        throw error;
      }

      throw new ServiceUnavailableException(
        "Não foi possível enviar o e-mail de confirmação.",
      );
    }

    return {
      success: true,
      email: user.email,
      message: "Conta criada. Confirme seu e-mail para liberar o acesso.",
    };
  }

  async login(data: LoginDto) {
    const user = await this.usersService.findByEmail(data.email);

    if (!user) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const passwordMatches = await bcrypt.compare(
      data.password,
      user.passwordHash,
    );

    if (!passwordMatches) {
      throw new UnauthorizedException("Invalid credentials");
    }

    if (!user.emailVerifiedAt) {
      throw new UnauthorizedException("Email not verified");
    }

    return this.buildAuthResponse(user);
  }

  async verifyEmail(token: string) {
    if (!token) {
      throw new BadRequestException("Verification token missing");
    }

    const user = await this.usersService.findByEmailVerificationTokenHash(
      this.hashToken(token),
    );

    if (!user?.emailVerificationTokenExpiresAt) {
      throw new BadRequestException("Invalid verification token");
    }

    if (user.emailVerificationTokenExpiresAt.getTime() <= Date.now()) {
      throw new BadRequestException("Verification token expired");
    }

    await this.usersService.updateEmailVerification(user.id, {
      emailVerifiedAt: new Date(),
      emailVerificationTokenHash: null,
      emailVerificationTokenExpiresAt: null,
    });

    return {
      success: true,
      message: "E-mail confirmado com sucesso. Faça login para continuar.",
    };
  }

  async resendVerificationEmail(email: string) {
    const user = await this.usersService.findByEmail(email);

    if (!user || user.emailVerifiedAt) {
      return {
        success: true,
        message: "Se a conta existir, enviaremos um novo link de confirmação.",
      };
    }

    const verificationToken = this.generateOpaqueToken();

    await this.usersService.updateEmailVerification(user.id, {
      emailVerificationTokenHash: this.hashToken(verificationToken),
      emailVerificationTokenExpiresAt: new Date(
        Date.now() + this.parseDurationToMs(this.emailVerificationTtl),
      ),
    });

    await this.mailService.sendEmailVerification({
      email: user.email,
      name: user.name,
      token: verificationToken,
    });

    return {
      success: true,
      message: "Se a conta existir, enviaremos um novo link de confirmação.",
    };
  }

  async requestPasswordReset(email: string) {
    const user = await this.usersService.findByEmail(email);

    if (!user || !user.emailVerifiedAt) {
      return {
        success: true,
        message:
          "Se a conta existir, enviaremos instruções para redefinir a senha.",
      };
    }

    const resetToken = this.generateOpaqueToken();

    await this.usersService.updatePasswordReset(user.id, {
      passwordResetTokenHash: this.hashToken(resetToken),
      passwordResetTokenExpiresAt: new Date(
        Date.now() + this.parseDurationToMs(this.passwordResetTtl),
      ),
    });

    await this.mailService.sendPasswordReset({
      email: user.email,
      name: user.name,
      token: resetToken,
    });

    return {
      success: true,
      message:
        "Se a conta existir, enviaremos instruções para redefinir a senha.",
    };
  }

  async resetPassword(token: string, password: string) {
    if (!token) {
      throw new BadRequestException("Reset token missing");
    }

    const user = await this.usersService.findByPasswordResetTokenHash(
      this.hashToken(token),
    );

    if (!user?.passwordResetTokenExpiresAt) {
      throw new BadRequestException("Invalid reset token");
    }

    if (user.passwordResetTokenExpiresAt.getTime() <= Date.now()) {
      throw new BadRequestException("Reset token expired");
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await this.usersService.updatePassword(user.id, passwordHash);
    await this.usersService.updatePasswordReset(user.id, {
      passwordResetTokenHash: null,
      passwordResetTokenExpiresAt: null,
    });
    await this.usersService.deleteRefreshSessionsByUser(user.id);

    return {
      success: true,
      message: "Senha redefinida com sucesso. Faça login com a nova senha.",
    };
  }

  async refreshAccessToken(refreshToken: string | undefined) {
    if (!refreshToken) {
      throw new UnauthorizedException("Refresh token missing");
    }

    let payload: { sub: string; email: string; sid?: string };

    try {
      payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.refreshTokenSecret,
      });
    } catch {
      throw new UnauthorizedException("Invalid refresh token");
    }

    if (!payload.sid) {
      throw new UnauthorizedException("Invalid refresh token");
    }

    const refreshSession = await this.usersService.findRefreshSession(
      payload.sid,
    );

    if (!refreshSession || refreshSession.userId !== payload.sub) {
      throw new UnauthorizedException("Refresh session not found");
    }

    if (refreshSession.expiresAt.getTime() <= Date.now()) {
      await this.clearRefreshSession(refreshSession.id);
      throw new UnauthorizedException("Refresh token expired");
    }

    if (refreshSession.tokenHash !== this.hashToken(refreshToken)) {
      await this.clearRefreshSession(refreshSession.id);
      throw new UnauthorizedException("Invalid refresh token");
    }

    await this.clearRefreshSession(refreshSession.id);

    return this.buildAuthResponse(refreshSession.user);
  }

  async logout(refreshToken: string | undefined) {
    if (!refreshToken) {
      return;
    }

    try {
      const payload = await this.jwtService.verifyAsync<{
        sub: string;
        email: string;
        sid?: string;
      }>(refreshToken, {
        secret: this.refreshTokenSecret,
      });

      if (payload.sid) {
        await this.clearRefreshSession(payload.sid);
      }
    } catch {
      return;
    }
  }

  getRefreshCookieName() {
    return process.env.REFRESH_TOKEN_COOKIE_NAME?.trim() || "fluxcred_refresh";
  }

  getRefreshCookieOptions() {
    const maxAge = this.parseDurationToMs(this.refreshTokenTtl);
    const domain = process.env.AUTH_COOKIE_DOMAIN?.trim();
    const sameSite = (process.env.AUTH_COOKIE_SAME_SITE?.trim().toLowerCase() ||
      "lax") as "lax" | "strict" | "none";
    const secure =
      (process.env.AUTH_COOKIE_SECURE?.trim().toLowerCase() || "") === "true" ||
      process.env.NODE_ENV === "production";

    return {
      httpOnly: true,
      secure,
      sameSite,
      path: "/auth",
      maxAge,
      ...(domain ? { domain } : {}),
    } as const;
  }

  private async buildAuthResponse(user: AuthenticatedUser) {
    const {
      passwordHash: _passwordHash,
      emailVerificationTokenHash: _emailVerificationTokenHash,
      emailVerificationTokenExpiresAt: _emailVerificationTokenExpiresAt,
      passwordResetTokenHash: _passwordResetTokenHash,
      passwordResetTokenExpiresAt: _passwordResetTokenExpiresAt,
      refreshTokenHash: _refreshTokenHash,
      refreshTokenExpiresAt: _refreshTokenExpiresAt,
      ...safeUser
    } = user;

    const accessToken = await this.jwtService.signAsync(
      {
        sub: user.id,
        email: user.email,
      },
      {
        expiresIn: Math.floor(
          this.parseDurationToMs(this.accessTokenTtl) / 1000,
        ),
      },
    );

    const refreshSessionId = randomUUID();
    const refreshTokenExpiresAt = new Date(
      Date.now() + this.parseDurationToMs(this.refreshTokenTtl),
    );
    const refreshToken = await this.jwtService.signAsync(
      {
        sub: user.id,
        email: user.email,
        sid: refreshSessionId,
        nonce: randomBytes(12).toString("hex"),
      },
      {
        secret: this.refreshTokenSecret,
        expiresIn: Math.floor(
          this.parseDurationToMs(this.refreshTokenTtl) / 1000,
        ),
      },
    );

    await this.usersService.createRefreshSession(user.id, {
      id: refreshSessionId,
      tokenHash: this.hashToken(refreshToken),
      expiresAt: refreshTokenExpiresAt,
    });

    return {
      user: safeUser,
      accessToken,
      refreshToken,
    };
  }

  private async clearRefreshSession(sessionId: string) {
    await this.usersService.deleteRefreshSession(sessionId);
  }

  private hashToken(token: string) {
    return createHash("sha256").update(token).digest("hex");
  }

  private generateOpaqueToken() {
    return randomBytes(32).toString("hex");
  }

  private parseDurationToMs(value: string) {
    const normalizedValue = value.trim().toLowerCase();
    const match = normalizedValue.match(/^(\d+)(ms|s|m|h|d)$/);

    if (!match) {
      throw new Error(
        "ACCESS_TOKEN_TTL and REFRESH_TOKEN_TTL must use ms, s, m, h or d",
      );
    }

    const amount = Number(match[1]);
    const unit = match[2];

    switch (unit) {
      case "ms":
        return amount;
      case "s":
        return amount * 1000;
      case "m":
        return amount * 60 * 1000;
      case "h":
        return amount * 60 * 60 * 1000;
      case "d":
        return amount * 24 * 60 * 60 * 1000;
      default:
        throw new Error("Unsupported duration unit");
    }
  }
}
