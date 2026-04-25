import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BarChart3,
  Bell,
  Building2,
  CheckCircle2,
  CreditCard,
  CircleDollarSign,
  Clock3,
  Gauge,
  HelpCircle,
  Home,
  Info,
  LayoutDashboard,
  List,
  LogOut,
  ReceiptText,
  Search,
  Settings,
  ShieldCheck,
  User,
  WalletCards,
  XCircle,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiRequest, formatCurrency, formatDate } from "@/lib/api";

const sideNavItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Transações", href: "/transactions", icon: ReceiptText },
  { label: "Análise", href: "/analysis", icon: BarChart3 },
  { label: "Credit Score", href: "/credit-score", icon: Gauge },
  {
    label: "Solicitar crédito",
    href: "/credit-request",
    icon: WalletCards,
    active: true,
  },
  { label: "Instituições", href: "/connect-accounts", icon: Building2 },
];

const mobileNavItems = [
  { label: "Home", href: "/dashboard", icon: Home },
  { label: "Atividade", href: "/transactions", icon: List },
  { label: "Análise", href: "/analysis", icon: CreditCard },
  {
    label: "Crédito",
    href: "/credit-request",
    icon: WalletCards,
    active: true,
  },
  { label: "Perfil", href: "/dashboard", icon: User },
];

type CreditScore = {
  recommendedLimit: number | string;
  score: number;
};

type CreditRequest = {
  id: string;
  requestedAmount: number | string;
  approvedAmount?: number | string | null;
  status: "REQUESTED" | "APPROVED" | "REVIEW" | "REJECTED" | "CANCELLED";
  requestedAt: string;
  explanation?: string;
};

function parseCurrencyInput(value: string) {
  const normalizedValue = value.replace(/\./g, "").replace(",", ".");
  return Number(normalizedValue);
}

function formatAmountInput(value: string) {
  const digits = value.replace(/\D/g, "");

  if (!digits) {
    return "";
  }

  const numericValue = Number(digits) / 100;

  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numericValue);
}

function getRequestStatusMeta(status: CreditRequest["status"]) {
  switch (status) {
    case "APPROVED":
      return {
        title: "Crédito aprovado",
        badge: "Aprovado",
        summary: "O valor aprovado já pode ser liberado na sua conta FluxCred.",
        rowClassName: "bg-emerald-50 text-emerald-700",
        cardClassName: "border-emerald-200 bg-emerald-50 text-emerald-800",
        icon: CheckCircle2,
      };
    case "REVIEW":
    case "REQUESTED":
      return {
        title: "Em análise",
        badge: "Em análise",
        summary: "Sua solicitação está em revisão e pode exigir validação adicional.",
        rowClassName: "bg-amber-50 text-amber-700",
        cardClassName: "border-amber-200 bg-amber-50 text-amber-800",
        icon: Clock3,
      };
    case "CANCELLED":
      return {
        title: "Cancelada",
        badge: "Cancelada",
        summary: "A solicitação foi cancelada antes da conclusão da análise.",
        rowClassName: "bg-slate-100 text-slate-600",
        cardClassName: "border-slate-200 bg-slate-50 text-slate-700",
        icon: Info,
      };
    default:
      return {
        title: "Não aprovada",
        badge: "Negado",
        summary:
          "No momento, não foi possível liberar esse valor com base no perfil atual.",
        rowClassName: "bg-slate-100 text-slate-500",
        cardClassName: "border-slate-200 bg-slate-50 text-slate-700",
        icon: XCircle,
      };
  }
}

