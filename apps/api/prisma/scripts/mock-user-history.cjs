const path = require("node:path");
require("dotenv").config({
  path: path.resolve(__dirname, "../../.env"),
});

const { PrismaPg } = require("@prisma/adapter-pg");
const {
  PrismaClient,
  AccountStatus,
  AccountType,
  CreditDecision,
  CreditRequestStatus,
  PluggyExecutionStatus,
  PluggyItemStatus,
  SyncStatus,
  TransactionStatus,
  TransactionType,
} = require("@prisma/client");

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL must be defined in environment variables.");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

function parseArgs(argv) {
  const options = {
    months: 6,
    reset: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--help" || arg === "-h") {
      options.help = true;
      continue;
    }

    if (arg === "--reset") {
      options.reset = true;
      continue;
    }

    if (arg === "--user-id") {
      options.userId = argv[index + 1];
      index += 1;
      continue;
    }

    if (arg === "--email") {
      options.email = argv[index + 1];
      index += 1;
      continue;
    }

    if (arg === "--months") {
      options.months = Number(argv[index + 1]);
      index += 1;
      continue;
    }
  }

  return options;
}

function printHelp() {
  console.log(
    [
      "Usage:",
      "  node prisma/scripts/mock-user-history.cjs --user-id <uuid> [--months 6] [--reset]",
      "  node prisma/scripts/mock-user-history.cjs --email <email> [--months 6] [--reset]",
      "",
      "Notes:",
      "  --reset removes existing financial data for the selected user before seeding.",
      "  Without --reset, the script aborts if the user already has accounts, transactions, metrics, scores, or requests.",
    ].join("\n"),
  );
}

function monthWindow(monthOffset) {
  const now = new Date();
  const start = new Date(
    now.getFullYear(),
    now.getMonth() - monthOffset,
    1,
    12,
    0,
    0,
    0,
  );
  const end =
    monthOffset === 0
      ? now
      : new Date(
          now.getFullYear(),
          now.getMonth() - monthOffset + 1,
          0,
          18,
          0,
          0,
          0,
        );

  return { start, end };
}

function setTime(date, hours) {
  const value = new Date(date);
  value.setHours(hours, 0, 0, 0);
  return value;
}

function decimal(value) {
  return Number(value.toFixed(2));
}

function pushTransaction(list, transaction) {
  list.push({
    ...transaction,
    amount: decimal(transaction.amount),
    balanceAfterTransaction:
      transaction.balanceAfterTransaction == null
        ? null
        : decimal(transaction.balanceAfterTransaction),
  });
}

