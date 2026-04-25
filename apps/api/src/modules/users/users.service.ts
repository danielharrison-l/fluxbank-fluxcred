import { ConflictException, Injectable } from "@nestjs/common";
import { PrismaService } from "@/infra/database/prisma.service";
import { CreateUserDto } from "./dto/create-user.dto";

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async createUser(data: CreateUserDto & { passwordHash: string }) {
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

  async findSafeById(id: string) {
    const user = await this.findById(id);

    if (!user) {
      return null;
    }

    const {
      passwordHash: _passwordHash,
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
}
