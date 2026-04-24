import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { CreditRequestStatus } from "@prisma/client";
import { PrismaService } from "@/infra/database/prisma.service";
import { CreateCreditRequestDto } from "./dto/create-credit-request.dto";
import { DecideCreditRequestDto } from "./dto/decide-credit-request.dto";

@Injectable()
export class CreditRequestsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(userId: string) {
    return this.prisma.creditRequest.findMany({
      where: { userId },
      include: { creditScore: true },
      orderBy: { requestedAt: "desc" },
    });
  }

  async findById(userId: string, id: string) {
    const creditRequest = await this.prisma.creditRequest.findFirst({
      where: { id, userId },
      include: { creditScore: true },
    });

    if (!creditRequest) {
      throw new NotFoundException("Credit request not found");
    }

    return creditRequest;
  }

  async create(userId: string, data: CreateCreditRequestDto) {
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

    return {
      ...creditRequest,
      explanation: this.buildExplanation(
        status,
        requestedAmount,
        recommendedLimit,
      ),
    };
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
    if (score < 400) {
      return CreditRequestStatus.REJECTED;
    }

    if (score < 600) {
      return CreditRequestStatus.REVIEW;
    }

    if (requestedAmount <= recommendedLimit) {
      return CreditRequestStatus.APPROVED;
    }

    // Safer option: do not pre-approve a partial amount without human review.
    return CreditRequestStatus.REVIEW;
  }

  private buildExplanation(
    status: CreditRequestStatus,
    requestedAmount: number,
    recommendedLimit: number,
  ) {
    if (status === CreditRequestStatus.APPROVED) {
      return "Sua solicitação foi aprovada porque o valor pedido está dentro do limite recomendado para o seu perfil atual.";
    }

    if (status === CreditRequestStatus.REVIEW) {
      if (requestedAmount > recommendedLimit) {
        return "Sua solicitação precisa de análise adicional porque o valor pedido está acima do limite recomendado no momento.";
      }

      return "Sua solicitação precisa de análise adicional porque alguns pontos do seu perfil financeiro exigem uma revisão manual.";
    }

    if (status === CreditRequestStatus.REJECTED) {
      return "No momento, não conseguimos aprovar sua solicitação porque seu score atual ainda está abaixo do mínimo necessário.";
    }

    return "Sua solicitação foi registrada e será acompanhada pelo nosso time.";
  }
}
