import { Injectable, NotFoundException } from "@nestjs/common";
import { CreditDecision } from "@prisma/client";
import { PrismaService } from "@/infra/database/prisma.service";
import { CreateCreditScoreDto } from "./dto/create-credit-score.dto";

@Injectable()
export class CreditScoreService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(userId: string) {
    return this.prisma.creditScore.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  }

  async create(userId: string, data: CreateCreditScoreDto) {
    const metric = await this.prisma.financialMetric.findFirst({
      where: { id: data.financialMetricId, userId },
    });

    if (!metric) {
      throw new NotFoundException("Financial metric not found");
    }

    const incomeFrequencyPoints = Math.round(
      metric.incomeFrequencyScore.toNumber() * 1.5,
    );
    const incomeStabilityPoints = Math.round(
      metric.incomeStabilityScore.toNumber() * 1.5,
    );
    const cashflowPoints = metric.totalIncome.greaterThan(metric.totalExpense)
      ? 250
      : 80;
    const balancePoints = metric.averageBalance.greaterThan(0) ? 200 : 40;
    const riskPenalty = metric.expenseRatio.greaterThan(80) ? 120 : 0;
    const score = Math.max(
      0,
      Math.min(
        1000,
        incomeFrequencyPoints +
          incomeStabilityPoints +
          cashflowPoints +
          balancePoints -
          riskPenalty,
      ),
    );
    const decision =
      score >= 650
        ? CreditDecision.APPROVED
        : score >= 500
          ? CreditDecision.MANUAL_REVIEW
          : CreditDecision.REJECTED;
    const recommendedLimit =
      decision === CreditDecision.REJECTED
        ? 0
        : metric.avgMonthlyIncome.toNumber() * 0.3;

    return this.prisma.creditScore.create({
      data: {
        userId,
        financialMetricId: metric.id,
        score,
        decision,
        recommendedLimit,
        incomeFrequencyPoints,
        incomeStabilityPoints,
        cashflowPoints,
        balancePoints,
        riskPenalty,
        explanation: `Score ${score} based on income frequency, income stability, cashflow and balance behavior.`,
      },
    });
  }
}
