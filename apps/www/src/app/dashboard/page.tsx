import { useQuery } from "@tanstack/react-query";
import {
  ArrowDownToLine,
  BarChart3,
  Bell,
  Building2,
  ChevronRight,
  CirclePlus,
  CreditCard,
  Filter,
  Gauge,
  HelpCircle,
  Home,
  LayoutDashboard,
  List,
  LogOut,
  ReceiptText,
  Search,
  Settings,
  ShieldCheck,
  ShoppingCart,
  TrendingUp,
  User,
  WalletCards,
} from "lucide-react";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiRequest, formatCurrency, formatDate } from "@/lib/api";

const navItems = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    active: true,
  },
  { label: "Transacoes", href: "/dashboard", icon: ReceiptText },
  { label: "Analise", href: "/dashboard", icon: BarChart3 },
  { label: "Score de Credito", href: "/credit-score", icon: Gauge },
  { label: "Solicitar Credito", href: "/credit-request", icon: CreditCard },
  { label: "Instituicoes", href: "/connect-accounts", icon: Building2 },
];

const bottomNavItems = [
  { label: "Home", icon: Home, active: true },
  { label: "Atividade", icon: List },
  { label: "Solicitar", icon: CirclePlus, primary: true },
  { label: "Analise", icon: BarChart3 },
  { label: "Perfil", icon: User },
];

type DashboardAccount = {
  id: string;
  type: string;
  numberMasked?: string | null;
  name?: string | null;
  marketingName?: string | null;
  currentBalance: number | string;
  status: string;
};

type DashboardTransaction = {
  id: string;
  type: "CREDIT" | "DEBIT";
  amount: number | string;
  description: string;
  category?: string | null;
  transactionDate: string;
};

type DashboardData = {
  totalBalance: number;
  totalIncome: number;
  totalExpense: number;
  recommendedLimit: number;
  latestScore?: {
    score: number;
  } | null;
  accounts: DashboardAccount[];
  recentTransactions: DashboardTransaction[];
};