function createMonthlyTransactions(accounts, months) {
  const checking = accounts.checking;
  const reserve = accounts.reserve;
  const credit = accounts.credit;
  const transactions = [];
  let checkingBalance = 4800;
  let reserveBalance = 9300;
  let creditBalance = 0;

  for (let offset = months - 1; offset >= 0; offset -= 1) {
    const { start } = monthWindow(offset);
    const monthIndex = months - offset;
    const salary = 8400 + monthIndex * 180;
    const sideIncome = monthIndex % 2 === 0 ? 1350 + monthIndex * 55 : 0;
    const rent = 2100 + monthIndex * 20;
    const groceries = 980 + monthIndex * 35;
    const transport = 360 + monthIndex * 12;
    const utilities = 430 + monthIndex * 8;
    const leisure = 520 + monthIndex * 22;
    const software = 189 + monthIndex * 5;
    const savingsTransfer = 1200 + monthIndex * 40;
    const invoicePayment = 1450 + monthIndex * 75;
    const reserveYield = 95 + monthIndex * 11;
    const cardShopping = 620 + monthIndex * 30;
    const cardFuel = 240 + monthIndex * 10;
    const cardDining = 310 + monthIndex * 12;

    checkingBalance += salary;
    pushTransaction(transactions, {
      accountId: checking.id,
      pluggyTransactionId: `mock-${checking.id}-salary-${offset}`,
      type: TransactionType.CREDIT,
      status: TransactionStatus.POSTED,
      amount: salary,
      balanceAfterTransaction: checkingBalance,
      currencyCode: "BRL",
      description: "Recebimento principal",
      descriptionRaw: "Credito folha",
      category: "Renda",
      categoryId: "income",
      merchantName: "Empresa FluxCred Demo",
      transactionDate: setTime(new Date(start.getFullYear(), start.getMonth(), 5), 10),
    });

    if (sideIncome > 0) {
      checkingBalance += sideIncome;
      pushTransaction(transactions, {
        accountId: checking.id,
        pluggyTransactionId: `mock-${checking.id}-side-income-${offset}`,
        type: TransactionType.CREDIT,
        status: TransactionStatus.POSTED,
        amount: sideIncome,
        balanceAfterTransaction: checkingBalance,
        currencyCode: "BRL",
        description: "Projeto freelancer",
        descriptionRaw: "Transferencia cliente",
        category: "Renda extra",
        categoryId: "side-income",
        merchantName: "Cliente recorrente",
        transactionDate: setTime(new Date(start.getFullYear(), start.getMonth(), 19), 15),
      });
    }

    checkingBalance -= rent;
    pushTransaction(transactions, {
      accountId: checking.id,
      pluggyTransactionId: `mock-${checking.id}-rent-${offset}`,
      type: TransactionType.DEBIT,
      status: TransactionStatus.POSTED,
      amount: -rent,
      balanceAfterTransaction: checkingBalance,
      currencyCode: "BRL",
      description: "Aluguel",
      descriptionRaw: "Pagamento aluguel",
      category: "Moradia",
      categoryId: "housing",
      merchantName: "Imobiliaria Centro",
      transactionDate: setTime(new Date(start.getFullYear(), start.getMonth(), 6), 11),
    });

    checkingBalance -= groceries;
    pushTransaction(transactions, {
      accountId: checking.id,
      pluggyTransactionId: `mock-${checking.id}-groceries-${offset}`,
      type: TransactionType.DEBIT,
      status: TransactionStatus.POSTED,
      amount: -groceries,
      balanceAfterTransaction: checkingBalance,
      currencyCode: "BRL",
      description: "Supermercado",
      descriptionRaw: "Compra mercado",
      category: "Alimentacao",
      categoryId: "groceries",
      merchantName: "Mercado Bairro",
      transactionDate: setTime(new Date(start.getFullYear(), start.getMonth(), 8), 18),
    });

    checkingBalance -= transport;
    pushTransaction(transactions, {
      accountId: checking.id,
      pluggyTransactionId: `mock-${checking.id}-transport-${offset}`,
      type: TransactionType.DEBIT,
      status: TransactionStatus.POSTED,
      amount: -transport,
      balanceAfterTransaction: checkingBalance,
      currencyCode: "BRL",
      description: "Mobilidade",
      descriptionRaw: "Transporte app",
      category: "Transporte",
      categoryId: "transport",
      merchantName: "Uber e afins",
      transactionDate: setTime(new Date(start.getFullYear(), start.getMonth(), 12), 13),
    });

    checkingBalance -= utilities;
    pushTransaction(transactions, {
      accountId: checking.id,
      pluggyTransactionId: `mock-${checking.id}-utilities-${offset}`,
      type: TransactionType.DEBIT,
      status: TransactionStatus.POSTED,
      amount: -utilities,
      balanceAfterTransaction: checkingBalance,
      currencyCode: "BRL",
      description: "Contas do mes",
      descriptionRaw: "Agua luz internet",
      category: "Servicos",
      categoryId: "utilities",
      merchantName: "Concessionarias",
      transactionDate: setTime(new Date(start.getFullYear(), start.getMonth(), 14), 9),
    });

    checkingBalance -= leisure;
    pushTransaction(transactions, {
      accountId: checking.id,
      pluggyTransactionId: `mock-${checking.id}-leisure-${offset}`,
      type: TransactionType.DEBIT,
      status: TransactionStatus.POSTED,
      amount: -leisure,
      balanceAfterTransaction: checkingBalance,
      currencyCode: "BRL",
      description: "Lazer e assinaturas",
      descriptionRaw: "Cinema streaming",
      category: "Lazer",
      categoryId: "leisure",
      merchantName: "Servicos digitais",
      transactionDate: setTime(new Date(start.getFullYear(), start.getMonth(), 21), 20),
    });

    checkingBalance -= software;
    pushTransaction(transactions, {
      accountId: checking.id,
      pluggyTransactionId: `mock-${checking.id}-software-${offset}`,
      type: TransactionType.DEBIT,
      status: TransactionStatus.POSTED,
      amount: -software,
      balanceAfterTransaction: checkingBalance,
      currencyCode: "BRL",
      description: "Ferramentas de trabalho",
      descriptionRaw: "Assinaturas saas",
      category: "Operacao",
      categoryId: "software",
      merchantName: "Ferramentas SaaS",
      transactionDate: setTime(new Date(start.getFullYear(), start.getMonth(), 23), 10),
    });

    checkingBalance -= savingsTransfer;
    reserveBalance += savingsTransfer;
    pushTransaction(transactions, {
      accountId: checking.id,
      pluggyTransactionId: `mock-${checking.id}-reserve-transfer-${offset}`,
      type: TransactionType.DEBIT,
      status: TransactionStatus.POSTED,
      amount: -savingsTransfer,
      balanceAfterTransaction: checkingBalance,
      currencyCode: "BRL",
      description: "Transferencia para reserva",
      descriptionRaw: "TED interna",
      category: "Investimento",
      categoryId: "reserve-transfer",
      merchantName: "Reserva pessoal",
      transactionDate: setTime(new Date(start.getFullYear(), start.getMonth(), 24), 14),
    });

    pushTransaction(transactions, {
      accountId: reserve.id,
      pluggyTransactionId: `mock-${reserve.id}-reserve-transfer-${offset}`,
      type: TransactionType.CREDIT,
      status: TransactionStatus.POSTED,
      amount: savingsTransfer,
      balanceAfterTransaction: reserveBalance,
      currencyCode: "BRL",
      description: "Aporte em reserva",
      descriptionRaw: "Credito TED interna",
      category: "Reserva",
      categoryId: "reserve",
      merchantName: "Conta reserva",
      transactionDate: setTime(new Date(start.getFullYear(), start.getMonth(), 24), 14),
    });

    reserveBalance += reserveYield;
    pushTransaction(transactions, {
      accountId: reserve.id,
      pluggyTransactionId: `mock-${reserve.id}-yield-${offset}`,
      type: TransactionType.CREDIT,
      status: TransactionStatus.POSTED,
      amount: reserveYield,
      balanceAfterTransaction: reserveBalance,
      currencyCode: "BRL",
      description: "Rendimento mensal",
      descriptionRaw: "Rendimento automatico",
      category: "Rendimento",
      categoryId: "yield",
      merchantName: "Reserva remunerada",
      transactionDate: setTime(new Date(start.getFullYear(), start.getMonth(), 28), 9),
    });

    creditBalance += cardShopping;
    pushTransaction(transactions, {
      accountId: credit.id,
      pluggyTransactionId: `mock-${credit.id}-shopping-${offset}`,
      type: TransactionType.DEBIT,
      status: TransactionStatus.POSTED,
      amount: -cardShopping,
      balanceAfterTransaction: creditBalance,
      currencyCode: "BRL",
      description: "Compras no cartao",
      descriptionRaw: "Compra cartao",
      category: "Compras",
      categoryId: "shopping",
      merchantName: "Varejo online",
      transactionDate: setTime(new Date(start.getFullYear(), start.getMonth(), 11), 16),
    });

    creditBalance += cardFuel;
    pushTransaction(transactions, {
      accountId: credit.id,
      pluggyTransactionId: `mock-${credit.id}-fuel-${offset}`,
      type: TransactionType.DEBIT,
      status: TransactionStatus.POSTED,
      amount: -cardFuel,
      balanceAfterTransaction: creditBalance,
      currencyCode: "BRL",
      description: "Combustivel",
      descriptionRaw: "Posto combustivel",
      category: "Transporte",
      categoryId: "fuel",
      merchantName: "Posto BR",
      transactionDate: setTime(new Date(start.getFullYear(), start.getMonth(), 16), 19),
    });

    creditBalance += cardDining;
    pushTransaction(transactions, {
      accountId: credit.id,
      pluggyTransactionId: `mock-${credit.id}-dining-${offset}`,
      type: TransactionType.DEBIT,
      status: TransactionStatus.POSTED,
      amount: -cardDining,
      balanceAfterTransaction: creditBalance,
      currencyCode: "BRL",
      description: "Restaurantes",
      descriptionRaw: "Consumo cartao",
      category: "Alimentacao",
      categoryId: "dining",
      merchantName: "Restaurantes",
      transactionDate: setTime(new Date(start.getFullYear(), start.getMonth(), 18), 21),
    });

    checkingBalance -= invoicePayment;
    pushTransaction(transactions, {
      accountId: checking.id,
      pluggyTransactionId: `mock-${checking.id}-invoice-payment-${offset}`,
      type: TransactionType.DEBIT,
      status: TransactionStatus.POSTED,
      amount: -invoicePayment,
      balanceAfterTransaction: checkingBalance,
      currencyCode: "BRL",
      description: "Pagamento de fatura",
      descriptionRaw: "Debito automatico fatura",
      category: "Cartao",
      categoryId: "invoice",
      merchantName: "Cartao principal",
      transactionDate: setTime(new Date(start.getFullYear(), start.getMonth(), 26), 8),
    });

    creditBalance = Math.max(0, creditBalance - invoicePayment);
    pushTransaction(transactions, {
      accountId: credit.id,
      pluggyTransactionId: `mock-${credit.id}-invoice-credit-${offset}`,
      type: TransactionType.CREDIT,
      status: TransactionStatus.POSTED,
      amount: invoicePayment,
      balanceAfterTransaction: creditBalance,
      currencyCode: "BRL",
      description: "Pagamento recebido",
      descriptionRaw: "Liquidacao fatura",
      category: "Pagamento",
      categoryId: "invoice-payment",
      merchantName: "Conta principal",
      transactionDate: setTime(new Date(start.getFullYear(), start.getMonth(), 26), 8),
    });
  }

  return {
    transactions,
    balances: {
      checking: decimal(checkingBalance),
      reserve: decimal(reserveBalance),
      credit: decimal(creditBalance),
    },
  };
}

