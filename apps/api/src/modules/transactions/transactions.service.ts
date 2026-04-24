import { Injectable } from "@nestjs/common";
import { PrismaService } from "@/infra/database/prisma.service";
import { ListTransactionsQueryDto } from "./dto/list-transactions-query.dto";

@Injectable()
export class TransactionsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(userId: string, query: ListTransactionsQueryDto) {
    return this.prisma.transaction.findMany({
      where: {
        userId,
        accountId: query.accountId,
        transactionDate:
          query.from || query.to
            ? {
                gte: query.from ? new Date(query.from) : undefined,
                lte: query.to ? new Date(query.to) : undefined,
              }
            : undefined,
      },
      orderBy: { transactionDate: "desc" },
      take: 200,
    });
  }
}
