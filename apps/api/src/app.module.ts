import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { PrismaModule } from "./infra/database/prisma.module";
import { AccountsModule } from "./modules/accounts/accounts.module";
import { AuthModule } from "./modules/auth/auth.module";
import { CreditRequestsModule } from "./modules/credit-requests/credit-requests.module";
import { CreditScoreModule } from "./modules/credit-score/credit-score.module";
import { FinancialMetricsModule } from "./modules/financial-metrics/financial-metrics.module";
import { PluggyModule } from "./modules/pluggy/pluggy.module";
import { TransactionsModule } from "./modules/transactions/transactions.module";
import { UsersModule } from "./modules/users/users.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    PluggyModule,
    AccountsModule,
    TransactionsModule,
    FinancialMetricsModule,
    CreditScoreModule,
    CreditRequestsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
