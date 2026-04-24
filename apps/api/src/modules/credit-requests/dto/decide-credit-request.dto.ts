import { CreditRequestStatus } from "@prisma/client";
import { IsEnum, IsNumber, IsOptional, Min } from "class-validator";

export class DecideCreditRequestDto {
  @IsEnum(CreditRequestStatus)
  status!: CreditRequestStatus;

  @IsOptional()
  @IsNumber()
  @Min(0)
  approvedAmount?: number;
}
