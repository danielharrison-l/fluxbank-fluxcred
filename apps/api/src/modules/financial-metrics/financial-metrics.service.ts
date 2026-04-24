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

  findLatest(userId: string) {
    return this.prisma.financialMetric.findFirst({
      where: { userId },
      orderBy: { calculatedAt: "desc" },
    });
  }

  async calculate(userId: string, data: CreateFinancialMetricDto) {
    const periodEnd = data.periodEnd ? new Date(data.periodEnd) : new Date();
    const periodStart = data.periodStart
      ? new Date(data.periodStart)
      : this.subtractDays(periodEnd, 90);
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
    const dailyIncomeTotals = this.groupIncomeByDay(incomeTransactions);
    const incomeDays = dailyIncomeTotals.length;
    const balances = transactions
      .map((transaction) => transaction.balanceAfterTransaction?.toNumber())
      .filter((value): value is number => typeof value === "number");
    const averageBalance = balances.length
      ? balances.reduce((sum, balance) => sum + balance, 0) / balances.length
      : 0;
    const monthlyIncomeDays = incomeDays / periodMonths;

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
        incomeFrequencyScore:
          this.calculateIncomeFrequencyScore(monthlyIncomeDays),
        incomeStabilityScore:
          this.calculateIncomeStabilityScore(dailyIncomeTotals),
        expenseRatio: totalIncome > 0 ? totalExpense / totalIncome : 0,
        averageBalance,
        minBalance: balances.length ? Math.min(...balances) : 0,
        maxBalance: balances.length ? Math.max(...balances) : 0,
        calculatedAt: new Date(),
      },
    });
  }

  private subtractDays(date: Date, days: number) {
    const result = new Date(date);
    result.setDate(result.getDate() - days);
    return result;
  }

  private groupIncomeByDay(
    incomeTransactions: Array<{
      amount: { toNumber(): number };
      transactionDate: Date;
    }>,
  ) {
    const totals = new Map<string, number>();

    for (const transaction of incomeTransactions) {
      const day = transaction.transactionDate.toISOString().slice(0, 10);
      totals.set(day, (totals.get(day) ?? 0) + transaction.amount.toNumber());
    }

    return Array.from(totals.values());
  }

  private calculateIncomeFrequencyScore(monthlyIncomeDays: number) {
    if (monthlyIncomeDays >= 20) {
      return 100;
    }

    if (monthlyIncomeDays >= 12) {
      return 70;
    }

    if (monthlyIncomeDays >= 6) {
      return 40;
    }

    return 10;
  }

  private calculateIncomeStabilityScore(dailyIncomeTotals: number[]) {
    if (dailyIncomeTotals.length <= 1) {
      return dailyIncomeTotals.length === 1 ? 40 : 10;
    }

    const average =
      dailyIncomeTotals.reduce((sum, value) => sum + value, 0) /
      dailyIncomeTotals.length;

    if (average === 0) {
      return 10;
    }

    const variance =
      dailyIncomeTotals.reduce(
        (sum, value) => sum + (value - average) ** 2,
        0,
      ) / dailyIncomeTotals.length;
    const coefficientOfVariation = Math.sqrt(variance) / average;

    if (coefficientOfVariation <= 0.25) {
      return 100;
    }

    if (coefficientOfVariation <= 0.5) {
      return 70;
    }

    if (coefficientOfVariation <= 1) {
      return 40;
    }

    return 10;
  }
}
