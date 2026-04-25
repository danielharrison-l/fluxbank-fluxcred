import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsDateString, IsOptional } from "class-validator";

export class CreateFinancialMetricDto {
  @ApiPropertyOptional({ example: "2026-01-01T00:00:00.000Z" })
  @IsOptional()
  @IsDateString()
  periodStart?: string;

  @ApiPropertyOptional({ example: "2026-03-31T23:59:59.999Z" })
  @IsOptional()
  @IsDateString()
  periodEnd?: string;
}
