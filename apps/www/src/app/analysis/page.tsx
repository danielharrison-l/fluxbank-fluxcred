import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  ArrowUpDown,
  BadgeDollarSign,
  BarChart3,
  Bell,
  Building2,
  CreditCard,
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
  TrendingUp,
  User,
  WalletCards,
} from "lucide-react";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiRequest, formatCurrency } from "@/lib/api";

type FinancialMetric = {
  id: string;
  periodStart: string;
  periodEnd: string;
  totalIncome: number | string;
  totalExpense: number | string;
  avgMonthlyIncome: number | string;
  avgDailyIncome: number | string;
  incomeDays: number;
  noIncomeDays: number;
  incomeFrequencyScore: number | string;
  incomeStabilityScore: number | string;
  expenseRatio: number | string;
  averageBalance: number | string;
  minBalance: number | string;
  maxBalance: number | string;
  calculatedAt: string;
};

type CreditScore = {
  score: number;
  recommendedLimit: number | string;
};

const sideNavItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Transações", href: "/transactions", icon: ReceiptText },
  { label: "Análise", href: "/analysis", icon: BarChart3, active: true },
  { label: "Score de Crédito", href: "/credit-score", icon: Gauge },
  { label: "Solicitar Crédito", href: "/credit-request", icon: CreditCard },
  { label: "Instituições", href: "/connect-accounts", icon: Building2 },
];

const mobileNavItems = [
  { label: "Home", href: "/dashboard", icon: Home },
  { label: "Atividade", href: "/transactions", icon: List },
  { label: "Análise", href: "/analysis", icon: BarChart3, active: true },
  { label: "Crédito", href: "/credit-request", icon: CreditCard },
  { label: "Perfil", href: "/dashboard", icon: User },
];

function formatPercent(value: number) {
  return `${Math.round(value)}%`;
}

function formatMonthLabel(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    month: "short",
  })
    .format(new Date(value))
    .replace(".", "")
    .toUpperCase();
}

function ratioStatus(expenseRatio: number) {
  if (expenseRatio <= 0.6) {
    return "Saudável";
  }

  if (expenseRatio <= 0.85) {
    return "Atenção";
  }

  return "Crítico";
}

function stabilityStatus(score: number) {
  if (score >= 85) {
    return { title: "Alta", badge: "Estável" };
  }

  if (score >= 60) {
    return { title: "Boa", badge: "Consistente" };
  }

  if (score >= 40) {
    return { title: "Moderada", badge: "Oscilando" };
  }

  return { title: "Baixa", badge: "Instável" };
}

function flowStatus(score: number) {
  if (score >= 85) {
    return { title: "Ativo", badge: "Frequente" };
  }

  if (score >= 60) {
    return { title: "Bom", badge: "Recorrente" };
  }

  if (score >= 40) {
    return { title: "Irregular", badge: "Variável" };
  }

  return { title: "Fraco", badge: "Baixo volume" };
}

