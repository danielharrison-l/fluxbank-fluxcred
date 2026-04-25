import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { CreditRequestStatus } from "@prisma/client";
import { IsEnum, IsNumber, IsOptional, Min } from "class-validator";

export class DecideCreditRequestDto {
  @ApiProperty({
    enum: CreditRequestStatus,
    example: CreditRequestStatus.APPROVED,
  })
  @IsEnum(CreditRequestStatus)
  status!: CreditRequestStatus;

  @ApiPropertyOptional({ example: 500, minimum: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  approvedAmount?: number;
}
