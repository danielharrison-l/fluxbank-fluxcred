-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "pluggy_item_status" AS ENUM ('CREATED', 'WAITING_USER_INPUT', 'UPDATING', 'UPDATED', 'LOGIN_ERROR', 'OUTDATED', 'ERROR');

-- CreateEnum
CREATE TYPE "pluggy_execution_status" AS ENUM ('SUCCESS', 'PARTIAL_SUCCESS', 'ERROR', 'RUNNING');

-- CreateEnum
CREATE TYPE "consent_status" AS ENUM ('ACTIVE', 'EXPIRED', 'REVOKED', 'ERROR');

-- CreateEnum
CREATE TYPE "account_type" AS ENUM ('BANK', 'CREDIT', 'INVESTMENT', 'LOAN', 'OTHER');

-- CreateEnum
CREATE TYPE "account_status" AS ENUM ('ACTIVE', 'INACTIVE', 'ERROR');

-- CreateEnum
CREATE TYPE "transaction_type" AS ENUM ('CREDIT', 'DEBIT');

-- CreateEnum
CREATE TYPE "transaction_status" AS ENUM ('POSTED', 'PENDING');

-- CreateEnum
CREATE TYPE "credit_decision" AS ENUM ('APPROVED', 'MANUAL_REVIEW', 'REJECTED');

