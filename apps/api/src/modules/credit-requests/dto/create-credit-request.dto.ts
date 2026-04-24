import { IsNumber, IsUUID, Min } from "class-validator";

export class CreateCreditRequestDto {
  @IsUUID()
  creditScoreId!: string;

  @IsNumber()
  @Min(1)
  requestedAmount!: number;
}
