import { useQuery } from "@tanstack/react-query";
import {
  BadgeCheck,
  Banknote,
  BarChart3,
  Bell,
  Building2,
  CalendarDays,
  Check,
  CreditCard,
  Gauge,
  Home,
  LayoutDashboard,
  List,
  Lock,
  LogOut,
  ReceiptText,
  Search,
  Settings,
  ShieldCheck,
  User,
  WalletCards,
} from "lucide-react";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiRequest, formatCurrency } from "@/lib/api";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard },
  { label: "Transações", icon: ReceiptText },
  { label: "Análise", icon: BarChart3 },
  { label: "Score de Crédito", icon: Gauge, active: true },
  { label: "Solicitar Crédito", icon: CreditCard },
  { label: "Instituições", icon: Building2 },
];

const bottomNavItems = [
  { label: "Home", icon: Home },
  { label: "Atividade", icon: List },
  { label: "Crédito", icon: BadgeCheck, active: true },
  { label: "Análise", icon: BarChart3 },
  { label: "Perfil", icon: User },
];

type CreditDecision = "APPROVED" | "MANUAL_REVIEW" | "REJECTED";

type CreditScore = {
  score: number;
  decision: CreditDecision;
  recommendedLimit: number | string;
  incomeFrequencyPoints: number;
  incomeStabilityPoints: number;
  cashflowPoints: number;
  balancePoints: number;
  riskPenalty: number;
  explanation: string;
};

type FinancialMetric = {
  incomeFrequencyScore: number | string;
  incomeStabilityScore: number | string;
  expenseRatio: number | string;
  averageBalance: number | string;
};

function decisionLabel(decision?: CreditDecision) {
  if (decision === "APPROVED") {
    return "Aprovado";
  }

  if (decision === "MANUAL_REVIEW") {
    return "Em análise";
  }

  if (decision === "REJECTED") {
    return "Negado";
  }

  return "Sem score";
}

function factorRating(value: number) {
  if (value >= 80) {
    return "Excelente";
  }

  if (value >= 60) {
    return "Bom";
  }

  if (value >= 40) {
    return "Regular";
  }

  return "Baixo";
}