export default function AnalysisPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["analysis-page"],
    queryFn: async () => {
      const [metrics, latestScore] = await Promise.all([
        apiRequest<FinancialMetric[]>("/financial-metrics"),
        apiRequest<CreditScore | null>("/credit-score/latest"),
      ]);

      return {
        metrics,
        latestScore,
      };
    },
  });

  const metrics = data?.metrics ?? [];
  const latestMetric = metrics[0] ?? null;
  const latestScore = data?.latestScore ?? null;

  const chartMetrics = useMemo(
    () => metrics.slice(0, 4).reverse(),
    [metrics],
  );

  const chartMaxValue = useMemo(() => {
    if (!chartMetrics.length) {
      return 1;
    }

    return Math.max(
      ...chartMetrics.flatMap((metric) => [
        Number(metric.totalIncome ?? 0),
        Number(metric.totalExpense ?? 0),
      ]),
      1,
    );
  }, [chartMetrics]);

  const summary = useMemo(() => {
    const totalIncome = Number(latestMetric?.totalIncome ?? 0);
    const totalExpense = Number(latestMetric?.totalExpense ?? 0);
    const expenseRatio = Number(latestMetric?.expenseRatio ?? 0);
    const averageBalance = Number(latestMetric?.averageBalance ?? 0);
    const avgDailyIncome = Number(latestMetric?.avgDailyIncome ?? 0);
    const avgDailyExpense =
      latestMetric && latestMetric.noIncomeDays + latestMetric.incomeDays > 0
        ? totalExpense /
          Math.max(1, latestMetric.noIncomeDays + latestMetric.incomeDays)
        : 0;

    return {
      totalIncome,
      totalExpense,
      expenseRatio,
      averageBalance,
      avgDailyIncome,
      avgDailyExpense,
      incomeStability: Number(latestMetric?.incomeStabilityScore ?? 0),
      incomeFrequency: Number(latestMetric?.incomeFrequencyScore ?? 0),
    };
  }, [latestMetric]);

  const stability = stabilityStatus(summary.incomeStability);
  const flow = flowStatus(summary.incomeFrequency);
  const ratioLabel = ratioStatus(summary.expenseRatio);

  return (
    <main className="min-h-svh bg-[#f7fafa] text-[#181c1d]">
      <aside className="fixed left-0 top-0 z-50 hidden h-svh w-72 border-r border-slate-200 bg-white md:flex md:flex-col">
        <div className="flex h-full flex-col gap-2 p-6">
          <div className="mb-8">
            <h1 className="font-mono text-2xl font-bold text-[#00766d]">
              FluxCred
            </h1>
            <p className="text-xs text-slate-500">Finanças modernas</p>
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
              href="/login"
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
                Análise financeira
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
          <div>
            <h1 className="font-mono text-3xl font-semibold text-[#181c1d]">
              Análise financeira
            </h1>
            <p className="mt-2 max-w-2xl text-base leading-7 text-[#506383]">
              Veja sua saúde financeira em um só lugar com receitas,
              despesas, estabilidade e recomendação de crédito.
            </p>
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error instanceof Error
                ? error.message
                : "Não foi possível carregar a análise."}
            </div>
          )}

          {!isLoading && !latestMetric && (
            <section className="rounded-xl border border-dashed border-slate-200 bg-white p-8 shadow-sm">
              <div className="max-w-xl">
                <h2 className="font-mono text-2xl font-semibold text-[#181c1d]">
                  Ainda não há métricas para analisar
                </h2>
                <p className="mt-3 text-sm leading-7 text-[#506383]">
                  Conecte suas contas e gere métricas financeiras para
                  desbloquear esta visão. Assim o app consegue consolidar
                  receita, despesa, frequência de renda e estabilidade.
                </p>
                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <Button asChild className="h-12 rounded-xl bg-[#00766d] px-5 text-white hover:bg-[#005f58]">
                    <a href="/connect-accounts">Conectar contas</a>
                  </Button>
                  <Button asChild variant="outline" className="h-12 rounded-xl border-slate-300 bg-white px-5 hover:bg-slate-50">
                    <a href="/credit-score">Ver Score</a>
                  </Button>
                </div>
              </div>
            </section>
          )}

          {latestMetric && (
            <>
              <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="mb-4 flex items-center gap-3">
                    <span className="flex size-10 items-center justify-center rounded-xl bg-[#e8f7f4] text-[#00766d]">
                      <TrendingUp className="size-5" aria-hidden="true" />
                    </span>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#00766d]">
                        Receita total
                      </p>
                    </div>
                  </div>
                  <h3 className="font-mono text-2xl font-semibold text-[#005f8f]">
                    {formatCurrency(summary.totalIncome)}
                  </h3>
                  <p className="mt-3 text-sm text-[#506383]">
                    Último período calculado
                  </p>
                </article>

                <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="mb-4 flex items-center gap-3">
                    <span className="flex size-10 items-center justify-center rounded-xl bg-[#eef2ff] text-[#315ca9]">
                      <BadgeDollarSign className="size-5" aria-hidden="true" />
                    </span>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#315ca9]">
                        Despesas totais
                      </p>
                    </div>
                  </div>
                  <h3 className="font-mono text-2xl font-semibold text-[#315ca9]">
                    {formatCurrency(summary.totalExpense)}
                  </h3>
                  <p className="mt-3 text-sm text-[#506383]">Últimos 30 dias</p>
                </article>

                <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#181c1d]">
                    Índice de gastos
                  </p>
                  <div className="mt-3 flex items-end gap-2">
                    <h3 className="font-mono text-3xl font-semibold text-[#181c1d]">
                      {formatPercent(summary.expenseRatio * 100)}
                    </h3>
                    <span className="pb-1 text-sm font-medium text-[#14b8a6]">
                      {ratioLabel}
                    </span>
                  </div>
                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-[#00766d]"
                      style={{
                        width: `${Math.max(
                          0,
                          Math.min(100, summary.expenseRatio * 100),
                        )}%`,
                      }}
                    />
                  </div>
                </article>

                <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#181c1d]">
                    Saldo médio
                  </p>
                  <h3 className="mt-3 font-mono text-2xl font-semibold text-[#181c1d]">
                    {formatCurrency(summary.averageBalance)}
                  </h3>
                  <p className="mt-3 text-sm text-[#506383]">
                    Mantido no período
                  </p>
                </article>

                <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#181c1d]">
                    Médias diárias
                  </p>
                  <div className="mt-4 grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-[#506383]">Entrada média</p>
                      <p className="mt-1 font-mono text-lg font-semibold text-[#005f8f]">
                        {formatCurrency(summary.avgDailyIncome)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-[#506383]">Saída média</p>
                      <p className="mt-1 font-mono text-lg font-semibold text-[#315ca9]">
                        {formatCurrency(summary.avgDailyExpense)}
                      </p>
                    </div>
                  </div>
                </article>
              </section>

              <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
                <article className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h2 className="font-mono text-xl font-semibold text-[#181c1d]">
                        Fluxo financeiro
                      </h2>
                      <p className="text-sm text-[#506383]">
                        Comparação entre receita e despesa nos períodos mais
                        recentes.
                      </p>
                    </div>
                    <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-[0.12em] text-[#506383]">
                      <span className="flex items-center gap-2">
                        <span className="size-2.5 rounded-full bg-[#0f7b88]" />
                        Receita
                      </span>
                      <span className="flex items-center gap-2">
                        <span className="size-2.5 rounded-full bg-[#9ab8ff]" />
                        Despesas
                      </span>
                    </div>
                  </div>

                  <div className="flex min-h-[320px] items-end justify-between gap-4 rounded-xl border border-slate-100 bg-slate-50/50 px-4 py-6">
                    {chartMetrics.map((metric) => {
                      const incomeHeight = Math.max(
                        24,
                        (Number(metric.totalIncome ?? 0) / chartMaxValue) * 180,
                      );
                      const expenseHeight = Math.max(
                        18,
                        (Number(metric.totalExpense ?? 0) / chartMaxValue) * 180,
                      );

                      return (
                        <div
                          key={metric.id}
                          className="flex flex-1 flex-col items-center gap-3"
                        >
                          <div className="flex h-[220px] items-end gap-3">
                            <div className="flex flex-col items-center gap-2">
                              <div
                                className="w-6 rounded-t-md bg-[#0f7b88]"
                                style={{ height: `${incomeHeight}px` }}
                              />
                            </div>
                            <div className="flex flex-col items-center gap-2">
                              <div
                                className="w-6 rounded-t-md bg-[#9ab8ff]"
                                style={{ height: `${expenseHeight}px` }}
                              />
                            </div>
                          </div>
                          <div className="space-y-1 text-center">
                            <p className="text-xs font-bold text-[#506383]">
                              {formatMonthLabel(metric.periodEnd)}
                            </p>
                            <p className="text-[11px] text-slate-400">
                              {formatCurrency(metric.totalIncome)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </article>

                <aside className="space-y-6">
                  <article className="rounded-xl border-l-4 border-[#14b8a6] bg-white p-6 shadow-sm">
                    <div className="mb-4 flex items-center gap-3 text-[#00766d]">
                      <ShieldCheck className="size-5" aria-hidden="true" />
                      <span className="text-sm font-semibold">
                        Estabilidade da renda
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <h3 className="font-mono text-4xl font-semibold text-[#00766d]">
                        {stability.title}
                      </h3>
                      <span className="rounded-full bg-[#e8f7f4] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.08em] text-[#00766d]">
                        {stability.badge}
                      </span>
                    </div>
                    <p className="mt-4 text-sm leading-7 text-[#506383]">
                      Seus depósitos mostram um padrão de{" "}
                      {stability.badge.toLowerCase()}, o que ajuda na leitura
                      de risco e na recomendação de limite.
                    </p>
                  </article>

                  <article className="rounded-xl border-l-4 border-[#315ca9] bg-white p-6 shadow-sm">
                    <div className="mb-4 flex items-center gap-3 text-[#315ca9]">
                      <Activity className="size-5" aria-hidden="true" />
                      <span className="text-sm font-semibold">
                        Movimentação
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <h3 className="font-mono text-4xl font-semibold text-[#315ca9]">
                        {flow.title}
                      </h3>
                      <span className="rounded-full bg-[#eef2ff] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.08em] text-[#315ca9]">
                        {flow.badge}
                      </span>
                    </div>
                    <p className="mt-4 text-sm leading-7 text-[#506383]">
                      A frequência das entradas e saídas mostra como o dinheiro
                      circula nas suas contas ao longo do período.
                    </p>
                  </article>

                  <article className="rounded-xl bg-[#005f66] p-6 text-white shadow-xl">
                    <div className="mb-4 flex items-center gap-3">
                      <ArrowUpDown className="size-5" aria-hidden="true" />
                      <span className="text-sm font-semibold">
                        Limite recomendado
                      </span>
                    </div>
                    <h3 className="font-mono text-3xl font-semibold">
                      {formatCurrency(latestScore?.recommendedLimit)}
                    </h3>
                    <p className="mt-4 text-sm leading-7 text-white/85">
                      Score atual: {latestScore?.score ?? "-"}.
                      {latestScore
                        ? " Este valor considera sua renda média, estabilidade e saldo disponível."
                        : " Calcule seu score para liberar uma recomendação de crédito."}
                    </p>
                    <Button
                      asChild
                      className="mt-6 h-11 w-full rounded-xl bg-white text-[#005f66] hover:bg-white/90"
                    >
                      <a href="/credit-request">Solicitar crédito</a>
                    </Button>
                  </article>
                </aside>
              </section>
            </>
          )}
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
                  item.active
                    ? "flex scale-110 flex-col items-center justify-center text-[#00766d]"
                    : "flex flex-col items-center justify-center text-slate-400"
                }
              >
                <Icon className="size-5" aria-hidden="true" />
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
