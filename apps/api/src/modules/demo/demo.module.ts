import { Module } from "@nestjs/common";
import { CreditRequestsModule } from "@/modules/credit-requests/credit-requests.module";
import { CreditScoreModule } from "@/modules/credit-score/credit-score.module";
import { FinancialMetricsModule } from "@/modules/financial-metrics/financial-metrics.module";
import { DemoController } from "./demo.controller";
import { DemoService } from "./demo.service";

@Module({
  imports: [FinancialMetricsModule, CreditScoreModule, CreditRequestsModule],
  controllers: [DemoController],
  providers: [DemoService],
})
export class DemoModule {}
