import { Module } from "@nestjs/common";
import { AdminApiKeyGuard } from "@/modules/auth/guards/admin-api-key.guard";
import { CreditRequestsController } from "./credit-requests.controller";
import { CreditRequestsService } from "./credit-requests.service";

@Module({
  controllers: [CreditRequestsController],
  providers: [CreditRequestsService, AdminApiKeyGuard],
  exports: [CreditRequestsService],
})
export class CreditRequestsModule {}
