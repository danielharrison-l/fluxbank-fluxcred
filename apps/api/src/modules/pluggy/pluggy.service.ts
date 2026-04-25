import {
  BadGatewayException,
  BadRequestException,
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  ServiceUnavailableException,
  UnauthorizedException,
} from "@nestjs/common";
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
  apiKey?: string;
  accessToken?: string;
};

type PluggyConnectTokenResponse = {
  connectToken?: string;
  accessToken?: string;
  token?: string;
};

type PluggyListResponse<T> = {
  results?: T[];
  total?: number;
  totalPages?: number;
  page?: number;
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

type PluggyMappedError = {
  code: string;
  message: string;
  statusCode?: number;
};

@Injectable()
export class PluggyService {
  private accessToken?: string;
  private accessTokenExpiresAt?: number;
  private readonly http: AxiosInstance;

  constructor(private readonly prisma: PrismaService) {
    this.http = axios.create({
      baseURL: "https://api.pluggy.ai",
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
      throw new BadRequestException(
        "PLUGGY_CLIENT_ID and PLUGGY_CLIENT_SECRET must be defined",
      );
    }

    try {
      const { data } = await this.http.post<PluggyAuthResponse>("/auth", {
        clientId,
        clientSecret,
      });

      const accessToken = data.apiKey ?? data.accessToken;

      if (!accessToken) {
        throw new BadGatewayException(
          "Pluggy auth response did not include an access token",
        );
      }

      this.accessToken = accessToken;
      this.accessTokenExpiresAt = Date.now() + 1000 * 60 * 90;

      return this.accessToken;
    } catch (error) {
      throw this.mapPluggyError(error, "Failed to authenticate with Pluggy");
    }
  }

  async createConnectToken(userId: string) {
    const token = await this.authenticate();
    try {
      const { data } = await this.http.post<PluggyConnectTokenResponse>(
        "/connect_token",
        {
          options: {
            clientUserId: userId,
          },
        },
        { headers: this.authorizationHeader(token) },
      );

      const connectToken = data.connectToken ?? data.accessToken ?? data.token;

      if (!connectToken) {
        throw new BadGatewayException(
          "Pluggy response did not include a connect token",
        );
      }

      return { connectToken };
    } catch (error) {
      throw this.mapPluggyError(error, "Failed to create Pluggy connect token");
    }
  }

  async getItem(itemId: string) {
    const token = await this.authenticate();
    try {
      const { data } = await this.http.get<PluggyItemResponse>(
        `/items/${itemId}`,
        {
          headers: this.authorizationHeader(token),
        },
      );

      return data;
    } catch (error) {
      throw this.mapPluggyError(error, "Unable to fetch Pluggy item");
    }
  }

  async getAccounts(itemId: string) {
    const token = await this.authenticate();
    try {
      const { data } = await this.http.get<
        PluggyListResponse<PluggyAccountResponse>
      >(`/accounts?itemId=${itemId}`, {
        headers: this.authorizationHeader(token),
      });

      return data.results ?? [];
    } catch (error) {
      throw this.mapPluggyError(error, "Unable to fetch Pluggy accounts");
    }
  }

  async getTransactions(accountId: string) {
    const transactions: PluggyTransactionResponse[] = [];
    let page = 1;
    let totalPages = 1;

    do {
      const data = await this.getTransactionsPage(accountId, page);
      transactions.push(...(data.results ?? []));
      totalPages = data.totalPages ?? page;
      page += 1;
    } while (page <= totalPages);

    return transactions;
  }

  async getTransactionsPage(accountId: string, page: number) {
    const token = await this.authenticate();
    try {
      const { data } = await this.http.get<
        PluggyListResponse<PluggyTransactionResponse>
      >(`/transactions?accountId=${accountId}&page=${page}`, {
        headers: this.authorizationHeader(token),
      });

      return data;
    } catch (error) {
      const mappedError = this.toPluggyMappedError(error);

      if (mappedError.statusCode === 404) {
        return { results: [], page, totalPages: page };
      }

      throw this.toHttpException(mappedError);
    }
  }

  async saveItem(userId: string, itemId: string) {
    try {
      const item = await this.getItem(itemId);
      const existingItem = await this.prisma.pluggyItem.findUnique({
        where: { pluggyItemId: item.id },
      });

      if (existingItem && existingItem.userId !== userId) {
        throw new ConflictException("Pluggy item already belongs to a user");
      }

      return this.prisma.pluggyItem.upsert({
        where: { pluggyItemId: item.id },
        update: {
          userId,
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
    } catch (error) {
      const mappedError = this.toPluggyMappedError(error);

      await this.prisma.pluggyItem.upsert({
        where: { pluggyItemId: itemId },
        update: {
          userId,
          status: PluggyItemStatus.ERROR,
          errorCode: mappedError.code,
          errorMessage: mappedError.message,
        },
        create: {
          userId,
          pluggyItemId: itemId,
          status: PluggyItemStatus.ERROR,
          errorCode: mappedError.code,
          errorMessage: mappedError.message,
        },
      });

      throw this.toHttpException(mappedError);
    }
  }

  async listItems(userId: string) {
    return this.prisma.pluggyItem.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  }

  async syncAccounts(userId: string, itemId: string) {
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

    try {
      const accounts = await this.getAccounts(itemId);
      const syncedAccounts = [];

      for (const account of accounts) {
        await this.assertAccountOwnership(userId, account.id);
        const syncedAccount = await this.prisma.financialAccount.upsert({
          where: { pluggyAccountId: account.id },
          update: this.mapAccountUpdate(account),
          create: {
            userId,
            pluggyItemId: pluggyItem.id,
            pluggyAccountId: account.id,
            ...this.mapAccountUpdate(account),
          },
        });

        syncedAccounts.push(syncedAccount);
      }

      await this.prisma.syncLog.update({
        where: { id: syncLog.id },
        data: {
          status: SyncStatus.SUCCESS,
          finishedAt: new Date(),
          accountsSynced: syncedAccounts.length,
        },
      });

      return syncedAccounts;
    } catch (error) {
      const mappedError = this.toPluggyMappedError(error);

      await this.markPluggyItemSyncError(pluggyItem.id, mappedError);
      await this.markSyncLogError(syncLog.id, mappedError);

      throw this.toHttpException(mappedError);
    }
  }

  async syncTransactions(userId: string, itemId: string) {
    const pluggyItem = await this.prisma.pluggyItem.findFirst({
      where: { userId, pluggyItemId: itemId },
    });

    if (!pluggyItem) {
      throw new NotFoundException("Pluggy item not found");
    }

    const accounts = await this.prisma.financialAccount.findMany({
      where: {
        userId,
        pluggyItemId: pluggyItem.id,
      },
    });

    const syncLog = await this.prisma.syncLog.create({
      data: {
        pluggyItemId: pluggyItem.id,
        status: SyncStatus.RUNNING,
        startedAt: new Date(),
      },
    });

    const accountErrors: Array<{ accountId: string; message: string }> = [];
    let transactionsSynced = 0;

    for (const account of accounts) {
      try {
        let page = 1;
        let totalPages = 1;

        do {
          const response = await this.getTransactionsPage(
            account.pluggyAccountId,
            page,
          );
          const transactions = response.results ?? [];

          for (const transaction of transactions) {
            await this.assertTransactionOwnership(userId, transaction.id);
            await this.prisma.transaction.upsert({
              where: { pluggyTransactionId: transaction.id },
              update: this.mapTransactionUpdate(transaction),
              create: {
                userId,
                accountId: account.id,
                pluggyTransactionId: transaction.id,
                ...this.mapTransactionUpdate(transaction),
              },
            });

            transactionsSynced += 1;
          }

          totalPages = response.totalPages ?? page;
          page += 1;
        } while (page <= totalPages);
      } catch (error) {
        const mappedError = this.toPluggyMappedError(error);
        accountErrors.push({
          accountId: account.id,
          message: mappedError.message,
        });
      }
    }

    await this.prisma.syncLog.update({
      where: { id: syncLog.id },
      data: {
        status: accountErrors.length
          ? SyncStatus.PARTIAL_SUCCESS
          : SyncStatus.SUCCESS,
        finishedAt: new Date(),
        accountsSynced: accounts.length,
        transactionsSynced,
        errorMessage: accountErrors.length
          ? "Some accounts failed to sync transactions"
          : null,
        metadata: accountErrors.length ? { accountErrors } : undefined,
      },
    });

    return {
      accountsSynced: accounts.length,
      transactionsSynced,
    };
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
        await this.assertAccountOwnership(userId, account.id);
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
          await this.assertTransactionOwnership(userId, transaction.id);
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
      const mappedError = this.toPluggyMappedError(error);

      await this.markPluggyItemSyncError(pluggyItem.id, mappedError);
      await this.markSyncLogError(syncLog.id, mappedError, {
        accountsSynced,
        transactionsSynced,
      });

      throw this.toHttpException(mappedError);
    }
  }

  private authorizationHeader(token: string) {
    return { "X-API-KEY": token };
  }

  private async assertAccountOwnership(
    userId: string,
    pluggyAccountId: string,
  ) {
    const account = await this.prisma.financialAccount.findUnique({
      where: { pluggyAccountId },
      select: { userId: true },
    });

    if (account && account.userId !== userId) {
      throw new ConflictException("Pluggy account already belongs to a user");
    }
  }

  private async assertTransactionOwnership(
    userId: string,
    pluggyTransactionId: string,
  ) {
    const transaction = await this.prisma.transaction.findUnique({
      where: { pluggyTransactionId },
      select: { userId: true },
    });

    if (transaction && transaction.userId !== userId) {
      throw new ConflictException(
        "Pluggy transaction already belongs to a user",
      );
    }
  }

  private mapPluggyError(error: unknown, fallbackMessage: string) {
    return this.toHttpException(
      this.toPluggyMappedError(error, fallbackMessage),
    );
  }

  private toPluggyMappedError(
    error: unknown,
    fallbackMessage = "Pluggy integration error",
  ): PluggyMappedError {
    if (axios.isAxiosError(error)) {
      const statusCode = error.response?.status;
      const rawCode =
        typeof error.response?.data === "object" &&
        error.response?.data &&
        "code" in error.response.data
          ? String(error.response.data.code)
          : undefined;
      const rawMessage =
        typeof error.response?.data === "object" &&
        error.response?.data &&
        "message" in error.response.data
          ? String(error.response.data.message)
          : undefined;

      if (statusCode === 401 || statusCode === 403) {
        this.clearAccessToken();
      }

      return {
        code: rawCode ?? this.mapPluggyErrorCode(statusCode),
        message:
          rawMessage ?? this.mapPluggyErrorMessage(statusCode, fallbackMessage),
        statusCode,
      };
    }

    if (
      error instanceof UnauthorizedException ||
      error instanceof BadRequestException ||
      error instanceof ConflictException ||
      error instanceof ServiceUnavailableException ||
      error instanceof BadGatewayException ||
      error instanceof InternalServerErrorException
    ) {
      const httpError = error as HttpException;
      const response = httpError.getResponse();
      return {
        code: httpError.name,
        message:
          typeof response === "object" && response && "message" in response
            ? String(response.message)
            : httpError.message,
        statusCode: httpError.getStatus(),
      };
    }

    return {
      code: "PLUGGY_UNKNOWN_ERROR",
      message: error instanceof Error ? error.message : fallbackMessage,
    };
  }

  private toHttpException(error: PluggyMappedError) {
    if (error.statusCode === 401 || error.statusCode === 403) {
      return new UnauthorizedException(error.message);
    }

    if (error.statusCode === 404) {
      return new NotFoundException(error.message);
    }

    if (error.statusCode === 429) {
      return new HttpException(error.message, HttpStatus.TOO_MANY_REQUESTS);
    }

    if (!error.statusCode || error.statusCode >= 500) {
      return new ServiceUnavailableException(error.message);
    }

    return new BadGatewayException({
      code: error.code,
      message: error.message,
      statusCode: error.statusCode,
    });
  }

  private mapPluggyErrorCode(statusCode?: number) {
    if (statusCode === 401 || statusCode === 403) {
      return "PLUGGY_AUTH_ERROR";
    }

    if (statusCode === 404) {
      return "PLUGGY_NOT_FOUND";
    }

    if (statusCode === 429) {
      return "PLUGGY_RATE_LIMIT";
    }

    if (!statusCode || statusCode >= 500) {
      return "PLUGGY_UNAVAILABLE";
    }

    return "PLUGGY_REQUEST_ERROR";
  }

  private mapPluggyErrorMessage(
    statusCode: number | undefined,
    fallback: string,
  ) {
    if (statusCode === 401 || statusCode === 403) {
      return "Não foi possível autenticar na Pluggy. Verifique as credenciais configuradas.";
    }

    if (statusCode === 404) {
      return "O item ou recurso informado não foi encontrado na Pluggy.";
    }

    if (statusCode === 429) {
      return "A Pluggy recebeu muitas requisições. Tente novamente em alguns instantes.";
    }

    if (!statusCode || statusCode >= 500) {
      return "A Pluggy está indisponível no momento. Tente novamente mais tarde.";
    }

    return fallback;
  }

  private clearAccessToken() {
    this.accessToken = undefined;
    this.accessTokenExpiresAt = undefined;
  }

  private async markPluggyItemSyncError(
    pluggyItemId: string,
    error: PluggyMappedError,
  ) {
    await this.prisma.pluggyItem.update({
      where: { id: pluggyItemId },
      data: {
        status: PluggyItemStatus.ERROR,
        errorCode: error.code,
        errorMessage: error.message,
      },
    });
  }

  private async markSyncLogError(
    syncLogId: string,
    error: PluggyMappedError,
    counters?: { accountsSynced?: number; transactionsSynced?: number },
  ) {
    await this.prisma.syncLog.update({
      where: { id: syncLogId },
      data: {
        status: SyncStatus.ERROR,
        finishedAt: new Date(),
        accountsSynced: counters?.accountsSynced,
        transactionsSynced: counters?.transactionsSynced,
        errorMessage: error.message,
        metadata: {
          errorCode: error.code,
          statusCode: error.statusCode,
        },
      },
    });
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
