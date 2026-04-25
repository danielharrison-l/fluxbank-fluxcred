import { ApiProperty } from "@nestjs/swagger";
import { IsUUID } from "class-validator";

export class CreateCreditScoreDto {
  @ApiProperty({ example: "6f1f6c52-a02e-4ae6-b07f-2cbf4fd79e2f" })
  @IsUUID()
  financialMetricId!: string;
}