-- CreateEnum
CREATE TYPE "credit_request_status" AS ENUM ('REQUESTED', 'APPROVED', 'REVIEW', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "sync_status" AS ENUM ('RUNNING', 'SUCCESS', 'PARTIAL_SUCCESS', 'ERROR');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "phone" TEXT,
    "document" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pluggy_items" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "pluggy_item_id" TEXT NOT NULL,
    "connector_id" TEXT,
    "institution_name" TEXT,
    "status" "pluggy_item_status" NOT NULL,
    "status_detail" TEXT,
    "execution_status" "pluggy_execution_status",
    "last_updated_at" TIMESTAMP(3),
    "last_successful_sync_at" TIMESTAMP(3),
    "error_code" TEXT,
    "error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pluggy_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consents" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "pluggy_item_id" UUID NOT NULL,
    "status" "consent_status" NOT NULL,
    "scopes" TEXT[],
    "granted_at" TIMESTAMP(3) NOT NULL,
    "expires_at" TIMESTAMP(3),
    "revoked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "consents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "financial_accounts" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "pluggy_item_id" UUID NOT NULL,
    "pluggy_account_id" TEXT NOT NULL,
    "type" "account_type" NOT NULL,
    "subtype" TEXT,
    "number_masked" TEXT,
    "name" TEXT,
    "marketing_name" TEXT,
    "owner_name" TEXT,
    "tax_number_masked" TEXT,
    "currency_code" TEXT NOT NULL,
    "current_balance" DECIMAL(14,2) NOT NULL,
    "available_credit_limit" DECIMAL(14,2),
    "credit_limit" DECIMAL(14,2),
    "balance_due_date" TIMESTAMP(3),
    "balance_close_date" TIMESTAMP(3),
    "status" "account_status" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "financial_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "account_id" UUID NOT NULL,
    "pluggy_transaction_id" TEXT NOT NULL,
    "type" "transaction_type" NOT NULL,
    "status" "transaction_status" NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "balance_after_transaction" DECIMAL(14,2),
    "currency_code" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "description_raw" TEXT,
    "category" TEXT,
    "category_id" TEXT,
    "merchant_name" TEXT,
    "transaction_date" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "financial_metrics" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "period_start" TIMESTAMP(3) NOT NULL,
    "period_end" TIMESTAMP(3) NOT NULL,
    "total_income" DECIMAL(14,2) NOT NULL,
    "total_expense" DECIMAL(14,2) NOT NULL,
    "avg_monthly_income" DECIMAL(14,2) NOT NULL,
    "avg_daily_income" DECIMAL(14,2) NOT NULL,
    "income_days" INTEGER NOT NULL,
    "no_income_days" INTEGER NOT NULL,
    "income_frequency_score" DECIMAL(5,2) NOT NULL,
    "income_stability_score" DECIMAL(5,2) NOT NULL,
    "expense_ratio" DECIMAL(5,2) NOT NULL,
    "average_balance" DECIMAL(14,2) NOT NULL,
    "min_balance" DECIMAL(14,2) NOT NULL,
    "max_balance" DECIMAL(14,2) NOT NULL,
    "calculated_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "financial_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "credit_scores" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "financial_metric_id" UUID NOT NULL,
    "score" INTEGER NOT NULL,
    "decision" "credit_decision" NOT NULL,
    "recommended_limit" DECIMAL(14,2) NOT NULL,
    "income_frequency_points" INTEGER NOT NULL,
    "income_stability_points" INTEGER NOT NULL,
    "cashflow_points" INTEGER NOT NULL,
    "balance_points" INTEGER NOT NULL,
    "risk_penalty" INTEGER NOT NULL,
    "explanation" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "credit_scores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "credit_requests" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "credit_score_id" UUID NOT NULL,
    "requested_amount" DECIMAL(14,2) NOT NULL,
    "approved_amount" DECIMAL(14,2),
    "status" "credit_request_status" NOT NULL,
    "requested_at" TIMESTAMP(3) NOT NULL,
    "decided_at" TIMESTAMP(3),

    CONSTRAINT "credit_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sync_logs" (
    "id" UUID NOT NULL,
    "pluggy_item_id" UUID NOT NULL,
    "status" "sync_status" NOT NULL,
    "started_at" TIMESTAMP(3) NOT NULL,
    "finished_at" TIMESTAMP(3),
    "accounts_synced" INTEGER NOT NULL DEFAULT 0,
    "transactions_synced" INTEGER NOT NULL DEFAULT 0,
    "error_message" TEXT,
    "metadata" JSONB,

    CONSTRAINT "sync_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "pluggy_items_pluggy_item_id_key" ON "pluggy_items"("pluggy_item_id");

-- CreateIndex
CREATE INDEX "pluggy_items_user_id_idx" ON "pluggy_items"("user_id");

-- CreateIndex
CREATE INDEX "consents_user_id_idx" ON "consents"("user_id");

-- CreateIndex
CREATE INDEX "consents_pluggy_item_id_idx" ON "consents"("pluggy_item_id");

-- CreateIndex
CREATE INDEX "consents_status_idx" ON "consents"("status");

-- CreateIndex
CREATE UNIQUE INDEX "financial_accounts_pluggy_account_id_key" ON "financial_accounts"("pluggy_account_id");

-- CreateIndex
CREATE INDEX "financial_accounts_user_id_idx" ON "financial_accounts"("user_id");

-- CreateIndex
CREATE INDEX "financial_accounts_pluggy_item_id_idx" ON "financial_accounts"("pluggy_item_id");

-- CreateIndex
CREATE INDEX "financial_accounts_status_idx" ON "financial_accounts"("status");

-- CreateIndex
CREATE UNIQUE INDEX "transactions_pluggy_transaction_id_key" ON "transactions"("pluggy_transaction_id");

-- CreateIndex
CREATE INDEX "transactions_user_id_transaction_date_idx" ON "transactions"("user_id", "transaction_date" DESC);

-- CreateIndex
CREATE INDEX "transactions_account_id_transaction_date_idx" ON "transactions"("account_id", "transaction_date" DESC);

-- CreateIndex
CREATE INDEX "transactions_type_idx" ON "transactions"("type");

-- CreateIndex
CREATE INDEX "transactions_category_idx" ON "transactions"("category");

-- CreateIndex
CREATE INDEX "transactions_status_idx" ON "transactions"("status");

-- CreateIndex
CREATE INDEX "financial_metrics_user_id_period_start_period_end_idx" ON "financial_metrics"("user_id", "period_start", "period_end");

-- CreateIndex
CREATE INDEX "credit_scores_user_id_created_at_idx" ON "credit_scores"("user_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "credit_scores_financial_metric_id_idx" ON "credit_scores"("financial_metric_id");

-- CreateIndex
CREATE INDEX "credit_requests_user_id_status_idx" ON "credit_requests"("user_id", "status");

-- CreateIndex
CREATE INDEX "credit_requests_credit_score_id_idx" ON "credit_requests"("credit_score_id");

-- CreateIndex
CREATE INDEX "sync_logs_pluggy_item_id_started_at_idx" ON "sync_logs"("pluggy_item_id", "started_at" DESC);

-- CreateIndex
CREATE INDEX "sync_logs_status_idx" ON "sync_logs"("status");

-- AddForeignKey
ALTER TABLE "pluggy_items" ADD CONSTRAINT "pluggy_items_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consents" ADD CONSTRAINT "consents_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consents" ADD CONSTRAINT "consents_pluggy_item_id_fkey" FOREIGN KEY ("pluggy_item_id") REFERENCES "pluggy_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_accounts" ADD CONSTRAINT "financial_accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_accounts" ADD CONSTRAINT "financial_accounts_pluggy_item_id_fkey" FOREIGN KEY ("pluggy_item_id") REFERENCES "pluggy_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "financial_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_metrics" ADD CONSTRAINT "financial_metrics_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credit_scores" ADD CONSTRAINT "credit_scores_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credit_scores" ADD CONSTRAINT "credit_scores_financial_metric_id_fkey" FOREIGN KEY ("financial_metric_id") REFERENCES "financial_metrics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credit_requests" ADD CONSTRAINT "credit_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credit_requests" ADD CONSTRAINT "credit_requests_credit_score_id_fkey" FOREIGN KEY ("credit_score_id") REFERENCES "credit_scores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sync_logs" ADD CONSTRAINT "sync_logs_pluggy_item_id_fkey" FOREIGN KEY ("pluggy_item_id") REFERENCES "pluggy_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
