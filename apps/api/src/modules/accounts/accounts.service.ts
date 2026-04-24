import { Injectable } from "@nestjs/common";
import { PrismaService } from "@/infra/database/prisma.service";
import { ListAccountsQueryDto } from "./dto/list-accounts-query.dto";

@Injectable()
export class AccountsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(userId: string, query: ListAccountsQueryDto) {
    return this.prisma.financialAccount.findMany({
      where: {
        userId,
        pluggyItemId: query.pluggyItemId,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  findById(userId: string, id: string) {
    return this.prisma.financialAccount.findFirst({
      where: { id, userId },
    });
  }
}
