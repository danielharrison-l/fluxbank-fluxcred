import { Module } from "@nestjs/common";
import { CreditRequestsController } from "./credit-requests.controller";
import { CreditRequestsService } from "./credit-requests.service";

@Module({
  controllers: [CreditRequestsController],
  providers: [CreditRequestsService],
})
export class CreditRequestsModule {}