function calculateFinancialMetric(transactions, periodStart, periodEnd) {
  const incomeTransactions = transactions.filter(
    (transaction) => transaction.type === TransactionType.CREDIT,
  );
  const expenseTransactions = transactions.filter(
    (transaction) => transaction.type === TransactionType.DEBIT,
  );
  const totalIncome = incomeTransactions.reduce(
    (sum, transaction) => sum + Math.abs(transaction.amount),
    0,
  );
  const totalExpense = expenseTransactions.reduce(
    (sum, transaction) => sum + Math.abs(transaction.amount),
    0,
  );
  const periodDays = Math.max(
    1,
    Math.ceil((periodEnd.getTime() - periodStart.getTime()) / 86400000),
  );
  const periodMonths = Math.max(1, periodDays / 30);
  const incomeByDay = new Map();

  for (const transaction of incomeTransactions) {
    const day = transaction.transactionDate.toISOString().slice(0, 10);
    incomeByDay.set(day, (incomeByDay.get(day) ?? 0) + Math.abs(transaction.amount));
  }

  const dailyIncomeTotals = Array.from(incomeByDay.values());
  const incomeDays = dailyIncomeTotals.length;
  const balances = transactions
    .map((transaction) => transaction.balanceAfterTransaction)
    .filter((value) => typeof value === "number");
  const averageBalance = balances.length
    ? balances.reduce((sum, value) => sum + value, 0) / balances.length
    : 0;
  const monthlyIncomeDays = incomeDays / periodMonths;

  return {
    periodStart,
    periodEnd,
    totalIncome: decimal(totalIncome),
    totalExpense: decimal(totalExpense),
    avgMonthlyIncome: decimal(totalIncome / periodMonths),
    avgDailyIncome: decimal(totalIncome / periodDays),
    incomeDays,
    noIncomeDays: Math.max(0, periodDays - incomeDays),
    incomeFrequencyScore: calculateIncomeFrequencyScore(monthlyIncomeDays),
    incomeStabilityScore: calculateIncomeStabilityScore(dailyIncomeTotals),
    expenseRatio: decimal(totalIncome > 0 ? totalExpense / totalIncome : 0),
    averageBalance: decimal(averageBalance),
    minBalance: decimal(balances.length ? Math.min(...balances) : 0),
    maxBalance: decimal(balances.length ? Math.max(...balances) : 0),
    calculatedAt: periodEnd,
  };
}

