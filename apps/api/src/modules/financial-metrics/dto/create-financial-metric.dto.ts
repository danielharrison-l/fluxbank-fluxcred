import { IsDateString } from "class-validator";

export class CreateFinancialMetricDto {
  @IsDateString()
  periodStart!: string;

  @IsDateString()
  periodEnd!: string;
}
