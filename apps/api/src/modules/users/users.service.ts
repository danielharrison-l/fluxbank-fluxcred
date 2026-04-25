import { ConflictException, Injectable } from "@nestjs/common";
import { PrismaService } from "@/infra/database/prisma.service";
import { CreateUserDto } from "./dto/create-user.dto";

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async createUser(
    data: CreateUserDto & {
      passwordHash: string;
      emailVerifiedAt?: Date | null;
      emailVerificationTokenHash?: string | null;
      emailVerificationTokenExpiresAt?: Date | null;
      passwordResetTokenHash?: string | null;
      passwordResetTokenExpiresAt?: Date | null;
    },
  ) {
    const existingUser = await this.findByEmail(data.email);

    if (existingUser) {
      throw new ConflictException("Email already registered");
    }

    return this.prisma.user.create({
      data: {
        name: data.name,
        email: data.email.toLowerCase(),
        passwordHash: data.passwordHash,
        phone: data.phone,
        document: data.document,
        emailVerifiedAt: data.emailVerifiedAt,
        emailVerificationTokenHash: data.emailVerificationTokenHash,
        emailVerificationTokenExpiresAt: data.emailVerificationTokenExpiresAt,
        passwordResetTokenHash: data.passwordResetTokenHash,
        passwordResetTokenExpiresAt: data.passwordResetTokenExpiresAt,
      },
    });
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
  }

  async findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  async findByEmailVerificationTokenHash(emailVerificationTokenHash: string) {
    return this.prisma.user.findUnique({
      where: { emailVerificationTokenHash },
    });
  }

  async findByPasswordResetTokenHash(passwordResetTokenHash: string) {
    return this.prisma.user.findUnique({
      where: { passwordResetTokenHash },
    });
  }

  async findSafeById(id: string) {
    const user = await this.findById(id);

    if (!user) {
      return null;
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

  async updateRefreshSession(
    userId: string,
    data: {
      refreshTokenHash: string | null;
      refreshTokenExpiresAt: Date | null;
    },
  ) {
    return this.prisma.user.update({
      where: { id: userId },
      data,
    });
  }

  async createRefreshSession(
    userId: string,
    data: {
      id: string;
      tokenHash: string;
      expiresAt: Date;
    },
  ) {
    return this.prisma.refreshSession.create({
      data: {
        id: data.id,
        userId,
        tokenHash: data.tokenHash,
        expiresAt: data.expiresAt,
      },
    });
  }

  async findRefreshSession(id: string) {
    return this.prisma.refreshSession.findUnique({
      where: { id },
      include: { user: true },
    });
  }

  async deleteRefreshSession(id: string) {
    await this.prisma.refreshSession.deleteMany({
      where: { id },
    });
  }

  async deleteRefreshSessionsByUser(userId: string) {
    await this.prisma.refreshSession.deleteMany({
      where: { userId },
    });
  }

  async updateEmailVerification(
    userId: string,
    data: {
      emailVerifiedAt?: Date | null;
      emailVerificationTokenHash?: string | null;
      emailVerificationTokenExpiresAt?: Date | null;
    },
  ) {
    return this.prisma.user.update({
      where: { id: userId },
      data,
    });
  }

  async updatePasswordReset(
    userId: string,
    data: {
      passwordResetTokenHash?: string | null;
      passwordResetTokenExpiresAt?: Date | null;
    },
  ) {
    return this.prisma.user.update({
      where: { id: userId },
      data,
    });
  }

  async updatePassword(userId: string, passwordHash: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash,
      },
    });
  }

  async deleteUser(id: string) {
    await this.prisma.user.delete({
      where: { id },
    });
  }
}