function calculateIncomeFrequencyScore(monthlyIncomeDays) {
  if (monthlyIncomeDays >= 20) {
    return 100;
  }
  if (monthlyIncomeDays >= 12) {
    return 70;
  }
  if (monthlyIncomeDays >= 6) {
    return 40;
  }
  return 10;
}

function calculateIncomeStabilityScore(dailyIncomeTotals) {
  if (dailyIncomeTotals.length <= 1) {
    return dailyIncomeTotals.length === 1 ? 40 : 10;
  }

  const average =
    dailyIncomeTotals.reduce((sum, value) => sum + value, 0) /
    dailyIncomeTotals.length;

  if (average === 0) {
    return 10;
  }

  const variance =
    dailyIncomeTotals.reduce((sum, value) => sum + (value - average) ** 2, 0) /
    dailyIncomeTotals.length;
  const coefficientOfVariation = Math.sqrt(variance) / average;

  if (coefficientOfVariation <= 0.25) {
    return 100;
  }
  if (coefficientOfVariation <= 0.5) {
    return 70;
  }
  if (coefficientOfVariation <= 1) {
    return 40;
  }
  return 10;
}

function buildCreditScore(metric) {
  const incomeFrequencyPoints =
    metric.incomeFrequencyScore >= 90
      ? 25
      : metric.incomeFrequencyScore >= 70
        ? 18
        : metric.incomeFrequencyScore >= 40
          ? 10
          : 3;
  const incomeStabilityPoints =
    metric.incomeStabilityScore >= 90
      ? 20
      : metric.incomeStabilityScore >= 70
        ? 14
        : metric.incomeStabilityScore >= 40
          ? 8
          : 2;
  const cashflowPoints =
    metric.expenseRatio <= 0.6
      ? 20
      : metric.expenseRatio <= 0.8
        ? 14
        : metric.expenseRatio <= 1
          ? 8
          : 0;
  const balancePoints =
    metric.averageBalance > 1000
      ? 15
      : metric.averageBalance > 500
        ? 10
        : metric.averageBalance > 0
          ? 5
          : 0;
  const incomeVolumePoints =
    metric.avgMonthlyIncome >= 3000
      ? 10
      : metric.avgMonthlyIncome >= 1500
        ? 7
        : metric.avgMonthlyIncome >= 800
          ? 4
          : 1;
  let riskPenalty = 0;

  if (metric.expenseRatio > 1.2) {
    riskPenalty += 10;
  }
  if (metric.avgMonthlyIncome < 800) {
    riskPenalty += 5;
  }
  if (metric.noIncomeDays > 20) {
    riskPenalty += 10;
  }
  if (metric.averageBalance < 0) {
    riskPenalty += 10;
  }

  riskPenalty = Math.min(30, riskPenalty);
  const baseScore = Math.max(
    0,
    Math.min(
      100,
      incomeFrequencyPoints +
        incomeStabilityPoints +
        cashflowPoints +
        balancePoints +
        incomeVolumePoints -
        riskPenalty,
    ),
  );
  const score = baseScore * 10;
  const decision =
    score >= 600
      ? CreditDecision.APPROVED
      : score >= 400
        ? CreditDecision.MANUAL_REVIEW
        : CreditDecision.REJECTED;
  const recommendedLimit =
    score >= 800
      ? metric.avgMonthlyIncome * 0.3
      : score >= 600
        ? metric.avgMonthlyIncome * 0.15
        : 0;

  return {
    score,
    decision,
    recommendedLimit: decimal(recommendedLimit),
    incomeFrequencyPoints,
    incomeStabilityPoints,
    cashflowPoints: cashflowPoints + incomeVolumePoints,
    balancePoints,
    riskPenalty,
    explanation:
      decision === CreditDecision.APPROVED
        ? "Mock score approved from seeded financial history."
        : decision === CreditDecision.MANUAL_REVIEW
          ? "Mock score requires review from seeded financial history."
          : "Mock score rejected from seeded financial history.",
  };
}

