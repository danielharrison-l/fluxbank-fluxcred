import { Injectable, NotFoundException } from "@nestjs/common";
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

  async create(userId: string, data: CreateCreditRequestDto) {
    const creditScore = await this.prisma.creditScore.findFirst({
      where: { id: data.creditScoreId, userId },
    });

    if (!creditScore) {
      throw new NotFoundException("Credit score not found");
    }

    return this.prisma.creditRequest.create({
      data: {
        userId,
        creditScoreId: creditScore.id,
        requestedAmount: data.requestedAmount,
        status: CreditRequestStatus.REQUESTED,
        requestedAt: new Date(),
      },
    });
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
}
