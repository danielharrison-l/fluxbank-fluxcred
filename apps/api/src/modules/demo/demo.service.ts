import {
  ForbiddenException,
  Injectable,
  NotFoundException,
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
import { PrismaService } from "@/infra/database/prisma.service";
import { CreditScoreService } from "@/modules/credit-score/credit-score.service";
import { FinancialMetricsService } from "@/modules/financial-metrics/financial-metrics.service";
import type { DemoProfile } from "./dto/connect-demo-profile.dto";

type TransactionDraft = {
  accountId: string;
  kind: string;
  type: TransactionType;
  amount: number;
  balance: number;
  description: string;
  category: string;
  merchantName?: string;
  transactionDate: Date;
};

type ProfileConfig = {
  institutionName: string;
  checkingMarketingName: string;
  reserveMarketingName: string;
  creditMarketingName: string;
  incomeDescription: string;
  monthlyIncome: number[];
  incomeDays: number;
  expenseRatio: number;
  initialBalance: number;
  reserveBalance: number;
  creditBalance: number;
  creditLimit: number;
  savingRate: number;
  cardExpenseRatio: number;
  expenseProfile: "healthy" | "strained" | "risky";
};

const PROFILE_CONFIG: Record<DemoProfile, ProfileConfig> = {
  excellent: {
    institutionName: "Itaú",
    checkingMarketingName: "Itau Personnalite",
    reserveMarketingName: "Itau Reserva",
    creditMarketingName: "Itau Personnalite Visa",
    incomeDescription: "Recebimento recorrente",
    monthlyIncome: [9000, 8800, 9200, 8900],
    incomeDays: 25,
    expenseRatio: 0.55,
    initialBalance: 4200,
    reserveBalance: 8500,
    creditBalance: -900,
    creditLimit: 7000,
    savingRate: 0.12,
    cardExpenseRatio: 0.18,
    expenseProfile: "healthy",
  },
  approved: {
    institutionName: "Bradesco",
    checkingMarketingName: "Bradesco Exclusive",
    reserveMarketingName: "Bradesco Poupanca",
    creditMarketingName: "Bradesco Elo Mais",
    incomeDescription: "Recebimento mensal",
    monthlyIncome: [3900, 4100, 4000, 3950],
    incomeDays: 12,
    expenseRatio: 0.72,
    initialBalance: 1250,
    reserveBalance: 1800,
    creditBalance: -780,
    creditLimit: 2800,
    savingRate: 0.05,
    cardExpenseRatio: 0.22,
    expenseProfile: "healthy",
  },
  borderline: {
    institutionName: "Nubank",
    checkingMarketingName: "NuConta",
    reserveMarketingName: "Caixinha Reserva",
    creditMarketingName: "Nubank Ultravioleta",
    incomeDescription: "Recebimento irregular",
    monthlyIncome: [2200, 1800, 2100, 1700],
    incomeDays: 6,
    expenseRatio: 0.95,
    initialBalance: 320,
    reserveBalance: 250,
    creditBalance: -1200,
    creditLimit: 1800,
    savingRate: 0.01,
    cardExpenseRatio: 0.3,
    expenseProfile: "strained",
  },
  rejected: {
    institutionName: "Santander",
    checkingMarketingName: "Santander Select",
    reserveMarketingName: "Santander Reserva",
    creditMarketingName: "Santander Free",
    incomeDescription: "Recebimento variavel",
    monthlyIncome: [1800, 1200, 2200, 900],
    incomeDays: 6,
    expenseRatio: 1.08,
    initialBalance: 150,
    reserveBalance: 100,
    creditBalance: -1900,
    creditLimit: 3000,
    savingRate: 0,
    cardExpenseRatio: 0.3,
    expenseProfile: "risky",
  },
};

@Injectable()
export class DemoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly financialMetricsService: FinancialMetricsService,
    private readonly creditScoreService: CreditScoreService,
  ) {}

  async connect(userId: string, profile: DemoProfile) {
    this.assertEnabled();

    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    await this.reset(userId);

    const config = PROFILE_CONFIG[profile];
    const now = new Date();
    const periodStart = this.startOfMonth(this.addMonths(now, -3));
    const periodEnd = new Date(now);
    const pluggyItem = await this.prisma.pluggyItem.create({
      data: {
        userId,
        pluggyItemId: `demo-${profile}-${userId}`,
        connectorId: "demo-bank",
        institutionName: config.institutionName,
        status: PluggyItemStatus.UPDATED,
        statusDetail: "Dados demonstrativos gerados localmente",
        executionStatus: PluggyExecutionStatus.SUCCESS,
        lastUpdatedAt: now,
        lastSuccessfulSyncAt: now,
      },
    });
    const checking = await this.prisma.financialAccount.create({
      data: {
        userId,
        pluggyItemId: pluggyItem.id,
        pluggyAccountId: `demo-${profile}-checking-${userId}`,
        type: AccountType.BANK,
        subtype: "CHECKING_ACCOUNT",
        numberMasked: "0001",
        name: "Conta corrente",
        marketingName: config.checkingMarketingName,
        ownerName: user.name,
        taxNumberMasked: user.document?.slice(-4)
          ? `***.${user.document.slice(-4)}`
          : null,
        currencyCode: "BRL",
        currentBalance: config.initialBalance,
        status: AccountStatus.ACTIVE,
      },
    });
    const reserve = await this.prisma.financialAccount.create({
      data: {
        userId,
        pluggyItemId: pluggyItem.id,
        pluggyAccountId: `demo-${profile}-reserve-${userId}`,
        type: AccountType.BANK,
        subtype: "SAVINGS_ACCOUNT",
        numberMasked: "0002",
        name: "Reserva",
        marketingName: config.reserveMarketingName,
        ownerName: user.name,
        currencyCode: "BRL",
        currentBalance: config.reserveBalance,
        status: AccountStatus.ACTIVE,
      },
    });
    const credit = await this.prisma.financialAccount.create({
      data: {
        userId,
        pluggyItemId: pluggyItem.id,
        pluggyAccountId: `demo-${profile}-credit-${userId}`,
        type: AccountType.CREDIT,
        subtype: "CREDIT_CARD",
        numberMasked: "9988",
        name: "Cartão de crédito",
        marketingName: config.creditMarketingName,
        ownerName: user.name,
        currencyCode: "BRL",
        currentBalance: config.creditBalance,
        availableCreditLimit: Math.max(
          0,
          config.creditLimit + config.creditBalance,
        ),
        creditLimit: config.creditLimit,
        status: AccountStatus.ACTIVE,
      },
    });
    const transactions = this.buildTransactions({
      profile,
      config,
      checkingAccountId: checking.id,
      reserveAccountId: reserve.id,
      creditAccountId: credit.id,
      now,
    });

    await this.prisma.transaction.createMany({
      data: transactions.map((transaction, index) => ({
        userId,
        accountId: transaction.accountId,
        pluggyTransactionId: `demo-${profile}-${userId}-${index}-${transaction.kind}`,
        type: transaction.type,
        status: TransactionStatus.POSTED,
        amount: transaction.amount,
        balanceAfterTransaction: transaction.balance,
        currencyCode: "BRL",
        description: transaction.description,
        descriptionRaw: transaction.description,
        category: transaction.category,
        merchantName: transaction.merchantName,
        transactionDate: transaction.transactionDate,
      })),
    });

    await this.prisma.syncLog.create({
      data: {
        pluggyItemId: pluggyItem.id,
        status: SyncStatus.SUCCESS,
        startedAt: now,
        finishedAt: now,
        accountsSynced: 3,
        transactionsSynced: transactions.length,
        metadata: { source: "demo", profile },
      },
    });

    const metric = await this.financialMetricsService.calculate(userId, {
      periodStart: periodStart.toISOString(),
      periodEnd: periodEnd.toISOString(),
    });
    const score = await this.creditScoreService.calculate(userId);

    return {
      profile,
      item: pluggyItem,
      metric,
      score,
    };
  }

  async reset(userId: string) {
    this.assertEnabled();

    const pluggyItems = await this.prisma.pluggyItem.findMany({
      where: { userId },
      select: { id: true },
    });
    const pluggyItemIds = pluggyItems.map((item) => item.id);

    await this.prisma.$transaction([
      this.prisma.creditRequest.deleteMany({ where: { userId } }),
      this.prisma.creditScore.deleteMany({ where: { userId } }),
      this.prisma.financialMetric.deleteMany({ where: { userId } }),
      this.prisma.transaction.deleteMany({ where: { userId } }),
      this.prisma.financialAccount.deleteMany({ where: { userId } }),
      this.prisma.consent.deleteMany({ where: { userId } }),
      this.prisma.syncLog.deleteMany({
        where: { pluggyItemId: { in: pluggyItemIds } },
      }),
      this.prisma.pluggyItem.deleteMany({ where: { userId } }),
    ]);

    return { ok: true };
  }

  private assertEnabled() {
    if (process.env.ENABLE_DEMO_CONNECTIONS === "false") {
      throw new ForbiddenException("Demo connections are disabled");
    }
  }

  private buildTransactions({
    profile,
    config,
    checkingAccountId,
    reserveAccountId,
    creditAccountId,
    now,
  }: {
    profile: DemoProfile;
    config: ProfileConfig;
    checkingAccountId: string;
    reserveAccountId: string;
    creditAccountId: string;
    now: Date;
  }) {
    const transactions: TransactionDraft[] = [];
    let checkingBalance = config.initialBalance;
    let reserveBalance = config.reserveBalance;
    let creditBalance = config.creditBalance;

    config.monthlyIncome.forEach((income, monthIndex) => {
      const monthDate = this.addMonths(now, monthIndex - 3);
      const incomeAmount = income / config.incomeDays;

      for (let dayIndex = 0; dayIndex < config.incomeDays; dayIndex += 1) {
        const date = this.dateInMonth(monthDate, 2 + dayIndex * 2);
        const variation = 1;
        const amount = this.money(incomeAmount * variation);
        checkingBalance = this.money(checkingBalance + amount);
        transactions.push({
          accountId: checkingAccountId,
          kind: `income-${monthIndex}-${dayIndex}`,
          type: TransactionType.CREDIT,
          amount,
          balance: checkingBalance,
          description: config.incomeDescription,
          category: "Renda",
          merchantName: "Cliente demo",
          transactionDate: date,
        });
      }

      const expenseTotal = income * config.expenseRatio;
      const expenses = this.splitExpenses(expenseTotal, profile);

      expenses.forEach((expense, expenseIndex) => {
        const amount = this.money(expense.amount);
        checkingBalance = this.money(checkingBalance - amount);
        transactions.push({
          accountId: checkingAccountId,
          kind: `expense-${monthIndex}-${expenseIndex}`,
          type: TransactionType.DEBIT,
          amount,
          balance: checkingBalance,
          description: expense.description,
          category: expense.category,
          merchantName: expense.description,
          transactionDate: this.dateInMonth(monthDate, 5 + expenseIndex * 3),
        });
      });

      if (config.savingRate > 0) {
        const saving = this.money(income * config.savingRate);
        checkingBalance = this.money(checkingBalance - saving);
        reserveBalance = this.money(reserveBalance + saving);
        transactions.push({
          accountId: reserveAccountId,
          kind: `saving-${monthIndex}`,
          type: TransactionType.CREDIT,
          amount: saving,
          balance: reserveBalance,
          description: "Aporte em reserva",
          category: "Investimentos",
          transactionDate: this.dateInMonth(monthDate, 24),
        });
      }

      const cardExpense = this.money(income * config.cardExpenseRatio);
      creditBalance = this.money(creditBalance - cardExpense);
      transactions.push({
        accountId: creditAccountId,
        kind: `card-${monthIndex}`,
        type: TransactionType.DEBIT,
        amount: cardExpense,
        balance: creditBalance,
        description: "Fatura do cartão",
        category: "Cartão",
        transactionDate: this.dateInMonth(monthDate, 18),
      });
    });

    return transactions.sort(
      (left, right) =>
        left.transactionDate.getTime() - right.transactionDate.getTime(),
    );
  }

  private splitExpenses(total: number, profile: DemoProfile) {
    const expenseProfile = PROFILE_CONFIG[profile].expenseProfile;
    const base =
      expenseProfile === "risky"
        ? [
            ["Aluguel atrasado", "Moradia", 0.34],
            ["Mercado", "Alimentacao", 0.2],
            ["Pagamento de empréstimo", "Dívidas", 0.2],
            ["Transporte", "Transporte", 0.1],
            ["Serviços essenciais", "Contas", 0.09],
            ["Compras parceladas", "Compras", 0.07],
          ]
        : expenseProfile === "strained"
          ? [
              ["Aluguel", "Moradia", 0.34],
              ["Mercado", "Alimentacao", 0.24],
              ["Parcela de emprestimo", "Dividas", 0.14],
              ["Transporte", "Transporte", 0.1],
              ["Servicos essenciais", "Contas", 0.11],
              ["Compras", "Compras", 0.07],
            ]
          : [
              ["Aluguel", "Moradia", 0.32],
              ["Mercado", "Alimentacao", 0.22],
              ["Transporte", "Transporte", 0.12],
              ["Serviços essenciais", "Contas", 0.12],
              ["Educação", "Educação", 0.1],
              ["Lazer", "Lazer", 0.07],
              ["Assinaturas", "Serviços", 0.05],
            ];

    return base.map(([description, category, weight]) => ({
      description: String(description),
      category: String(category),
      amount: total * Number(weight),
    }));
  }

  private startOfMonth(date: Date) {
    return new Date(date.getFullYear(), date.getMonth(), 1);
  }

  private addMonths(date: Date, amount: number) {
    return new Date(
      date.getFullYear(),
      date.getMonth() + amount,
      date.getDate(),
    );
  }

  private dateInMonth(date: Date, day: number) {
    const lastDay = new Date(
      date.getFullYear(),
      date.getMonth() + 1,
      0,
    ).getDate();
    return new Date(
      date.getFullYear(),
      date.getMonth(),
      Math.min(day, lastDay),
    );
  }

  private money(value: number) {
    return Math.round(value * 100) / 100;
  }
}