async function resolveUser(options) {
  if (options.userId) {
    return prisma.user.findUnique({ where: { id: options.userId } });
  }

  if (options.email) {
    return prisma.user.findUnique({ where: { email: options.email } });
  }

  throw new Error("Provide --user-id or --email.");
}

async function assertOrResetUserData(userId, shouldReset) {
  const counts = await prisma.$transaction([
    prisma.financialAccount.count({ where: { userId } }),
    prisma.transaction.count({ where: { userId } }),
    prisma.financialMetric.count({ where: { userId } }),
    prisma.creditScore.count({ where: { userId } }),
    prisma.creditRequest.count({ where: { userId } }),
    prisma.pluggyItem.count({ where: { userId } }),
  ]);

  const total = counts.reduce((sum, count) => sum + count, 0);

  if (total === 0) {
    return;
  }

  if (!shouldReset) {
    throw new Error(
      "User already has financial data. Re-run with --reset to replace it.",
    );
  }

  await prisma.$transaction([
    prisma.creditRequest.deleteMany({ where: { userId } }),
    prisma.creditScore.deleteMany({ where: { userId } }),
    prisma.financialMetric.deleteMany({ where: { userId } }),
    prisma.transaction.deleteMany({ where: { userId } }),
    prisma.financialAccount.deleteMany({ where: { userId } }),
    prisma.consent.deleteMany({ where: { userId } }),
    prisma.syncLog.deleteMany({
      where: {
        pluggyItem: {
          userId,
        },
      },
    }),
    prisma.pluggyItem.deleteMany({ where: { userId } }),
  ]);
}

