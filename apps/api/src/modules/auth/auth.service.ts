import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { createHash, randomBytes } from "node:crypto";
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
  private readonly refreshTokenSecret =
    process.env.JWT_REFRESH_SECRET?.trim() ||
    process.env.JWT_SECRET ||
    (() => {
      throw new Error("JWT_SECRET must be defined in environment variables");
    })();

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(data: RegisterDto) {
    const passwordHash = await bcrypt.hash(data.password, 12);
    const user = await this.usersService.createUser({ ...data, passwordHash });

    return this.buildAuthResponse(user);
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

    return this.buildAuthResponse(user);
  }

  async refreshAccessToken(refreshToken: string | undefined) {
    if (!refreshToken) {
      throw new UnauthorizedException("Refresh token missing");
    }

    let payload: { sub: string; email: string };

    try {
      payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.refreshTokenSecret,
      });
    } catch {
      throw new UnauthorizedException("Invalid refresh token");
    }

    const user = await this.usersService.findById(payload.sub);

    if (!user?.refreshTokenHash || !user.refreshTokenExpiresAt) {
      throw new UnauthorizedException("Refresh session not found");
    }

    if (user.refreshTokenExpiresAt.getTime() <= Date.now()) {
      await this.clearRefreshSession(user.id);
      throw new UnauthorizedException("Refresh token expired");
    }

    if (user.refreshTokenHash !== this.hashToken(refreshToken)) {
      await this.clearRefreshSession(user.id);
      throw new UnauthorizedException("Invalid refresh token");
    }

    return this.buildAuthResponse(user);
  }

  async logout(refreshToken: string | undefined) {
    if (!refreshToken) {
      return;
    }

    try {
      const payload = await this.jwtService.verifyAsync<{
        sub: string;
        email: string;
      }>(refreshToken, {
        secret: this.refreshTokenSecret,
      });

      await this.clearRefreshSession(payload.sub);
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
    const { passwordHash: _passwordHash, refreshTokenHash: _refreshTokenHash, refreshTokenExpiresAt: _refreshTokenExpiresAt, ...safeUser } =
      user;

    const accessToken = await this.jwtService.signAsync(
      {
        sub: user.id,
        email: user.email,
      },
      {
        expiresIn: Math.floor(this.parseDurationToMs(this.accessTokenTtl) / 1000),
      },
    );

    const refreshToken = await this.jwtService.signAsync(
      {
        sub: user.id,
        email: user.email,
        nonce: randomBytes(12).toString("hex"),
      },
      {
        secret: this.refreshTokenSecret,
        expiresIn: Math.floor(this.parseDurationToMs(this.refreshTokenTtl) / 1000),
      },
    );

    await this.usersService.updateRefreshSession(user.id, {
      refreshTokenHash: this.hashToken(refreshToken),
      refreshTokenExpiresAt: new Date(
        Date.now() + this.parseDurationToMs(this.refreshTokenTtl),
      ),
    });

    return {
      user: safeUser,
      accessToken,
      refreshToken,
    };
  }

  private async clearRefreshSession(userId: string) {
    await this.usersService.updateRefreshSession(userId, {
      refreshTokenHash: null,
      refreshTokenExpiresAt: null,
    });
  }

  private hashToken(token: string) {
    return createHash("sha256").update(token).digest("hex");
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