export default function CreditScorePage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["credit-score-page"],
    queryFn: async () => {
      const [latestScore, latestMetric] = await Promise.all([
        apiRequest<CreditScore | null>("/credit-score/latest"),
        apiRequest<FinancialMetric | null>("/financial-metrics/latest"),
      ]);

      return { score: latestScore, metric: latestMetric };
    },
  });

  const score = data?.score ?? null;
  const metric = data?.metric ?? null;

  const factors = useMemo(() => {
    const incomeFrequency = Number(metric?.incomeFrequencyScore ?? 0);
    const incomeStability = Number(metric?.incomeStabilityScore ?? 0);
    const expenseRatio = Number(metric?.expenseRatio ?? 0);
    const spendingControl = Math.max(
      0,
      Math.min(100, (1 - expenseRatio) * 100),
    );
    const averageBalance = Number(metric?.averageBalance ?? 0);
    const balanceScore = Math.max(0, Math.min(100, averageBalance / 20));

    return [
      {
        title: "Frequência de Renda",
        rating: factorRating(incomeFrequency),
        description:
          "Calculado a partir da recorrência de entradas no período.",
        icon: CalendarDays,
        value: incomeFrequency,
      },
      {
        title: "Estabilidade",
        rating: factorRating(incomeStability),
        description: "Calculado pela estabilidade da renda conectada.",
        icon: ShieldCheck,
        value: incomeStability,
      },
      {
        title: "Controle de Gastos",
        rating: factorRating(spendingControl),
        description: "Calculado pela relação entre despesas e receitas.",
        icon: WalletCards,
        value: spendingControl,
      },
      {
        title: "Saldo Médio",
        rating: factorRating(balanceScore),
        description: "Calculado a partir do saldo médio das contas conectadas.",
        icon: Banknote,
        value: balanceScore,
      },
    ];
  }, [metric]);

  const scoreValue = score?.score ?? 0;
  const progressDegrees = Math.max(0, Math.min(360, (scoreValue / 1000) * 360));

  return (
    <main className="min-h-svh bg-[#f7fafa] text-[#102a43]">
      <aside className="fixed left-0 top-0 z-50 hidden h-svh w-72 flex-col border-r border-slate-200 bg-white p-6 md:flex">
        <div className="mb-8">
          <h1 className="font-mono text-2xl font-bold text-[#00766d]">
            FluxCred
          </h1>
        </div>

        <nav className="flex-1 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;

            return (
              <a
                href={
                  item.icon === LayoutDashboard
                    ? "/dashboard"
                    : item.icon === ReceiptText
                      ? "/transactions"
                      : item.icon === BarChart3
                        ? "/analysis"
                        : item.icon === Gauge
                          ? "/credit-score"
                          : item.icon === CreditCard
                            ? "/credit-request"
                            : "/connect-accounts"
                }
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
          <a
            href="/credit-score"
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
      </aside>

      <section className="min-h-svh pb-28 md:ml-72 md:pb-8">
        <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/85 shadow-sm backdrop-blur">
          <div className="flex h-16 items-center justify-between px-5 md:px-8">
            <div>
              <span className="font-mono text-xl font-extrabold text-[#00766d] md:hidden">
                FluxCred
              </span>
              <h2 className="hidden font-mono text-lg font-semibold text-slate-600 md:block">
                Análise de Score
              </h2>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative hidden sm:block">
                <Search
                  className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400"
                  aria-hidden="true"
                />
                <Input
                  placeholder="Buscar..."
                  className="h-10 w-48 rounded-full border-0 bg-slate-100 pl-10 shadow-none focus-visible:ring-[#00766d] lg:w-64"
                />
              </div>
              <button
                type="button"
                className="flex size-9 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100"
                aria-label="Notificações"
              >
                <Bell className="size-5" aria-hidden="true" />
              </button>
              <div className="flex size-9 items-center justify-center rounded-full bg-[#00766d] text-xs font-bold text-white">
                JD
              </div>
            </div>
          </div>
        </header>

        <div className="mx-auto grid max-w-[1120px] gap-6 p-5 md:p-8 lg:grid-cols-12">
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 lg:col-span-12">
              {error instanceof Error
                ? error.message
                : "Não foi possível carregar."}
            </div>
          )}

          <section className="space-y-6 lg:col-span-8">
            <article className="grid gap-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm md:grid-cols-[220px_1fr] md:p-8">
              <div className="flex items-center justify-center">
                <div className="relative size-56">
                  <div className="absolute inset-0 rounded-full border-[18px] border-slate-100" />
                  <div
                    className="absolute inset-0 rounded-full border-[18px] border-[#007d82] border-l-transparent"
                    style={{ transform: `rotate(${progressDegrees}deg)` }}
                  />
                  <div className="absolute inset-10 flex flex-col items-center justify-center rounded-full bg-white">
                    <span className="font-mono text-5xl font-semibold text-slate-950">
                      {isLoading ? "..." : (score?.score ?? "-")}
                    </span>
                    <span className="text-sm text-[#8a9ab2]">de 1000</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col justify-center">
                <div className="mb-7 flex flex-wrap gap-3">
                  <span className="rounded-full bg-emerald-100 px-4 py-2 text-sm font-medium text-emerald-700">
                    {decisionLabel(score?.decision)}
                  </span>
                  <span className="rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-300">
                    Em análise
                  </span>
                  <span className="rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-300">
                    Negado
                  </span>
                </div>

                <p className="mb-5 text-base text-slate-950">
                  {score
                    ? "Seu perfil financeiro foi analisado"
                    : "Score ainda não calculado"}
                </p>
                <div className="rounded-lg border-l-4 border-[#007d82] bg-slate-100 p-5">
                  <p className="text-sm leading-7 text-[#506383]">
                    {score?.explanation ??
                      "Conecte suas contas e calcule as métricas financeiras para gerar seu score de crédito."}
                  </p>
                </div>
              </div>
            </article>

            <div className="grid gap-5 md:grid-cols-2">
              {factors.map((factor) => {
                const Icon = factor.icon;

                return (
                  <article
                    className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
                    key={factor.title}
                  >
                    <div className="flex gap-5">
                      <span className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-[#e5f8f5] text-[#00766d]">
                        <Icon className="size-6" aria-hidden="true" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="mb-3 flex items-center justify-between gap-3">
                          <h3 className="text-sm font-bold text-slate-950">
                            {factor.title}
                          </h3>
                          <span className="text-xs font-bold text-emerald-700">
                            {factor.rating}
                          </span>
                        </div>
                        <div className="mb-3 h-2 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-[#007d82]"
                            style={{
                              width: `${Math.max(0, Math.min(100, factor.value))}%`,
                            }}
                          />
                        </div>
                        <p className="text-xs leading-5 text-[#506383]">
                          {factor.description}
                        </p>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          <aside className="space-y-6 lg:col-span-4">
            <article className="relative overflow-hidden rounded-xl bg-[#007d82] p-8 text-white shadow-xl">
              <div className="relative z-10">
                <p className="mb-3 text-sm font-bold uppercase tracking-[0.18em] text-[#9ff0fb]">
                  Limite recomendado
                </p>
                <p className="font-mono text-4xl font-semibold">
                  {formatCurrency(score?.recommendedLimit)}
                </p>
                <p className="mt-7 text-sm font-semibold leading-6">
                  {score
                    ? `Baseado no seu score de ${score.score}, essa é a oferta disponível no momento.`
                    : "Calcule seu score para visualizar uma oferta de crédito."}
                </p>
                <Button
                  asChild
                  className="mt-8 h-14 w-full rounded-lg bg-white font-bold text-[#007d82] hover:bg-white/90"
                >
                  <a href="/credit-request">Solicitar aumento</a>
                </Button>
              </div>
              <Gauge
                className="absolute -right-8 top-8 size-36 text-white/10"
                aria-hidden="true"
              />
            </article>

            <article className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="mb-5 font-mono text-lg font-semibold text-slate-950">
                Próximos Passos
              </h3>
              <div className="space-y-5">
                {[
                  {
                    text: score
                      ? "Score calculado com dados financeiros reais"
                      : "Calcule seu score de crédito",
                    done: Boolean(score),
                  },
                  {
                    text: metric
                      ? "Métricas financeiras disponíveis"
                      : "Calcule suas métricas financeiras",
                    done: Boolean(metric),
                  },
                  {
                    text: "Mantenha o Open Finance sincronizado",
                    locked: !score,
                  },
                ].map((step) => (
                  <div className="flex gap-3" key={step.text}>
                    <span
                      className={
                        step.locked
                          ? "flex size-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-300"
                          : "flex size-6 shrink-0 items-center justify-center rounded-full bg-[#e5f8f5] text-[#00766d]"
                      }
                    >
                      {step.locked ? (
                        <Lock className="size-3.5" aria-hidden="true" />
                      ) : (
                        <Check className="size-3.5" aria-hidden="true" />
                      )}
                    </span>
                    <p
                      className={
                        step.locked
                          ? "text-sm leading-6 text-slate-400"
                          : "text-sm leading-6 text-[#506383]"
                      }
                    >
                      {step.text}
                    </p>
                  </div>
                ))}
              </div>
            </article>
          </aside>
        </div>
      </section>

      <nav className="fixed bottom-0 left-0 z-50 flex w-full items-center justify-around rounded-t-2xl border-t border-slate-200 bg-white/95 px-3 py-3 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] backdrop-blur md:hidden">
        {bottomNavItems.map((item) => {
          const Icon = item.icon;

          return (
            <a
              href={
                item.icon === Home
                  ? "/dashboard"
                  : item.icon === List
                    ? "/transactions"
                    : item.icon === BarChart3
                      ? "/analysis"
                      : item.icon === BadgeCheck
                        ? "/credit-score"
                        : "/dashboard"
              }
              key={item.label}
              className={
                item.active
                  ? "flex flex-col items-center rounded-xl bg-[#e8f7f4] px-3 py-1 text-[#00766d]"
                  : "flex flex-col items-center px-2 py-1 text-slate-400"
              }
            >
              <Icon className="size-5" aria-hidden="true" />
              <span className="mt-1 text-[10px] font-bold tracking-tight">
                {item.label}
              </span>
            </a>
          );
        })}
      </nav>
    </main>
  );
}

