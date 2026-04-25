import { Module } from "@nestjs/common";
import { CreditScoreModule } from "@/modules/credit-score/credit-score.module";
import { FinancialMetricsModule } from "@/modules/financial-metrics/financial-metrics.module";
import { DemoController } from "./demo.controller";
import { DemoService } from "./demo.service";

@Module({
  imports: [FinancialMetricsModule, CreditScoreModule],
  controllers: [DemoController],
  providers: [DemoService],
})
export class DemoModule {}