async function main() {
  const options = parseArgs(process.argv.slice(2));

  if (options.help) {
    printHelp();
    return;
  }

  if (!Number.isInteger(options.months) || options.months < 1 || options.months > 24) {
    throw new Error("--months must be an integer between 1 and 24.");
  }

  const user = await resolveUser(options);

  if (!user) {
    throw new Error("User not found.");
  }

  await assertOrResetUserData(user.id, options.reset);

  const pluggyItem = await prisma.pluggyItem.create({
    data: {
      userId: user.id,
      pluggyItemId: `mock-item-${user.id}`,
      connectorId: "mock-bank",
      institutionName: "Banco FluxCred Demo",
      status: PluggyItemStatus.UPDATED,
      executionStatus: PluggyExecutionStatus.SUCCESS,
      lastUpdatedAt: new Date(),
      lastSuccessfulSyncAt: new Date(),
    },
  });

  await prisma.syncLog.create({
    data: {
      pluggyItemId: pluggyItem.id,
      status: SyncStatus.SUCCESS,
      startedAt: new Date(Date.now() - 15 * 60 * 1000),
      finishedAt: new Date(),
      accountsSynced: 3,
      transactionsSynced: options.months * 13,
      metadata: {
        source: "mock-user-history",
      },
    },
  });

  const accounts = {
    checking: await prisma.financialAccount.create({
      data: {
        userId: user.id,
        pluggyItemId: pluggyItem.id,
        pluggyAccountId: `mock-checking-${user.id}`,
        type: AccountType.BANK,
        subtype: "CHECKING",
        numberMasked: "**** 4921",
        name: "Conta principal",
        marketingName: "Itau Uniclass",
        ownerName: user.name,
        taxNumberMasked: user.document ? "***" : null,
        currencyCode: "BRL",
        currentBalance: 0,
        availableCreditLimit: null,
        creditLimit: null,
        status: AccountStatus.ACTIVE,
      },
    }),
    reserve: await prisma.financialAccount.create({
      data: {
        userId: user.id,
        pluggyItemId: pluggyItem.id,
        pluggyAccountId: `mock-reserve-${user.id}`,
        type: AccountType.BANK,
        subtype: "SAVINGS",
        numberMasked: "**** 8812",
        name: "Reserva",
        marketingName: "Nubank Caixinha",
        ownerName: user.name,
        taxNumberMasked: user.document ? "***" : null,
        currencyCode: "BRL",
        currentBalance: 0,
        availableCreditLimit: null,
        creditLimit: null,
        status: AccountStatus.ACTIVE,
      },
    }),
    credit: await prisma.financialAccount.create({
      data: {
        userId: user.id,
        pluggyItemId: pluggyItem.id,
        pluggyAccountId: `mock-credit-${user.id}`,
        type: AccountType.CREDIT,
        subtype: "CREDIT_CARD",
        numberMasked: "**** 2102",
        name: "Cartao principal",
        marketingName: "Nubank Platinum",
        ownerName: user.name,
        taxNumberMasked: user.document ? "***" : null,
        currencyCode: "BRL",
        currentBalance: 0,
        availableCreditLimit: 12000,
        creditLimit: 12000,
        status: AccountStatus.ACTIVE,
      },
    }),
  };

  const { transactions, balances } = createMonthlyTransactions(accounts, options.months);

  await prisma.transaction.createMany({
    data: transactions.map((transaction) => ({
      userId: user.id,
      ...transaction,
    })),
  });

  await prisma.financialAccount.update({
    where: { id: accounts.checking.id },
    data: { currentBalance: balances.checking },
  });
  await prisma.financialAccount.update({
    where: { id: accounts.reserve.id },
    data: { currentBalance: balances.reserve },
  });
  await prisma.financialAccount.update({
    where: { id: accounts.credit.id },
    data: { currentBalance: balances.credit },
  });

  const createdScores = [];

  for (let offset = options.months - 1; offset >= 0; offset -= 1) {
    const { start, end } = monthWindow(offset);
    const monthTransactions = transactions.filter(
      (transaction) =>
        transaction.transactionDate >= start && transaction.transactionDate <= end,
    );
    const metricData = calculateFinancialMetric(monthTransactions, start, end);
    const metric = await prisma.financialMetric.create({
      data: {
        userId: user.id,
        ...metricData,
      },
    });
    const scoreData = buildCreditScore(metricData);
    const score = await prisma.creditScore.create({
      data: {
        userId: user.id,
        financialMetricId: metric.id,
        ...scoreData,
        createdAt: end,
      },
    });

    createdScores.push(score);
  }

  const latestScore = createdScores[createdScores.length - 1];
  const previousScore = createdScores[createdScores.length - 2] ?? latestScore;

  if (previousScore) {
    await prisma.creditRequest.create({
      data: {
        userId: user.id,
        creditScoreId: previousScore.id,
        requestedAmount: decimal(previousScore.recommendedLimit * 1.15 || 2500),
        approvedAmount: null,
        status: CreditRequestStatus.REVIEW,
        requestedAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
        decidedAt: new Date(Date.now() - 44 * 24 * 60 * 60 * 1000),
      },
    });
  }

  await prisma.creditRequest.create({
    data: {
      userId: user.id,
      creditScoreId: latestScore.id,
      requestedAmount: decimal(latestScore.recommendedLimit * 0.8 || 1800),
      approvedAmount:
        latestScore.decision === CreditDecision.APPROVED
          ? decimal(latestScore.recommendedLimit * 0.8 || 1800)
          : null,
      status:
        latestScore.decision === CreditDecision.APPROVED
          ? CreditRequestStatus.APPROVED
          : latestScore.decision === CreditDecision.MANUAL_REVIEW
            ? CreditRequestStatus.REVIEW
            : CreditRequestStatus.REJECTED,
      requestedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
      decidedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    },
  });

  console.log(
    [
      "Mock history created successfully.",
      `User: ${user.email} (${user.id})`,
      `Accounts: 3`,
      `Transactions: ${transactions.length}`,
      `Metrics: ${options.months}`,
      `Scores: ${createdScores.length}`,
      `Requests: 2`,
    ].join("\n"),
  );
}

main()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
