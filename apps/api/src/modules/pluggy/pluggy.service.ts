import { Injectable, NotFoundException } from "@nestjs/common";
import {
  AccountStatus,
  AccountType,
  PluggyExecutionStatus,
  PluggyItemStatus,
  SyncStatus,
  TransactionStatus,
  TransactionType,
} from "@prisma/client";
import axios, { AxiosInstance } from "axios";
import { PrismaService } from "@/infra/database/prisma.service";

type PluggyAuthResponse = {
  apiKey: string;
};

type PluggyListResponse<T> = {
  results?: T[];
  total?: number;
};

type PluggyItemResponse = {
  id: string;
  connector?: { id?: string; name?: string };
  status?: string;
  statusDetail?: string;
  executionStatus?: string;
  updatedAt?: string;
};

type PluggyAccountResponse = {
  id: string;
  type?: string;
  subtype?: string;
  number?: string;
  name?: string;
  marketingName?: string;
  owner?: { name?: string; taxNumber?: string };
  currencyCode?: string;
  balance?: number;
  creditData?: {
    availableCreditLimit?: number;
    creditLimit?: number;
    balanceDueDate?: string;
    balanceCloseDate?: string;
  };
  status?: string;
};

type PluggyTransactionResponse = {
  id: string;
  type?: string;
  status?: string;
  amount?: number;
  balance?: number;
  currencyCode?: string;
  description?: string;
  descriptionRaw?: string;
  category?: string;
  categoryId?: string;
  merchant?: { name?: string };
  date?: string;
};

@Injectable()
export class PluggyService {
  private accessToken?: string;
  private accessTokenExpiresAt?: number;
  private readonly http: AxiosInstance;

  constructor(private readonly prisma: PrismaService) {
    this.http = axios.create({
      baseURL: process.env.PLUGGY_BASE_URL ?? "https://api.pluggy.ai",
      timeout: 30000,
    });
  }

  async authenticate() {
    if (
      this.accessToken &&
      this.accessTokenExpiresAt &&
      Date.now() < this.accessTokenExpiresAt
    ) {
      return this.accessToken;
    }

    const clientId = process.env.PLUGGY_CLIENT_ID;
    const clientSecret = process.env.PLUGGY_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new Error(
        "PLUGGY_CLIENT_ID and PLUGGY_CLIENT_SECRET must be defined",
      );
    }

    const { data } = await this.http.post<PluggyAuthResponse>("/auth", {
      clientId,
      clientSecret,
    });

    this.accessToken = data.apiKey;
    this.accessTokenExpiresAt = Date.now() + 1000 * 60 * 90;

