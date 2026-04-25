import { Injectable, NotFoundException } from "@nestjs/common";
import { CreditDecision, FinancialMetric } from "@prisma/client";
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

  findLatest(userId: string) {
    return this.prisma.creditScore.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  }

  async calculate(userId: string) {
    const metric = await this.prisma.financialMetric.findFirst({
      where: { userId },
      orderBy: { calculatedAt: "desc" },
    });

    if (!metric) {
      throw new NotFoundException("Financial metric not found");
    }

    return this.createFromMetric(userId, metric);
  }

  async create(userId: string, data: CreateCreditScoreDto) {
    const metric = await this.prisma.financialMetric.findFirst({
      where: { id: data.financialMetricId, userId },
    });

    if (!metric) {
      throw new NotFoundException("Financial metric not found");
    }

    return this.createFromMetric(userId, metric);
  }

  private createFromMetric(userId: string, metric: FinancialMetric) {
    const incomeFrequencyPoints = this.calculateIncomeFrequencyPoints(metric);
    const incomeStabilityPoints = this.calculateIncomeStabilityPoints(metric);
    const cashflowPoints = this.calculateCashflowPoints(metric);
    const balancePoints = this.calculateBalancePoints(metric);
    const incomeVolumePoints = this.calculateIncomeVolumePoints(metric);
    const riskPenalty = this.calculateRiskPenalty(metric);
    const baseScore = Math.max(
      0,
      Math.min(
        100,
        incomeFrequencyPoints +
          incomeStabilityPoints +
          cashflowPoints +
          balancePoints +
          incomeVolumePoints -
          riskPenalty,
      ),
    );
    const score = baseScore * 10;
    const decision = this.calculateDecision(score);
    const recommendedLimit = this.calculateRecommendedLimit(metric, score);

    return this.prisma.creditScore.create({
      data: {
        userId,
        financialMetricId: metric.id,
        score,
        decision,
        recommendedLimit,
        incomeFrequencyPoints,
        incomeStabilityPoints,
        cashflowPoints: cashflowPoints + incomeVolumePoints,
        balancePoints,
        riskPenalty,
        explanation: this.buildExplanation(metric, score, decision),
      },
    });
  }

  private calculateIncomeFrequencyPoints(metric: FinancialMetric) {
    const score = metric.incomeFrequencyScore.toNumber();

    if (score >= 90) {
      return 25;
    }

    if (score >= 70) {
      return 18;
    }

    if (score >= 40) {
      return 10;
    }

    return 3;
  }

  private calculateIncomeStabilityPoints(metric: FinancialMetric) {
    const score = metric.incomeStabilityScore.toNumber();

    if (score >= 90) {
      return 20;
    }

    if (score >= 70) {
      return 14;
    }

    if (score >= 40) {
      return 8;
    }

    return 2;
  }

  private calculateCashflowPoints(metric: FinancialMetric) {
    const expenseRatio = metric.expenseRatio.toNumber();

    if (expenseRatio <= 0.6) {
      return 20;
    }

    if (expenseRatio <= 0.8) {
      return 14;
    }

    if (expenseRatio <= 1) {
      return 8;
    }

    return 0;
  }

  private calculateBalancePoints(metric: FinancialMetric) {
    const averageBalance = metric.averageBalance.toNumber();

    if (averageBalance > 1000) {
      return 15;
    }

    if (averageBalance > 500) {
      return 10;
    }

    if (averageBalance > 0) {
      return 5;
    }

    return 0;
  }

  private calculateIncomeVolumePoints(metric: FinancialMetric) {
    const avgMonthlyIncome = metric.avgMonthlyIncome.toNumber();

    if (avgMonthlyIncome >= 3000) {
      return 10;
    }

    if (avgMonthlyIncome >= 1500) {
      return 7;
    }

    if (avgMonthlyIncome >= 800) {
      return 4;
    }

    return 1;
  }

  private calculateRiskPenalty(metric: FinancialMetric) {
    let penalty = 0;

    if (metric.expenseRatio.toNumber() > 1.2) {
      penalty += 10;
    }

    if (metric.avgMonthlyIncome.toNumber() < 800) {
      penalty += 5;
    }

    if (metric.noIncomeDays > 20) {
      penalty += 10;
    }

    if (metric.averageBalance.toNumber() < 0) {
      penalty += 10;
    }

    return Math.min(30, penalty);
  }

  private calculateDecision(score: number) {
    if (score >= 600) {
      return CreditDecision.APPROVED;
    }

    return CreditDecision.REJECTED;
  }

  private calculateRecommendedLimit(metric: FinancialMetric, score: number) {
    const avgMonthlyIncome = metric.avgMonthlyIncome.toNumber();

    if (score >= 800) {
      return avgMonthlyIncome * 0.3;
    }

    if (score >= 600) {
      return avgMonthlyIncome * 0.15;
    }

    return 0;
  }

  private buildExplanation(
    metric: FinancialMetric,
    _score: number,
    decision: CreditDecision,
  ) {
    const hasHealthyExpenses = metric.expenseRatio.toNumber() <= 0.8;
    const hasFrequentIncome = metric.incomeFrequencyScore.toNumber() >= 70;

    if (decision === CreditDecision.APPROVED) {
      if (hasFrequentIncome && hasHealthyExpenses) {
        return "Seu crédito foi aprovado porque sua renda apresenta boa frequência e seus gastos estão dentro de um padrão saudável.";
      }

      return "Seu crédito foi aprovado porque seu histórico financeiro mostra renda suficiente para um limite inicial mais conservador.";
    }

    if (metric.expenseRatio.toNumber() > 1) {
      return "No momento, não conseguimos aprovar seu crédito porque identificamos alto comprometimento dos ganhos.";
    }

    if (!hasFrequentIncome) {
      return "No momento, não conseguimos aprovar seu crédito porque identificamos baixa frequência de renda no período analisado.";
    }

    return "No momento, não conseguimos aprovar seu crédito porque os dados disponíveis ainda não indicam segurança suficiente para liberação.";
  }
}