export default function CreditRequestPage() {
  const [requestedAmount, setRequestedAmount] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["credit-request-page"],
    queryFn: async () => {
      const [latestScore, creditRequests] = await Promise.all([
        apiRequest<CreditScore | null>("/credit-score/latest"),
        apiRequest<CreditRequest[]>("/credit-requests"),
      ]);

      return {
        latestScore,
        creditRequests,
      };
    },
  });

  const createCreditRequest = useMutation({
    mutationFn: (amount: number) =>
      apiRequest<CreditRequest>("/credit-requests", {
        method: "POST",
        body: JSON.stringify({ requestedAmount: amount }),
      }),
    onSuccess: () => {
      setRequestedAmount("");
      setValidationError(null);
      queryClient.invalidateQueries({ queryKey: ["credit-request-page"] });
    },
  });

  const latestScore = data?.latestScore ?? null;
  const requests = data?.creditRequests ?? [];

  const sortedRequests = useMemo(
    () =>
      [...requests].sort(
        (left, right) =>
          new Date(right.requestedAt).getTime() -
          new Date(left.requestedAt).getTime(),
      ),
    [requests],
  );

  const latestRequest = sortedRequests[0] ?? null;

  const limitUsage = useMemo(() => {
    const recommendedLimit = Number(latestScore?.recommendedLimit ?? 0);
    const latestRequestedAmount = Number(latestRequest?.requestedAmount ?? 0);

    if (!recommendedLimit || !latestRequestedAmount) {
      return 0;
    }

    return Math.max(0, Math.min(100, (latestRequestedAmount / recommendedLimit) * 100));
  }, [latestRequest, latestScore]);

  const submitError =
    validationError ??
    (error instanceof Error
      ? error.message
      : createCreditRequest.error instanceof Error
        ? createCreditRequest.error.message
        : null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setValidationError(null);

    const normalizedAmount = parseCurrencyInput(requestedAmount);

    if (!Number.isFinite(normalizedAmount) || normalizedAmount <= 0) {
      setValidationError("Informe um valor válido para solicitar crédito.");
      return;
    }

    await createCreditRequest.mutateAsync(normalizedAmount);
  }

  return (
    <main className="min-h-svh bg-[#f7fafa] text-[#181c1d]">
      <aside className="fixed left-0 top-0 z-40 hidden h-svh w-72 border-r border-slate-200 bg-white md:flex md:flex-col">
        <div className="flex h-full flex-col gap-2 p-6 pt-20">
          <div className="mb-8 px-2">
            <h2 className="font-mono text-2xl font-bold text-[#00766d]">
              FluxCred
            </h2>
            <p className="text-xs text-slate-500">Corporate Modern Finance</p>
          </div>

          <nav className="space-y-1">
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
                  <span>{item.label}</span>
                </a>
              );
            })}
          </nav>

          <div className="mt-auto space-y-1 border-t border-slate-100 pt-5">
            <Button className="mb-4 h-12 w-full rounded-xl bg-[#00766d] text-sm font-bold text-white hover:bg-[#005f58]">
              Nova solicitação
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
        <header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b border-slate-200 bg-white/85 px-5 shadow-sm backdrop-blur md:px-8">
          <div className="flex items-center gap-4">
            <span className="font-mono text-xl font-extrabold text-[#00766d] md:hidden">
              FluxCred
            </span>
            <div className="relative hidden md:block">
              <Search
                className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400"
                aria-hidden="true"
              />
              <Input
                placeholder="Buscar dados..."
                className="h-10 w-72 rounded-full border-0 bg-slate-100 pl-10 shadow-none focus-visible:ring-[#00766d]"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              className="flex size-9 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100"
              aria-label="Notificações"
            >
              <Bell className="size-5" aria-hidden="true" />
            </button>
            <button
              type="button"
              className="flex size-9 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100"
              aria-label="Ajuda"
            >
              <HelpCircle className="size-5" aria-hidden="true" />
            </button>
            <div className="ml-1 flex size-9 items-center justify-center rounded-full bg-[#00766d] text-white">
              <User className="size-5" aria-hidden="true" />
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-[1280px] space-y-6 p-5 md:p-8">
          <div>
            <h1 className="font-mono text-3xl font-semibold text-[#181c1d] md:text-4xl">
              Solicitar crédito
            </h1>
            <p className="mt-2 max-w-2xl text-base leading-7 text-[#506383]">
              Solicite financiamento com as melhores taxas para o seu momento
              financeiro.
            </p>
          </div>

          {submitError && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {submitError}
            </div>
          )}

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
            <div className="space-y-6">
              <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
                <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_240px]">
                  <div>
                    <span className="inline-flex rounded-full bg-[#d9fbf5] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-[#00766d]">
                      Simulação de crédito
                    </span>
                    <h2 className="mt-5 font-mono text-3xl font-semibold leading-tight text-[#181c1d]">
                      Quanto você precisa?
                    </h2>
                  </div>

                  <div className="md:text-right">
                    <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#506383]">
                      Limite recomendado
                    </p>
                    <p className="mt-2 font-mono text-4xl font-bold text-[#00766d]">
                      {isLoading ? "..." : formatCurrency(latestScore?.recommendedLimit)}
                    </p>
                  </div>
                </div>

                <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
                  <div className="space-y-2">
                    <label
                      htmlFor="requestedAmount"
                      className="text-sm font-medium text-[#506383]"
                    >
                      Valor solicitado
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-[#6f85a7]">
                        R$
                      </span>
                      <Input
                        id="requestedAmount"
                        name="requestedAmount"
                        inputMode="numeric"
                        placeholder="0,00"
                        value={requestedAmount}
                        onChange={(event) =>
                          setRequestedAmount(formatAmountInput(event.target.value))
                        }
                        className="h-16 rounded-xl border-slate-200 pl-14 text-3xl font-semibold text-[#506383] shadow-none placeholder:text-[#8ea0b8] focus-visible:ring-[#00766d]"
                      />
                    </div>
                  </div>

                  <p className="flex items-start gap-2 text-xs leading-5 text-[#506383]">
                    <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                    O valor solicitado será analisado em até 24 horas úteis.
                  </p>

                  <Button
                    disabled={createCreditRequest.isPending || !latestScore}
                    className="h-14 w-full rounded-xl bg-[#00766d] text-base font-bold text-white hover:bg-[#005f58]"
                  >
                    <CircleDollarSign className="size-5" aria-hidden="true" />
                    {createCreditRequest.isPending
                      ? "Enviando solicitação..."
                      : "Solicitar crédito"}
                  </Button>
                </form>
              </section>

              <section className="space-y-4">
                <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-[#8a9ab2]">
                  Exemplos de status
                </h2>

                <article className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
                  <div className="flex gap-4">
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white">
                      <CheckCircle2 className="size-6" aria-hidden="true" />
                    </span>
                    <div>
                      <h3 className="font-semibold text-emerald-800">
                        Crédito aprovado
                      </h3>
                      <p className="mt-1 text-sm leading-6 text-emerald-700">
                        O valor aprovado fica disponível para liberação após a
                        validação final da operação.
                      </p>
                    </div>
                  </div>
                </article>

                <article className="rounded-xl border border-amber-200 bg-amber-50 p-5">
                  <div className="flex gap-4">
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-amber-500 text-white">
                      <Clock3 className="size-6" aria-hidden="true" />
                    </span>
                    <div>
                      <h3 className="font-semibold text-amber-800">
                        Em análise
                      </h3>
                      <p className="mt-1 text-sm leading-6 text-amber-700">
                        Sua solicitação pode exigir revisão manual e uma nova
                        conferência dos indicadores financeiros.
                      </p>
                    </div>
                  </div>
                </article>

                <article className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                  <div className="flex gap-4">
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-slate-400 text-white">
                      <XCircle className="size-6" aria-hidden="true" />
                    </span>
                    <div>
                      <h3 className="font-semibold text-slate-800">
                        Solicitação não aprovada
                      </h3>
                      <p className="mt-1 text-sm leading-6 text-slate-600">
                        Quando o valor solicitado excede o perfil atual, a
                        recomendação é reavaliar o montante ou aguardar novo
                        ciclo de análise.
                      </p>
                    </div>
                  </div>
                </article>
              </section>
            </div>

            <aside className="space-y-6">
              <section className="rounded-xl bg-[#0b7a80] p-6 text-white shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="font-mono text-2xl font-semibold">
                      Potencialize seu negócio
                    </h2>
                    <p className="mt-3 text-sm leading-7 text-white/85">
                      Seu score atual permite acessar taxas reduzidas para
                      pedidos alinhados ao seu limite recomendado.
                    </p>
                  </div>
                  <ShieldCheck className="size-6 shrink-0 text-white/80" aria-hidden="true" />
                </div>

                <div className="mt-6 rounded-xl bg-white/10 p-4">
                  <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-[0.14em] text-white/85">
                    <span>Utilização do limite</span>
                    <span>{Math.round(limitUsage)}%</span>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/15">
                    <div
                      className="h-full rounded-full bg-white"
                      style={{ width: `${limitUsage}%` }}
                    />
                  </div>
                  <div className="mt-4 flex items-end justify-between gap-4">
                    <div>
                      <p className="text-xs text-white/70">Score atual</p>
                      <p className="font-mono text-3xl font-bold">
                        {latestScore?.score ?? "--"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-white/70">Limite sugerido</p>
                      <p className="font-mono text-xl font-semibold">
                        {formatCurrency(latestScore?.recommendedLimit)}
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-5 flex items-center justify-between gap-4">
                  <h2 className="text-xs font-bold uppercase tracking-[0.16em] text-[#181c1d]">
                    Histórico recente
                  </h2>
                  <a
                    href="#history"
                    className="text-xs font-semibold text-[#00766d] hover:underline"
                  >
                    Ver todos
                  </a>
                </div>

                <div className="space-y-4" id="history">
                  {sortedRequests.slice(0, 4).map((request) => {
                    const meta = getRequestStatusMeta(request.status);

                    return (
                      <article
                        key={request.id}
                        className="grid grid-cols-[1fr_auto_auto] items-start gap-3 border-b border-slate-100 pb-4 last:border-b-0 last:pb-0"
                      >
                        <div>
                          <p className="text-sm font-medium text-[#506383]">
                            {formatDate(request.requestedAt)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-[#181c1d]">
                            {formatCurrency(request.requestedAmount)}
                          </p>
                        </div>
                        <span
                          className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-[0.1em] ${meta.rowClassName}`}
                        >
                          {meta.badge}
                        </span>
                      </article>
                    );
                  })}

                  {!isLoading && sortedRequests.length === 0 && (
                    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-[#506383]">
                      Nenhuma solicitação registrada até agora.
                    </div>
                  )}
                </div>
              </section>
            </aside>
          </div>

          {sortedRequests.length > 0 && (
            <section className="space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-[#8a9ab2]">
                Histórico detalhado
              </h2>

              <div className="space-y-4">
                {sortedRequests.map((request) => {
                  const meta = getRequestStatusMeta(request.status);
                  const Icon = meta.icon;

                  return (
                    <article
                      key={request.id}
                      className={`rounded-xl border p-5 ${meta.cardClassName}`}
                    >
                      <div className="flex gap-4">
                        <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-current/10">
                          <Icon className="size-6" aria-hidden="true" />
                        </span>
                        <div className="min-w-0">
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <h3 className="font-semibold">{meta.title}</h3>
                            <span className="text-xs font-semibold uppercase tracking-[0.12em]">
                              {formatDate(request.requestedAt)}
                            </span>
                          </div>
                          <p className="mt-2 text-sm leading-6">
                            Valor solicitado:{" "}
                            <strong>{formatCurrency(request.requestedAmount)}</strong>
                            {request.approvedAmount && (
                              <>
                                {" "}
                                · Valor aprovado:{" "}
                                <strong>{formatCurrency(request.approvedAmount)}</strong>
                              </>
                            )}
                          </p>
                          <p className="mt-1 text-sm leading-6">
                            {request.explanation || meta.summary}
                          </p>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      </section>

      <nav className="fixed bottom-0 left-0 z-50 w-full rounded-t-2xl border-t border-slate-200 bg-white/95 shadow-[0_-4px_16px_rgba(2,62,138,0.06)] backdrop-blur md:hidden">
        <div className="flex h-20 items-center justify-around px-4">
          {mobileNavItems.map((item) => {
            const Icon = item.icon;

            return (
              <a
                key={item.label}
                href={item.href}
                className={
                  item.active
                    ? "flex flex-col items-center justify-center text-[#00766d]"
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
