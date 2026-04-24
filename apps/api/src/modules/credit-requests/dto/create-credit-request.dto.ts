import { IsNumber, Min } from "class-validator";

export class CreateCreditRequestDto {
  @IsNumber()
  @Min(1)
  requestedAmount!: number;
}
