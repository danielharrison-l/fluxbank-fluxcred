import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { UsersService } from "@/modules/users/users.service";

export type JwtPayload = {
  sub: string;
  email: string;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly usersService: UsersService) {
    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      throw new Error("JWT_SECRET must be defined in environment variables");
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.usersService.findById(payload.sub);

    if (!user) {
      throw new UnauthorizedException("Invalid token");
    }

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
    return safeUser;
  }
}