    return this.accessToken;
  }

  async createConnectToken(userId: string) {
    const token = await this.authenticate();
    const { data } = await this.http.post(
      "/connect_token",
      { clientUserId: userId },
      { headers: this.authorizationHeader(token) },
    );

    return data;
  }

  async getItem(itemId: string) {
    const token = await this.authenticate();
    const { data } = await this.http.get<PluggyItemResponse>(
      `/items/${itemId}`,
      {
        headers: this.authorizationHeader(token),
      },
    );

    return data;
  }

  async getAccounts(itemId: string) {
    const token = await this.authenticate();
    const { data } = await this.http.get<
      PluggyListResponse<PluggyAccountResponse>
    >(`/accounts?itemId=${itemId}`, {
      headers: this.authorizationHeader(token),
    });

    return data.results ?? [];
  }

  async getTransactions(accountId: string) {
    const token = await this.authenticate();
    const { data } = await this.http.get<
      PluggyListResponse<PluggyTransactionResponse>
    >(`/transactions?accountId=${accountId}`, {
      headers: this.authorizationHeader(token),
    });

    return data.results ?? [];
  }

  async saveItem(userId: string, itemId: string) {
    const item = await this.getItem(itemId);

    return this.prisma.pluggyItem.upsert({
      where: { pluggyItemId: item.id },
      update: {
        connectorId: item.connector?.id,
        institutionName: item.connector?.name,
        status: this.mapPluggyItemStatus(item.status),
        statusDetail: item.statusDetail,
        executionStatus: this.mapExecutionStatus(item.executionStatus),
        lastUpdatedAt: this.parseDate(item.updatedAt),
        errorCode: null,
        errorMessage: null,
      },
      create: {
        userId,
        pluggyItemId: item.id,
        connectorId: item.connector?.id,
        institutionName: item.connector?.name,
        status: this.mapPluggyItemStatus(item.status),
        statusDetail: item.statusDetail,
        executionStatus: this.mapExecutionStatus(item.executionStatus),
        lastUpdatedAt: this.parseDate(item.updatedAt),
      },
    });
  }

  async listItems(userId: string) {
    return this.prisma.pluggyItem.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  }

  async syncItem(userId: string, itemId: string) {
    const pluggyItem = await this.prisma.pluggyItem.findFirst({
      where: { userId, pluggyItemId: itemId },
    });

    if (!pluggyItem) {
      throw new NotFoundException("Pluggy item not found");
    }

    const syncLog = await this.prisma.syncLog.create({
      data: {
        pluggyItemId: pluggyItem.id,
        status: SyncStatus.RUNNING,
        startedAt: new Date(),
      },
    });

    let accountsSynced = 0;
    let transactionsSynced = 0;

    try {
      const accounts = await this.getAccounts(itemId);

      for (const account of accounts) {
        const savedAccount = await this.prisma.financialAccount.upsert({
          where: { pluggyAccountId: account.id },
          update: this.mapAccountUpdate(account),
          create: {
            userId,
            pluggyItemId: pluggyItem.id,
            pluggyAccountId: account.id,
            ...this.mapAccountUpdate(account),
          },
        });

        accountsSynced += 1;

        const transactions = await this.getTransactions(account.id);

        for (const transaction of transactions) {
          await this.prisma.transaction.upsert({
            where: { pluggyTransactionId: transaction.id },
            update: this.mapTransactionUpdate(transaction),
            create: {
              userId,
              accountId: savedAccount.id,
              pluggyTransactionId: transaction.id,
              ...this.mapTransactionUpdate(transaction),
            },
          });

          transactionsSynced += 1;
        }
      }

      await this.prisma.pluggyItem.update({
        where: { id: pluggyItem.id },
        data: {
          status: PluggyItemStatus.UPDATED,
          lastSuccessfulSyncAt: new Date(),
          errorCode: null,
          errorMessage: null,
        },
      });

      return this.prisma.syncLog.update({
        where: { id: syncLog.id },
        data: {
          status: SyncStatus.SUCCESS,
          finishedAt: new Date(),
          accountsSynced,
          transactionsSynced,
        },
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown sync error";

      await this.prisma.pluggyItem.update({
        where: { id: pluggyItem.id },
        data: {
          status: PluggyItemStatus.ERROR,
          errorMessage,
        },
      });

      await this.prisma.syncLog.update({
        where: { id: syncLog.id },
        data: {
          status: SyncStatus.ERROR,
          finishedAt: new Date(),
          accountsSynced,
          transactionsSynced,
          errorMessage,
        },
      });

      throw error;
    }
  }

  private authorizationHeader(token: string) {
    return { Authorization: `Bearer ${token}` };
  }

  private mapAccountUpdate(account: PluggyAccountResponse) {
    return {
      type: this.mapAccountType(account.type),
      subtype: account.subtype,
      numberMasked: account.number,
      name: account.name,
      marketingName: account.marketingName,
      ownerName: account.owner?.name,
      taxNumberMasked: account.owner?.taxNumber,
      currencyCode: account.currencyCode ?? "BRL",
      currentBalance: account.balance ?? 0,
      availableCreditLimit: account.creditData?.availableCreditLimit,
      creditLimit: account.creditData?.creditLimit,
      balanceDueDate: this.parseDate(account.creditData?.balanceDueDate),
      balanceCloseDate: this.parseDate(account.creditData?.balanceCloseDate),
      status: this.mapAccountStatus(account.status),
    };
  }

  private mapTransactionUpdate(transaction: PluggyTransactionResponse) {
    return {
      type: this.mapTransactionType(transaction.type),
      status: this.mapTransactionStatus(transaction.status),
      amount: transaction.amount ?? 0,
      balanceAfterTransaction: transaction.balance,
      currencyCode: transaction.currencyCode ?? "BRL",
      description: transaction.description ?? "Transaction",
      descriptionRaw: transaction.descriptionRaw,
      category: transaction.category,
      categoryId: transaction.categoryId,
      merchantName: transaction.merchant?.name,
      transactionDate: this.parseDate(transaction.date) ?? new Date(),
    };
  }

  private parseDate(value?: string) {
    return value ? new Date(value) : undefined;
  }

  private mapPluggyItemStatus(status?: string) {
    const normalized = status?.toUpperCase();
    return Object.values(PluggyItemStatus).includes(
      normalized as PluggyItemStatus,
    )
      ? (normalized as PluggyItemStatus)
      : PluggyItemStatus.CREATED;
  }

  private mapExecutionStatus(status?: string) {
    const normalized = status?.toUpperCase();
    return Object.values(PluggyExecutionStatus).includes(
      normalized as PluggyExecutionStatus,
    )
      ? (normalized as PluggyExecutionStatus)
      : undefined;
  }

  private mapAccountType(type?: string) {
    const normalized = type?.toUpperCase();
    return Object.values(AccountType).includes(normalized as AccountType)
      ? (normalized as AccountType)
      : AccountType.OTHER;
  }

  private mapAccountStatus(status?: string) {
    return status?.toUpperCase() === "INACTIVE"
      ? AccountStatus.INACTIVE
      : AccountStatus.ACTIVE;
  }

  private mapTransactionType(type?: string) {
    return type?.toUpperCase() === "CREDIT"
      ? TransactionType.CREDIT
      : TransactionType.DEBIT;
  }

  private mapTransactionStatus(status?: string) {
    return status?.toUpperCase() === "PENDING"
      ? TransactionStatus.PENDING
      : TransactionStatus.POSTED;
  }
}
