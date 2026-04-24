import { IsDateString, IsOptional } from "class-validator";

export class CreateFinancialMetricDto {
  @IsOptional()
  @IsDateString()
  periodStart?: string;

  @IsOptional()
  @IsDateString()
  periodEnd?: string;
}
