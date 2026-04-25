import { Module } from "@nestjs/common";
import { FinancialMetricsController } from "./financial-metrics.controller";
import { FinancialMetricsService } from "./financial-metrics.service";

@Module({
  controllers: [FinancialMetricsController],
  providers: [FinancialMetricsService],
  exports: [FinancialMetricsService],
})
export class FinancialMetricsModule {}
