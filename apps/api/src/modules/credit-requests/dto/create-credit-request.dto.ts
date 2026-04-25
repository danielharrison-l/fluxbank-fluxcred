import { ApiProperty } from "@nestjs/swagger";
import { IsNumber, Min } from "class-validator";

export class CreateCreditRequestDto {
  @ApiProperty({ example: 500, minimum: 1 })
  @IsNumber()
  @Min(1)
  requestedAmount!: number;
}
