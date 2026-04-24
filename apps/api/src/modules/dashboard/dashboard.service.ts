import { Injectable } from "@nestjs/common";
import { TransactionType } from "@prisma/client";
import { PrismaService } from "@/infra/database/prisma.service";

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboard(userId: string) {
    const periodStart = this.getCurrentMonthStart();
    const periodEnd = new Date();

    const [
      accounts,
      incomeAggregation,
      expenseAggregation,
      recentTransactions,
      latestScore,
      latestCreditRequest,
    ] = await this.prisma.$transaction([
      this.prisma.financialAccount.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.transaction.aggregate({
        where: {
          userId,
          type: TransactionType.CREDIT,
          transactionDate: {
            gte: periodStart,
            lte: periodEnd,
          },
        },
        _sum: { amount: true },
      }),
      this.prisma.transaction.aggregate({
        where: {
          userId,
          type: TransactionType.DEBIT,
          transactionDate: {
            gte: periodStart,
            lte: periodEnd,
          },
        },
        _sum: { amount: true },
      }),
      this.prisma.transaction.findMany({
        where: { userId },
        orderBy: { transactionDate: "desc" },
        take: 10,
        include: {
          account: {
            select: {
              id: true,
              name: true,
              type: true,
              marketingName: true,
            },
          },
        },
      }),
      this.prisma.creditScore.findFirst({
        where: { userId },
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.creditRequest.findFirst({
        where: { userId },
        orderBy: { requestedAt: "desc" },
        include: { creditScore: true },
      }),
    ]);

    const totalBalance = accounts.reduce(
      (sum, account) => sum + account.currentBalance.toNumber(),
      0,
    );

    return {
      totalBalance,
      totalIncome: incomeAggregation._sum.amount?.toNumber() ?? 0,
      totalExpense: expenseAggregation._sum.amount?.abs().toNumber() ?? 0,
      accounts,
      recentTransactions,
      latestScore,
      recommendedLimit: latestScore?.recommendedLimit.toNumber() ?? 0,
      latestCreditRequest,
    };
  }

  private getCurrentMonthStart() {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }
}
