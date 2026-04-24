import { Injectable } from "@nestjs/common";
import { TransactionType } from "@prisma/client";
import { PrismaService } from "@/infra/database/prisma.service";
import { CreateFinancialMetricDto } from "./dto/create-financial-metric.dto";

@Injectable()
export class FinancialMetricsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(userId: string) {
    return this.prisma.financialMetric.findMany({
      where: { userId },
      orderBy: { calculatedAt: "desc" },
    });
  }

  async calculate(userId: string, data: CreateFinancialMetricDto) {
    const periodStart = new Date(data.periodStart);
    const periodEnd = new Date(data.periodEnd);
    const transactions = await this.prisma.transaction.findMany({
      where: {
        userId,
        transactionDate: {
          gte: periodStart,
          lte: periodEnd,
        },
      },
      orderBy: { transactionDate: "asc" },
    });

    const incomeTransactions = transactions.filter(
      (transaction) => transaction.type === TransactionType.CREDIT,
    );
    const expenseTransactions = transactions.filter(
      (transaction) => transaction.type === TransactionType.DEBIT,
    );
    const totalIncome = incomeTransactions.reduce(
      (sum, transaction) => sum + transaction.amount.toNumber(),
      0,
    );
    const totalExpense = expenseTransactions.reduce(
      (sum, transaction) => sum + Math.abs(transaction.amount.toNumber()),
      0,
    );
    const periodDays = Math.max(
      1,
      Math.ceil((periodEnd.getTime() - periodStart.getTime()) / 86400000),
    );
    const periodMonths = Math.max(1, periodDays / 30);
    const incomeDays = new Set(
      incomeTransactions.map((transaction) =>
        transaction.transactionDate.toISOString().slice(0, 10),
      ),
    ).size;
    const balances = transactions
      .map((transaction) => transaction.balanceAfterTransaction?.toNumber())
      .filter((value): value is number => typeof value === "number");
    const averageBalance = balances.length
      ? balances.reduce((sum, balance) => sum + balance, 0) / balances.length
      : 0;

    return this.prisma.financialMetric.create({
      data: {
        userId,
        periodStart,
        periodEnd,
        totalIncome,
        totalExpense,
        avgMonthlyIncome: totalIncome / periodMonths,
        avgDailyIncome: totalIncome / periodDays,
        incomeDays,
        noIncomeDays: Math.max(0, periodDays - incomeDays),
        incomeFrequencyScore: Math.min(100, (incomeDays / periodDays) * 100),
        incomeStabilityScore:
          incomeTransactions.length > 1
            ? 75
            : incomeTransactions.length
              ? 40
              : 0,
        expenseRatio:
          totalIncome > 0
            ? Math.min(999.99, (totalExpense / totalIncome) * 100)
            : 0,
        averageBalance,
        minBalance: balances.length ? Math.min(...balances) : 0,
        maxBalance: balances.length ? Math.max(...balances) : 0,
        calculatedAt: new Date(),
      },
    });
  }
}
