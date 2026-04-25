import { useQuery } from "@tanstack/react-query";
import {
  ArrowDownToLine,
  ArrowUpRight,
  Banknote,
  Bell,
  Building2,
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  CirclePlus,
  CreditCard,
  Filter,
  Gauge,
  HelpCircle,
  Home,
  Landmark,
  LayoutDashboard,
  List,
  LogOut,
  ReceiptText,
  Search,
  Settings,
  User,
  WalletCards,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiRequest, formatCurrency, formatDate } from "@/lib/api";

type AccountType = "BANK" | "CREDIT" | "INVESTMENT" | "LOAN" | "OTHER";
type AccountStatus = "ACTIVE" | "INACTIVE" | "ERROR";
type TransactionType = "CREDIT" | "DEBIT";
type TransactionStatus = "POSTED" | "PENDING";

type FinancialAccount = {
  id: string;
  pluggyItemId: string;
  type: AccountType;
  subtype?: string | null;
  numberMasked?: string | null;
  name?: string | null;
  marketingName?: string | null;
  ownerName?: string | null;
  currencyCode: string;
  currentBalance: number | string;
  availableCreditLimit?: number | string | null;
  creditLimit?: number | string | null;
  balanceDueDate?: string | null;
  balanceCloseDate?: string | null;
  status: AccountStatus;
  updatedAt: string;
};

type Transaction = {
  id: string;
  accountId: string;
  type: TransactionType;
  status: TransactionStatus;
  amount: number | string;
  currencyCode: string;
  description: string;
  category?: string | null;
  merchantName?: string | null;
  transactionDate: string;
};

type FilterPreset = "mes-atual" | "ultimos-30" | "personalizado";

const sideNavItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Transações", href: "/transactions", icon: ReceiptText, active: true },
  { label: "Score de Crédito", href: "/credit-score", icon: Gauge },
  { label: "Solicitar Crédito", href: "/credit-request", icon: CreditCard },
  { label: "Instituições", href: "/connect-accounts", icon: Building2 },
];

const mobileNavItems = [
  { label: "Home", href: "/dashboard", icon: Home },
  { label: "Atividade", href: "/transactions", icon: List, active: true },
  { label: "Solicitar", href: "/credit-request", icon: CirclePlus, primary: true },
  { label: "Score", href: "/credit-score", icon: Gauge },
  { label: "Perfil", href: "/dashboard", icon: User },
];

function formatAccountType(type: AccountType) {
  switch (type) {
    case "BANK":
      return "Conta bancária";
    case "CREDIT":
      return "Cartão de crédito";
    case "INVESTMENT":
      return "Investimento";
    case "LOAN":
      return "Empréstimo";
    default:
      return "Outra conta";
  }
}

function formatAccountStatus(status: AccountStatus) {
  switch (status) {
    case "ACTIVE":
      return "Sincronizada";
    case "INACTIVE":
      return "Inativa";
    case "ERROR":
      return "Com erro";
    default:
      return status;
  }
}