export default function DashboardPage() {
  const {
    data: dashboard,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => apiRequest<DashboardData>("/dashboard"),
  });

  const budgetRemaining = useMemo(() => {
    const income = dashboard?.totalIncome ?? 0;
    const expense = dashboard?.totalExpense ?? 0;

    if (income <= 0) {
      return 0;
    }

    return Math.max(0, Math.min(100, ((income - expense) / income) * 100));
  }, [dashboard]);

  const accounts = dashboard?.accounts ?? [];
  const transactions = dashboard?.recentTransactions ?? [];

  return (
    <main className="min-h-svh bg-[#f7fafa] text-[#102a43]">
      <aside className="fixed left-0 top-0 z-50 hidden h-svh w-72 flex-col border-r border-slate-200 bg-white p-6 md:flex">
        <div className="mb-8">
          <h1 className="font-mono text-2xl font-bold text-[#00766d]">
            FluxCred
          </h1>
          <p className="text-xs text-slate-500">Financas modernas</p>
        </div>

        <nav className="flex-1 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;

            return (
              <a
                href={item.href}
                key={item.label}
                className={
                  item.active
                    ? "flex items-center gap-3 border-r-4 border-[#00766d] bg-[#e8f7f4] px-4 py-3 text-sm font-bold text-[#00766d]"
                    : "flex items-center gap-3 px-4 py-3 text-sm text-slate-600 transition-colors hover:bg-slate-50 hover:text-[#00766d]"
                }
              >
                <Icon className="size-5" aria-hidden="true" />
                {item.label}
              </a>
            );
          })}
        </nav>

        <div className="mt-auto space-y-3 border-t border-slate-100 pt-5">
          <Button
            asChild
            className="h-12 w-full rounded-xl bg-[#005f66] font-bold text-white hover:bg-[#004f56]"
          >
            <a href="/credit-request">Solicitar credito</a>
          </Button>
          <a
            href="/dashboard"
            className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm text-slate-600 transition-colors hover:bg-slate-50"
          >
            <Settings className="size-5" aria-hidden="true" />
            Configuracoes
          </a>
          <a
            href="/login"
            className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm text-slate-600 transition-colors hover:bg-slate-50"
          >
            <LogOut className="size-5" aria-hidden="true" />
            Sair
          </a>
        </div>
      </aside>

      <section className="min-h-svh pb-28 md:ml-72 md:pb-8">
        <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/85 shadow-sm backdrop-blur">
          <div className="flex h-16 items-center justify-between px-5 md:px-8">
            <div>
              <span className="font-mono text-xl font-extrabold text-[#00766d] md:hidden">
                FluxCred
              </span>
              <h2 className="hidden font-mono text-lg font-semibold text-slate-950 md:block">
                Dashboard
              </h2>
            </div>

            <div className="flex items-center gap-3 sm:gap-5">
              <div className="relative hidden sm:block">
                <Search
                  className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400"
                  aria-hidden="true"
                />
                <Input
                  placeholder="Buscar dados..."
                  className="h-10 w-56 rounded-full border-0 bg-slate-100 pl-10 shadow-none focus-visible:ring-[#00766d] lg:w-72"
                />
              </div>
              <button
                type="button"
                className="relative flex size-9 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100"
                aria-label="Notificacoes"
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
              <div className="flex size-9 items-center justify-center rounded-full bg-[#006d77] text-white ring-2 ring-[#d9fbf5]">
                <User className="size-5" aria-hidden="true" />
              </div>
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-[1280px] space-y-7 p-5 md:p-8">
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error instanceof Error
                ? error.message
                : "Nao foi possivel carregar."}
            </div>
          )}

          <section className="grid grid-cols-1 gap-6 md:grid-cols-12">
            <article className="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-6 shadow-sm md:col-span-4">
              <div className="absolute left-0 top-0 h-full w-1 bg-[#00766d]" />
              <div className="mb-5 flex items-start justify-between">
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#506383]">
                  Saldo Total
                </p>
                <WalletCards
                  className="size-5 text-[#00766d]"
                  aria-hidden="true"
                />
              </div>
              <h3 className="font-mono text-2xl font-semibold text-slate-950">
                {isLoading
                  ? "Carregando..."
                  : formatCurrency(dashboard?.totalBalance)}
              </h3>
              <p className="mt-2 flex items-center gap-1 text-sm text-[#00766d]">
                <TrendingUp className="size-4" aria-hidden="true" />
                Saldo consolidado das contas conectadas
              </p>
            </article>

            <article className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm md:col-span-4">
              <div className="grid grid-cols-2 divide-x divide-slate-100">
                <div className="pr-4">
                  <p className="mb-3 text-xs font-bold uppercase tracking-[0.12em] text-[#506383]">
                    Entradas do Periodo
                  </p>
                  <h4 className="font-mono text-2xl font-semibold text-slate-950">
                    {formatCurrency(dashboard?.totalIncome)}
                  </h4>
                </div>
                <div className="pl-4">
                  <p className="mb-3 text-xs font-bold uppercase tracking-[0.12em] text-[#506383]">
                    Saidas do Periodo
                  </p>
                  <h4 className="font-mono text-2xl font-semibold text-red-600">
                    {formatCurrency(dashboard?.totalExpense)}
                  </h4>
                </div>
              </div>
              <div className="mt-6 border-t border-slate-50 pt-5">
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full bg-[#006d77]"
                    style={{ width: `${budgetRemaining}%` }}
                  />
                </div>
                <p className="mt-2 text-[10px] text-[#506383]">
                  {Math.round(budgetRemaining)}% do orcamento mensal restante
                </p>
              </div>
            </article>

            <article className="rounded-xl bg-[#315ca9] p-6 text-white shadow-xl shadow-blue-900/10 md:col-span-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-white/75">
                    Score Recente
                  </p>
                  <h3 className="mt-1 font-mono text-5xl font-extrabold">
                    {dashboard?.latestScore?.score ?? "-"}
                  </h3>
                </div>
                <span className="flex size-12 items-center justify-center rounded-xl bg-white/10">
                  <ShieldCheck className="size-6" aria-hidden="true" />
                </span>
              </div>
              <div className="mt-7">
                <p className="mb-2 text-xs font-bold uppercase text-white/65">
                  Limite Recomendado
                </p>
                <p className="font-mono text-xl font-bold">
                  {formatCurrency(dashboard?.recommendedLimit)}
                </p>
              </div>
            </article>
          </section>

          <div className="grid grid-cols-1 gap-7 lg:grid-cols-3">
            <section className="space-y-4 lg:col-span-1">
              <div className="flex items-center justify-between">
                <h3 className="font-mono text-xl font-semibold text-slate-950">
                  Contas Conectadas
                </h3>
                <a
                  href="/connect-accounts"
                  className="text-xs font-medium text-[#00766d] hover:underline"
                >
                  Conectar conta
                </a>
              </div>

              <div className="space-y-3">
                {accounts.map((account) => {
                  const displayName =
                    account.marketingName ?? account.name ?? account.type;
                  const initial = displayName.slice(0, 1).toUpperCase();

                  return (
                    <article
                      className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-colors hover:border-[#00766d]"
                      key={account.id}
                    >
                      <div className="flex items-center gap-4">
                        <span className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-[#00766d] text-xl font-bold text-white">
                          {initial}
                        </span>
                        <div className="min-w-0 flex-1">
                          <h4 className="truncate text-sm font-bold text-slate-950">
                            {displayName}
                          </h4>
                          <p className="truncate text-xs text-[#506383]">
                            {account.type}
                            {account.numberMasked
                              ? ` - ${account.numberMasked}`
                              : ""}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-slate-950">
                            {formatCurrency(account.currentBalance)}
                          </p>
                          <span className="rounded-full bg-teal-50 px-2 py-0.5 text-[10px] text-teal-700">
                            {account.status}
                          </span>
                        </div>
                      </div>
                    </article>
                  );
                })}
                {!isLoading && accounts.length === 0 && (
                  <div className="rounded-xl border border-dashed border-slate-200 bg-white p-5 text-sm text-[#506383]">
                    Nenhuma conta conectada ainda.
                  </div>
                )}
              </div>

              <article className="rounded-xl border border-[#bddbdf] bg-[#dff2f2] p-5">
                <h4 className="mb-2 text-sm font-bold text-[#006d77]">
                  Insight: Alta Liquidez
                </h4>
                <p className="text-xs leading-6 text-[#00535b]">
                  Seu saldo atual permite antecipar a fatura da linha Gold e
                  economizar em juros.
                </p>
                <button
                  type="button"
                  className="mt-4 flex items-center gap-1 text-xs font-bold text-[#006d77] hover:underline"
                >
                  Analisar liquidacao
                  <ChevronRight className="size-4" aria-hidden="true" />
                </button>
              </article>
            </section>

            <section className="space-y-4 lg:col-span-2">
              <div className="flex items-center justify-between">
                <h3 className="font-mono text-xl font-semibold text-slate-950">
                  Transacoes Recentes
                </h3>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="flex size-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                    aria-label="Filtrar transacoes"
                  >
                    <Filter className="size-4" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    className="flex size-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                    aria-label="Baixar transacoes"
                  >
                    <ArrowDownToLine className="size-4" aria-hidden="true" />
                  </button>
                </div>
              </div>

              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px] text-left">
                    <thead className="border-b border-slate-200 bg-slate-50">
                      <tr>
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-[0.12em] text-[#506383]">
                          Data
                        </th>
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-[0.12em] text-[#506383]">
                          Descricao
                        </th>
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-[0.12em] text-[#506383]">
                          Categoria
                        </th>
                        <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-[0.12em] text-[#506383]">
                          Valor
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {transactions.map((transaction) => {
                        const isCredit = transaction.type === "CREDIT";
                        const Icon = isCredit ? WalletCards : ShoppingCart;

                        return (
                          <tr
                            className="transition-colors hover:bg-slate-50"
                            key={transaction.id}
                          >
                            <td className="px-6 py-4 text-xs font-medium text-[#506383]">
                              {formatDate(transaction.transactionDate)}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <span className="flex size-8 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                                  <Icon className="size-4" aria-hidden="true" />
                                </span>
                                <span className="text-sm font-bold text-slate-950">
                                  {transaction.description}
                                </span>
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
                            <td className="px-6 py-4 text-right">
                              <span
                                className={
                                  isCredit
                                    ? "text-sm font-bold text-[#00766d]"
                                    : "text-sm font-bold text-red-600"
                                }
                              >
                                {isCredit ? "+" : "-"}{" "}
                                {formatCurrency(transaction.amount)}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                      {!isLoading && transactions.length === 0 && (
                        <tr>
                          <td
                            className="px-6 py-8 text-center text-sm text-[#506383]"
                            colSpan={4}
                          >
                            Nenhuma transacao sincronizada ainda.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                <div className="border-t border-slate-100 p-4 text-center">
                  <button
                    type="button"
                    className="text-xs font-bold text-[#506383] transition-colors hover:text-[#00766d]"
                  >
                    Ver extrato completo
                  </button>
                </div>
              </div>
            </section>
          </div>
        </div>
      </section>

      <nav className="fixed bottom-0 left-0 z-50 w-full rounded-t-2xl border-t border-slate-200 bg-white/95 shadow-[0_-4px_16px_rgba(2,62,138,0.06)] backdrop-blur md:hidden">
        <div className="flex h-20 w-full items-center justify-around px-4">
          {bottomNavItems.map((item) => {
            const Icon = item.icon;

            return (
              <a
                href={item.primary ? "/credit-request" : "/dashboard"}
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
