import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { CreditRequestStatus } from "@prisma/client";
import { PrismaService } from "@/infra/database/prisma.service";
import { CreateCreditRequestDto } from "./dto/create-credit-request.dto";
import { DecideCreditRequestDto } from "./dto/decide-credit-request.dto";

const CREDIT_REQUEST_COOLDOWN_MONTHS = 2;

@Injectable()
export class CreditRequestsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string) {
    const creditRequests = await this.prisma.creditRequest.findMany({
      where: { userId },
      include: { creditScore: true },
      orderBy: { requestedAt: "desc" },
    });

    return creditRequests.map((creditRequest) =>
      this.withDecisionDetails(creditRequest),
    );
  }

  async findById(userId: string, id: string) {
    const creditRequest = await this.prisma.creditRequest.findFirst({
      where: { id, userId },
      include: { creditScore: true },
    });

    if (!creditRequest) {
      throw new NotFoundException("Credit request not found");
    }

    return this.withDecisionDetails(creditRequest);
  }

  async create(userId: string, data: CreateCreditRequestDto) {
    const latestCreditRequest = await this.prisma.creditRequest.findFirst({
      where: { userId },
      orderBy: { requestedAt: "desc" },
    });

    if (latestCreditRequest) {
      const nextEligibleRequestAt = this.getNextEligibleRequestAt(
        latestCreditRequest.requestedAt,
      );

      if (nextEligibleRequestAt > new Date()) {
        throw new BadRequestException(
          `Você já fez uma solicitação de crédito nos últimos ${CREDIT_REQUEST_COOLDOWN_MONTHS} meses. Tente novamente a partir de ${new Intl.DateTimeFormat(
            "pt-BR",
            { day: "2-digit", month: "2-digit", year: "numeric" },
          ).format(nextEligibleRequestAt)}.`,
        );
      }
    }

    const creditScore = await this.prisma.creditScore.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    if (!creditScore) {
      throw new BadRequestException(
        "Calculate credit score before requesting credit",
      );
    }

    const requestedAmount = data.requestedAmount;
    const recommendedLimit = creditScore.recommendedLimit.toNumber();
    const status = this.calculateStatus(
      creditScore.score,
      requestedAmount,
      recommendedLimit,
    );

    const creditRequest = await this.prisma.creditRequest.create({
      data: {
        userId,
        creditScoreId: creditScore.id,
        requestedAmount,
        approvedAmount:
          status === CreditRequestStatus.APPROVED ? requestedAmount : null,
        status,
        requestedAt: new Date(),
        decidedAt: new Date(),
      },
      include: { creditScore: true },
    });

    return this.withDecisionDetails(creditRequest);
  }

  async decide(userId: string, id: string, data: DecideCreditRequestDto) {
    const creditRequest = await this.prisma.creditRequest.findFirst({
      where: { id, userId },
    });

    if (!creditRequest) {
      throw new NotFoundException("Credit request not found");
    }

    return this.prisma.creditRequest.update({
      where: { id },
      data: {
        status: data.status,
        approvedAmount: data.approvedAmount,
        decidedAt: new Date(),
      },
    });
  }

  private calculateStatus(
    score: number,
    requestedAmount: number,
    recommendedLimit: number,
  ) {
    if (score < 600) {
      return CreditRequestStatus.REJECTED;
    }

    if (requestedAmount <= recommendedLimit) {
      return CreditRequestStatus.APPROVED;
    }

    return CreditRequestStatus.REJECTED;
  }

  private calculateMonthlyInterestRate(score: number) {
    if (score >= 800) {
      return 2.49;
    }

    if (score >= 700) {
      return 3.19;
    }

    if (score >= 600) {
      return 3.89;
    }

    return null;
  }

  private getNextEligibleRequestAt(requestedAt: Date) {
    const nextEligibleRequestAt = new Date(requestedAt);
    nextEligibleRequestAt.setMonth(
      nextEligibleRequestAt.getMonth() + CREDIT_REQUEST_COOLDOWN_MONTHS,
    );
    return nextEligibleRequestAt;
  }

  private withDecisionDetails<
    T extends {
      requestedAmount: { toNumber(): number } | number;
      requestedAt: Date;
      status: CreditRequestStatus;
      creditScore: {
        score: number;
        recommendedLimit: { toNumber(): number } | number;
        incomeFrequencyPoints: number;
        incomeStabilityPoints: number;
        cashflowPoints: number;
        balancePoints: number;
        riskPenalty: number;
      };
    },
  >(creditRequest: T) {
    const requestedAmount =
      typeof creditRequest.requestedAmount === "number"
        ? creditRequest.requestedAmount
        : creditRequest.requestedAmount.toNumber();
    const recommendedLimit =
      typeof creditRequest.creditScore.recommendedLimit === "number"
        ? creditRequest.creditScore.recommendedLimit
        : creditRequest.creditScore.recommendedLimit.toNumber();
    const monthlyInterestRate = this.calculateMonthlyInterestRate(
      creditRequest.creditScore.score,
    );

    return {
      ...creditRequest,
      monthlyInterestRate,
      nextEligibleRequestAt: this.getNextEligibleRequestAt(
        creditRequest.requestedAt,
      ),
      explanation: this.buildExplanation(
        creditRequest.status,
        creditRequest.creditScore,
        requestedAmount,
        recommendedLimit,
        monthlyInterestRate,
      ),
    };
  }

  private buildExplanation(
    status: CreditRequestStatus,
    creditScore: {
      score: number;
      incomeFrequencyPoints: number;
      incomeStabilityPoints: number;
      cashflowPoints: number;
      balancePoints: number;
      riskPenalty: number;
    },
    requestedAmount: number,
    recommendedLimit: number,
    monthlyInterestRate: number | null,
  ) {
    if (status === CreditRequestStatus.APPROVED) {
      return `Sua solicitação foi aprovada porque o valor pedido está dentro do limite recomendado para o seu perfil atual. Taxa de juros: ${monthlyInterestRate?.toFixed(
        2,
      )}% ao mês.`;
    }

    if (status === CreditRequestStatus.REJECTED) {
      const reasons: string[] = [];
      const improvements: string[] = [];

      if (creditScore.score < 600) {
        reasons.push(
          `score atual de ${creditScore.score}, abaixo do mínimo de 600 pontos`,
        );
      }

      if (requestedAmount > recommendedLimit) {
        reasons.push(
          "valor solicitado acima do limite recomendado para o perfil atual",
        );
        improvements.push("solicitar um valor menor dentro do limite sugerido");
      }

      if (creditScore.incomeFrequencyPoints < 18) {
        improvements.push(
          "manter entradas de renda mais frequentes nas contas conectadas",
        );
      }

      if (creditScore.incomeStabilityPoints < 14) {
        improvements.push("reduzir variações fortes na renda mensal");
      }

      if (creditScore.cashflowPoints < 14 || creditScore.riskPenalty > 0) {
        improvements.push(
          "diminuir o comprometimento da renda com despesas recorrentes",
        );
      }

      if (creditScore.balancePoints < 10) {
        improvements.push("manter saldo médio positivo por mais dias");
      }

      const uniqueImprovements = [...new Set(improvements)];

      return `Não conseguimos aprovar sua solicitação porque identificamos ${
        reasons.length
          ? reasons.join(" e ")
          : "risco acima do aceitável para o perfil atual"
      }. Para melhorar, ${uniqueImprovements.length ? uniqueImprovements.join(", ") : "acompanhe suas métricas financeiras e tente novamente com dados mais recentes"}. Você poderá fazer uma nova solicitação após 2 meses.`;
    }

    return "Sua solicitação foi registrada e será acompanhada pelo nosso time.";
  }
}
