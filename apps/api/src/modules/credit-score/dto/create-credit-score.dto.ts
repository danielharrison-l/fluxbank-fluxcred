import { IsUUID } from "class-validator";

export class CreateCreditScoreDto {
  @IsUUID()
  financialMetricId!: string;
}