function getInitials(value: string) {
  const cleaned = value.trim();
  if (!cleaned) {
    return "FC";
  }

  const parts = cleaned.split(/\s+/);

  return parts.length === 1
    ? parts[0].slice(0, 2).toUpperCase()
    : `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

function getAccountName(account: FinancialAccount) {
  return (
    account.marketingName ??
    account.name ??
    account.ownerName ??
    formatAccountType(account.type)
  );
}

function getAccountColor(name: string) {
  const key = name.toLowerCase();

  if (key.includes("nubank")) {
    return "bg-purple-700 text-white";
  }

  if (key.includes("itaú") || key.includes("itau")) {
    return "bg-orange-500 text-white";
  }

  if (key.includes("bradesco")) {
    return "bg-red-600 text-white";
  }

  if (key.includes("santander")) {
    return "bg-red-500 text-white";
  }

  if (key.includes("caixa")) {
    return "bg-blue-600 text-white";
  }

  if (key.includes("inter")) {
    return "bg-orange-600 text-white";
  }

  return "bg-[#00766d] text-white";
}

function getPresetDateRange(preset: FilterPreset) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (preset === "mes-atual") {
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    return {
      from: firstDay.toISOString(),
      to: today.toISOString(),
    };
  }

  if (preset === "ultimos-30") {
    const from = new Date(today);
    from.setDate(from.getDate() - 30);
    return {
      from: from.toISOString(),
      to: today.toISOString(),
    };
  }

  return {
    from: undefined,
    to: undefined,
  };
}

function formatDateTime(value?: string | null) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatDateInputValue(value?: string | undefined) {
  if (!value) {
    return "";
  }

  return new Date(value).toISOString().slice(0, 10);
}

function downloadCsv(filename: string, rows: string[][]) {
  const csv = rows
    .map((row) =>
      row
        .map((cell) => `"${String(cell ?? "").replaceAll('"', '""')}"`)
        .join(","),
    )
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export default function TransactionsPage() {
  const [selectedAccountId, setSelectedAccountId] = useState<string>("todas");
  const [searchTerm, setSearchTerm] = useState("");
  const [draftPreset, setDraftPreset] = useState<FilterPreset>("mes-atual");
  const [draftCategory, setDraftCategory] = useState("todas");
  const [draftFrom, setDraftFrom] = useState("");
  const [draftTo, setDraftTo] = useState("");
  const [appliedPreset, setAppliedPreset] = useState<FilterPreset>("mes-atual");
  const [appliedCategory, setAppliedCategory] = useState("todas");
  const [appliedFrom, setAppliedFrom] = useState("");
  const [appliedTo, setAppliedTo] = useState("");

  const {
    data: accounts = [],
    isLoading: isLoadingAccounts,
    error: accountsError,
  } = useQuery({
    queryKey: ["accounts"],
    queryFn: () => apiRequest<FinancialAccount[]>("/accounts"),
  });

  const transactionQuery = useMemo(() => {
    const params = new URLSearchParams();

    if (selectedAccountId !== "todas") {
      params.set("accountId", selectedAccountId);
    }

    if (appliedPreset === "personalizado") {
      if (appliedFrom) {
        params.set("from", new Date(appliedFrom).toISOString());
      }

      if (appliedTo) {
        const to = new Date(appliedTo);
        to.setHours(23, 59, 59, 999);
        params.set("to", to.toISOString());
      }
    } else {
      const range = getPresetDateRange(appliedPreset);

      if (range.from) {
        params.set("from", range.from);
      }

      if (range.to) {
        params.set("to", range.to);
      }
    }

    const queryString = params.toString();

    return queryString ? `/transactions?${queryString}` : "/transactions";
  }, [appliedFrom, appliedPreset, appliedTo, selectedAccountId]);

  const {
    data: transactions = [],
    isLoading: isLoadingTransactions,
    error: transactionsError,
  } = useQuery({
    queryKey: [
      "transactions",
      selectedAccountId,
      appliedPreset,
      appliedFrom,
      appliedTo,
    ],
    queryFn: () => apiRequest<Transaction[]>(transactionQuery),
  });

  const selectedAccount = useMemo(
    () =>
      selectedAccountId === "todas"
        ? null
        : accounts.find((account) => account.id === selectedAccountId) ?? null,
    [accounts, selectedAccountId],
  );

  const {
    data: selectedAccountDetails,
    isLoading: isLoadingAccountDetails,
  } = useQuery({
    queryKey: ["accounts", selectedAccountId, "details"],
    queryFn: () =>
      apiRequest<FinancialAccount>(`/accounts/${selectedAccountId}`),
    enabled: selectedAccountId !== "todas",
  });

  useEffect(() => {
    if (!accounts.length) {
      return;
    }

    if (
      selectedAccountId !== "todas" &&
      !accounts.some((account) => account.id === selectedAccountId)
    ) {
      setSelectedAccountId("todas");
    }
  }, [accounts, selectedAccountId]);

  const accountsMap = useMemo(
    () => new Map(accounts.map((account) => [account.id, account])),
    [accounts],
  );

  const availableCategories = useMemo(() => {
    const values = new Set<string>();

    for (const transaction of transactions) {
      if (transaction.category) {
        values.add(transaction.category);
      }
    }

    return Array.from(values).sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return transactions.filter((transaction) => {
      const matchesCategory =
        appliedCategory === "todas" || transaction.category === appliedCategory;

      if (!matchesCategory) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      const accountName = getAccountName(
        accountsMap.get(transaction.accountId) ?? {
          id: "",
          pluggyItemId: "",
          type: "OTHER",
          currencyCode: "BRL",
          currentBalance: 0,
          status: "ACTIVE",
          updatedAt: new Date().toISOString(),
        },
      );

      const haystack = [
        transaction.description,
        transaction.merchantName,
        transaction.category,
        accountName,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalizedSearch);
    });
  }, [accountsMap, appliedCategory, searchTerm, transactions]);

  const transactionTotals = useMemo(() => {
    return filteredTransactions.reduce(
      (accumulator, transaction) => {
        const amount = Number(transaction.amount ?? 0);

        if (transaction.type === "CREDIT") {
          accumulator.totalEntradas += amount;
        } else {
          accumulator.totalSaidas += Math.abs(amount);
        }

        return accumulator;
      },
      { totalEntradas: 0, totalSaidas: 0 },
    );
  }, [filteredTransactions]);

  const totalSaldo = useMemo(
    () =>
      accounts.reduce(
        (sum, account) => sum + Number(account.currentBalance ?? 0),
        0,
      ),
    [accounts],
  );

  const errorMessage = accountsError ?? transactionsError;

  function handleApplyFilters() {
    setAppliedPreset(draftPreset);
    setAppliedCategory(draftCategory);
    setAppliedFrom(draftFrom);
    setAppliedTo(draftTo);
  }

  function handleExport() {
    downloadCsv("fluxcred-transacoes.csv", [
      ["Data", "Descrição", "Categoria", "Conta", "Tipo", "Valor", "Status"],
      ...filteredTransactions.map((transaction) => [
        formatDateTime(transaction.transactionDate),
        transaction.description,
        transaction.category ?? "Sem categoria",
        getAccountName(
          accountsMap.get(transaction.accountId) ?? {
            id: "",
            pluggyItemId: "",
            type: "OTHER",
            currencyCode: "BRL",
            currentBalance: 0,
            status: "ACTIVE",
            updatedAt: new Date().toISOString(),
          },
        ),
        transaction.type === "CREDIT" ? "Crédito" : "Débito",
        String(transaction.amount),
        transaction.status === "POSTED" ? "Lançada" : "Pendente",
      ]),
    ]);
  }

  const summaryAccount = selectedAccountDetails ?? selectedAccount;

  return (
    <main className="min-h-svh bg-[#f7fafa] text-[#181c1d]">
      <aside className="fixed left-0 top-0 z-50 hidden h-svh w-72 border-r border-slate-200 bg-white md:flex md:flex-col">
        <div className="flex h-full flex-col gap-2 p-6">
          <div className="mb-8">
            <h1 className="font-mono text-2xl font-bold text-[#00766d]">
              FluxCred
            </h1>
            <p className="text-xs text-slate-500">
              Finanças corporativas modernas
            </p>
          </div>

          <nav className="flex-1 space-y-1">
            {sideNavItems.map((item) => {
              const Icon = item.icon;

              return (
                <a
                  key={item.label}
                  href={item.href}
                  className={
                    item.active
                      ? "flex items-center gap-3 rounded-xl border-r-4 border-[#00766d] bg-[#e8f7f4] px-4 py-3 text-sm font-bold text-[#00766d]"
                      : "flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-slate-600 transition-colors hover:bg-slate-50 hover:text-[#00766d]"
                  }
                >
                  <Icon className="size-5" aria-hidden="true" />
                  <span className="font-mono text-sm">{item.label}</span>
                </a>
              );
            })}
          </nav>

          <div className="mt-auto border-t border-slate-100 pt-5">
            <Button
              asChild
              className="mb-4 h-12 w-full rounded-xl bg-[#00535b] text-sm font-bold text-white hover:bg-[#00464d]"
            >
              <a href="/credit-request">Solicitar crédito</a>
            </Button>
            <a
              href="/dashboard"
              className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm text-slate-600 transition-colors hover:bg-slate-50"
            >
              <Settings className="size-5" aria-hidden="true" />
              Configurações
            </a>
            <a
              href="/logout"
              className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm text-slate-600 transition-colors hover:bg-slate-50"
            >
              <LogOut className="size-5" aria-hidden="true" />
              Sair
            </a>
          </div>
        </div>
      </aside>

      <section className="min-h-svh pb-28 md:ml-72 md:pb-8">
        <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/85 shadow-sm backdrop-blur">
          <div className="flex h-16 items-center justify-between px-5 md:px-8">
            <div className="flex items-center gap-4">
              <span className="font-mono text-xl font-extrabold text-[#00766d] md:hidden">
                FluxCred
              </span>
              <h2 className="hidden font-mono text-lg font-semibold text-[#181c1d] md:block">
                Contas e transações
              </h2>
            </div>

            <div className="flex items-center gap-3 sm:gap-5">
              <div className="relative hidden sm:block">
                <Search
                  className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400"
                  aria-hidden="true"
                />
                <Input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Buscar transações..."
                  className="h-10 w-64 rounded-full border-0 bg-slate-100 pl-10 shadow-none focus-visible:ring-[#00766d] lg:w-80"
                />
              </div>
              <button
                type="button"
                className="relative flex size-9 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100"
                aria-label="Notificações"
              >
                <Bell className="size-5" aria-hidden="true" />
                <span className="absolute right-2 top-2 size-2 rounded-full bg-red-500 ring-2 ring-white" />
              </button>
              <button
                type="button"
                className="flex size-9 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100"
                aria-label="Ajuda"
              >
                <HelpCircle className="size-5" aria-hidden="true" />
              </button>
              <div className="flex size-9 items-center justify-center rounded-full bg-[#006d77] text-white">
                <User className="size-5" aria-hidden="true" />
              </div>
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-[1280px] space-y-6 p-5 md:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h1 className="font-mono text-3xl font-semibold text-[#181c1d]">
                Contas e transações
              </h1>
              <p className="mt-2 max-w-2xl text-base leading-7 text-[#506383]">
                Gerencie suas contas conectadas e acompanhe toda a movimentação
                financeira em um único lugar.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                asChild
                className="h-12 rounded-xl bg-[#00766d] px-5 font-semibold text-white hover:bg-[#005f58]"
              >
                <a href="/credit-request">
                  <CirclePlus className="size-5" aria-hidden="true" />
                  Nova solicitação
                </a>
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleExport}
                className="h-12 rounded-xl border-slate-300 bg-white px-5 font-semibold text-[#181c1d] hover:bg-slate-50"
              >
                <ArrowDownToLine className="size-4" aria-hidden="true" />
                Exportar
              </Button>
            </div>
          </div>

          {errorMessage && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {errorMessage instanceof Error
                ? errorMessage.message
                : "Não foi possível carregar os dados desta tela."}
            </div>
          )}

          <section className="grid gap-6 lg:grid-cols-[320px_1fr]">
            <aside className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-mono text-lg font-semibold text-[#181c1d]">
                    Contas
                  </h2>
                  <p className="text-sm text-[#506383]">
                    {isLoadingAccounts
                      ? "Carregando contas..."
                      : `${accounts.length} conta(s) conectada(s)`}
                  </p>
                </div>
                <Landmark className="size-5 text-[#00766d]" aria-hidden="true" />
              </div>

              <button
                type="button"
                onClick={() => setSelectedAccountId("todas")}
                className={
                  selectedAccountId === "todas"
                    ? "flex w-full items-center justify-between rounded-xl border border-[#bfe9e3] bg-[#e8f7f4] px-4 py-4 text-left"
                    : "flex w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-4 text-left transition-colors hover:border-[#bfe9e3] hover:bg-[#f2fbfa]"
                }
              >
                <div className="flex items-center gap-3">
                  <span className="flex size-10 items-center justify-center rounded-full bg-white text-[#00766d] shadow-sm">
                    <WalletCards className="size-5" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-sm font-bold text-[#181c1d]">
                      Todas as contas
                    </p>
                    <p className="text-xs text-[#506383]">
                      Saldo total consolidado
                    </p>
                  </div>
                </div>
                <span className="rounded-full bg-[#ccf2ec] px-2 py-1 text-xs font-bold text-[#00766d]">
                  {accounts.length}
                </span>
              </button>

              <div className="space-y-3">
                {accounts.map((account) => {
                  const accountName = getAccountName(account);
                  const isSelected = selectedAccountId === account.id;

                  return (
                    <button
                      type="button"
                      key={account.id}
                      onClick={() => setSelectedAccountId(account.id)}
                      className={
                        isSelected
                          ? "flex w-full items-center justify-between rounded-xl border border-[#bfe9e3] bg-[#f3fbfa] px-4 py-4 text-left"
                          : "flex w-full items-center justify-between rounded-xl border border-transparent px-4 py-4 text-left transition-colors hover:border-slate-200 hover:bg-slate-50"
                      }
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <span
                          className={`flex size-10 shrink-0 items-center justify-center rounded-lg text-sm font-bold ${getAccountColor(accountName)}`}
                        >
                          {getInitials(accountName)}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-[#181c1d]">
                            {accountName}
                          </p>
                          <p className="truncate text-xs text-[#506383]">
                            {formatAccountType(account.type)}
                            {account.numberMasked
                              ? ` • ${account.numberMasked}`
                              : ""}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-[#181c1d]">
                          {formatCurrency(account.currentBalance)}
                        </p>
                        <span
                          className={
                            account.status === "ACTIVE"
                              ? "rounded-full bg-teal-50 px-2 py-0.5 text-[10px] font-bold text-teal-700"
                              : "rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600"
                          }
                        >
                          {formatAccountStatus(account.status)}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </aside>

            <div className="space-y-6">
              <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr_auto]">
                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-[#506383]">
                      Período
                    </label>
                    <div className="grid grid-cols-3 rounded-xl border border-slate-200 bg-slate-50 p-1">
                      {[
                        { key: "mes-atual", label: "Este mês" },
                        { key: "ultimos-30", label: "Últimos 30 dias" },
                        { key: "personalizado", label: "Personalizado" },
                      ].map((option) => (
                        <button
                          key={option.key}
                          type="button"
                          onClick={() =>
                            setDraftPreset(option.key as FilterPreset)
                          }
                          className={
                            draftPreset === option.key
                              ? "rounded-lg bg-white px-3 py-2 text-sm font-semibold text-[#00766d] shadow-sm"
                              : "rounded-lg px-3 py-2 text-sm text-[#506383]"
                          }
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                    {draftPreset === "personalizado" && (
                      <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        <Input
                          type="date"
                          value={draftFrom}
                          onChange={(event) => setDraftFrom(event.target.value)}
                          className="h-11 rounded-xl border-slate-200 bg-white"
                        />
                        <Input
                          type="date"
                          value={draftTo}
                          onChange={(event) => setDraftTo(event.target.value)}
                          className="h-11 rounded-xl border-slate-200 bg-white"
                        />
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-[#506383]">
                      Categoria
                    </label>
                    <div className="relative">
                      <select
                        value={draftCategory}
                        onChange={(event) => setDraftCategory(event.target.value)}
                        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-[#181c1d] shadow-sm outline-none focus:ring-2 focus:ring-[#00766d]"
                      >
                        <option value="todas">Todas as categorias</option>
                        {availableCategories.map((category) => (
                          <option key={category} value={category}>
                            {category}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex items-end">
                    <Button
                      type="button"
                      onClick={handleApplyFilters}
                      className="h-11 w-full rounded-xl bg-white px-5 font-semibold text-[#00766d] ring-1 ring-[#00766d] hover:bg-[#f2fbfa]"
                    >
                      <Filter className="size-4" aria-hidden="true" />
                      Aplicar filtros
                    </Button>
                  </div>
                </div>
              </section>

              <section className="grid gap-4 md:grid-cols-3">
                <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#506383]">
                    Saldo consolidado
                  </p>
                  <h3 className="mt-2 font-mono text-2xl font-semibold text-[#181c1d]">
                    {formatCurrency(totalSaldo)}
                  </h3>
                </article>
                <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#506383]">
                    Entradas no período
                  </p>
                  <h3 className="mt-2 font-mono text-2xl font-semibold text-teal-700">
                    {formatCurrency(transactionTotals.totalEntradas)}
                  </h3>
                </article>
                <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#506383]">
                    Saídas no período
                  </p>
                  <h3 className="mt-2 font-mono text-2xl font-semibold text-red-600">
                    {formatCurrency(transactionTotals.totalSaidas)}
                  </h3>
                </article>
              </section>

              <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="font-mono text-lg font-semibold text-[#181c1d]">
                      Lançamentos recentes
                    </h2>
                    <p className="text-sm text-[#506383]">
                      {filteredTransactions.length} transação(ões) no recorte atual
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-[#506383]">
                    <CalendarRange className="size-4" aria-hidden="true" />
                    {appliedPreset === "mes-atual"
                      ? "Este mês"
                      : appliedPreset === "ultimos-30"
                        ? "Últimos 30 dias"
                        : "Período personalizado"}
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[860px] text-left">
                    <thead className="border-b border-slate-100 bg-slate-50">
                      <tr>
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-[0.12em] text-[#506383]">
                          Data
                        </th>
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-[0.12em] text-[#506383]">
                          Descrição
                        </th>
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-[0.12em] text-[#506383]">
                          Categoria
                        </th>
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-[0.12em] text-[#506383]">
                          Conta
                        </th>
                        <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-[0.12em] text-[#506383]">
                          Valor
                        </th>
                        <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-[0.12em] text-[#506383]">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredTransactions.map((transaction) => {
                        const account = accountsMap.get(transaction.accountId);
                        const accountName = account
                          ? getAccountName(account)
                          : "Conta removida";
                        const isCredit = transaction.type === "CREDIT";

                        return (
                          <tr
                            key={transaction.id}
                            className="transition-colors hover:bg-slate-50"
                          >
                            <td className="px-6 py-4 text-xs font-medium text-[#506383]">
                              <div className="flex flex-col">
                                <span>{formatDate(transaction.transactionDate)}</span>
                                <span className="text-[11px] text-slate-400">
                                  {new Intl.DateTimeFormat("pt-BR", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  }).format(new Date(transaction.transactionDate))}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <span
                                  className={
                                    isCredit
                                      ? "flex size-9 items-center justify-center rounded-lg bg-teal-50 text-teal-700"
                                      : "flex size-9 items-center justify-center rounded-lg bg-red-50 text-red-600"
                                  }
                                >
                                  {isCredit ? (
                                    <ArrowUpRight className="size-4" aria-hidden="true" />
                                  ) : (
                                    <Banknote className="size-4" aria-hidden="true" />
                                  )}
                                </span>
                                <div>
                                  <p className="text-sm font-bold text-[#181c1d]">
                                    {transaction.description}
                                  </p>
                                  <p className="text-xs text-[#506383]">
                                    {transaction.merchantName ?? "Movimentação bancária"}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span
                                className={
                                  isCredit
                                    ? "rounded bg-teal-50 px-2 py-1 text-[11px] font-bold text-teal-700"
                                    : "rounded bg-slate-100 px-2 py-1 text-[11px] font-bold text-slate-600"
                                }
                              >
                                {transaction.category ?? "Sem categoria"}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-[#506383]">
                              {accountName}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <span
                                className={
                                  isCredit
                                    ? "text-sm font-bold text-teal-700"
                                    : "text-sm font-bold text-red-600"
                                }
                              >
                                {isCredit ? "+" : "-"} {formatCurrency(transaction.amount)}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <span
                                className={
                                  transaction.status === "POSTED"
                                    ? "rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-bold text-emerald-700"
                                    : "rounded-full bg-amber-50 px-2 py-1 text-[11px] font-bold text-amber-700"
                                }
                              >
                                {transaction.status === "POSTED"
                                  ? "Lançada"
                                  : "Pendente"}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                      {!isLoadingTransactions && filteredTransactions.length === 0 && (
                        <tr>
                          <td
                            colSpan={6}
                            className="px-6 py-10 text-center text-sm text-[#506383]"
                          >
                            Nenhuma transação encontrada para os filtros atuais.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="flex items-center justify-between border-t border-slate-100 px-5 py-4 text-sm text-[#506383]">
                  <span>
                    Exibindo {filteredTransactions.length} transação(ões)
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="flex size-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400"
                    >
                      <ChevronLeft className="size-4" aria-hidden="true" />
                    </button>
                    <span className="flex size-8 items-center justify-center rounded-lg bg-[#00766d] text-xs font-bold text-white">
                      1
                    </span>
                    <button
                      type="button"
                      className="flex size-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400"
                    >
                      <ChevronRight className="size-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </section>

              <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <h2 className="font-mono text-lg font-semibold text-[#181c1d]">
                      Resumo da conta
                    </h2>
                    <p className="text-sm text-[#506383]">
                      {selectedAccountId === "todas"
                        ? "Visão consolidada de todas as contas"
                        : "Detalhes da conta selecionada"}
                    </p>
                  </div>
                </div>

                {selectedAccountId === "todas" ? (
                  <div className="grid gap-4 md:grid-cols-4">
                    <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                      <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#506383]">
                        Contas conectadas
                      </p>
                      <p className="mt-2 font-mono text-2xl font-semibold text-[#181c1d]">
                        {accounts.length}
                      </p>
                    </div>
                    <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                      <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#506383]">
                        Total em crédito
                      </p>
                      <p className="mt-2 font-mono text-2xl font-semibold text-[#181c1d]">
                        {formatCurrency(
                          accounts.reduce(
                            (sum, account) =>
                              sum + Number(account.creditLimit ?? 0),
                            0,
                          ),
                        )}
                      </p>
                    </div>
                    <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                      <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#506383]">
                        Limite disponível
                      </p>
                      <p className="mt-2 font-mono text-2xl font-semibold text-[#181c1d]">
                        {formatCurrency(
                          accounts.reduce(
                            (sum, account) =>
                              sum + Number(account.availableCreditLimit ?? 0),
                            0,
                          ),
                        )}
                      </p>
                    </div>
                    <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                      <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#506383]">
                        Última atualização
                      </p>
                      <p className="mt-2 text-sm font-semibold text-[#181c1d]">
                        {accounts.length
                          ? formatDateTime(
                              accounts
                                .slice()
                                .sort((a, b) =>
                                  b.updatedAt.localeCompare(a.updatedAt),
                                )[0]?.updatedAt,
                            )
                          : "-"}
                      </p>
                    </div>
                  </div>
                ) : isLoadingAccountDetails ? (
                  <div className="rounded-xl border border-slate-100 bg-slate-50 p-6 text-sm text-[#506383]">
                    Carregando detalhes da conta...
                  </div>
                ) : summaryAccount ? (
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                      <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#506383]">
                        Conta
                      </p>
                      <p className="mt-2 text-sm font-semibold text-[#181c1d]">
                        {getAccountName(summaryAccount)}
                      </p>
                    </div>
                    <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                      <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#506383]">
                        Saldo atual
                      </p>
                      <p className="mt-2 font-mono text-2xl font-semibold text-[#181c1d]">
                        {formatCurrency(summaryAccount.currentBalance)}
                      </p>
                    </div>
                    <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                      <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#506383]">
                        Limite total
                      </p>
                      <p className="mt-2 font-mono text-2xl font-semibold text-[#181c1d]">
                        {formatCurrency(summaryAccount.creditLimit)}
                      </p>
                    </div>
                    <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                      <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#506383]">
                        Limite disponível
                      </p>
                      <p className="mt-2 font-mono text-2xl font-semibold text-[#181c1d]">
                        {formatCurrency(summaryAccount.availableCreditLimit)}
                      </p>
                    </div>
                    <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                      <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#506383]">
                        Tipo
                      </p>
                      <p className="mt-2 text-sm font-semibold text-[#181c1d]">
                        {formatAccountType(summaryAccount.type)}
                      </p>
                    </div>
                    <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                      <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#506383]">
                        Status
                      </p>
                      <p className="mt-2 text-sm font-semibold text-[#181c1d]">
                        {formatAccountStatus(summaryAccount.status)}
                      </p>
                    </div>
                    <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                      <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#506383]">
                        Fechamento
                      </p>
                      <p className="mt-2 text-sm font-semibold text-[#181c1d]">
                        {formatDateTime(summaryAccount.balanceCloseDate)}
                      </p>
                    </div>
                    <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                      <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#506383]">
                        Vencimento
                      </p>
                      <p className="mt-2 text-sm font-semibold text-[#181c1d]">
                        {formatDateTime(summaryAccount.balanceDueDate)}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-[#506383]">
                    Não foi possível carregar os detalhes desta conta.
                  </div>
                )}
              </section>
            </div>
          </section>
        </div>
      </section>

      <nav className="fixed bottom-0 left-0 z-50 w-full rounded-t-2xl border-t border-slate-200 bg-white/95 shadow-[0_-4px_16px_rgba(2,62,138,0.06)] backdrop-blur md:hidden">
        <div className="flex h-20 w-full items-center justify-around px-4">
          {mobileNavItems.map((item) => {
            const Icon = item.icon;

            return (
              <a
                href={item.href}
                key={item.label}
                className={
                  item.primary
                    ? "flex flex-col items-center justify-center text-slate-400"
                    : item.active
                      ? "flex scale-110 flex-col items-center justify-center text-[#00766d]"
                      : "flex flex-col items-center justify-center text-slate-400"
                }
              >
                {item.primary ? (
                  <span className="-mt-10 flex size-11 items-center justify-center rounded-full border-4 border-[#f7fafa] bg-[#005f66] text-white shadow-lg">
                    <Icon className="size-6" aria-hidden="true" />
                  </span>
                ) : (
                  <Icon className="size-5" aria-hidden="true" />
                )}
                <span className="mt-1 text-[10px] font-semibold">
                  {item.label}
                </span>
              </a>
            );
          })}
        </div>
      </nav>
    </main>
  );
}
