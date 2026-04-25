import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BadgeCheck,
  BarChart3,
  Bell,
  Building2,
  CheckCircle2,
  CircleDollarSign,
  Clock,
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
  User,
  WalletCards,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiRequest, formatCurrency, formatDate } from "@/lib/api";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard },
  { label: "Transacoes", icon: ReceiptText },
  { label: "Analise", icon: BarChart3 },
  { label: "Score de Credito", icon: Gauge },
  { label: "Solicitar Credito", icon: WalletCards, active: true },
  { label: "Instituicoes", icon: Building2 },
];

const bottomNavItems = [
  { label: "Home", icon: Home },
  { label: "Atividade", icon: List },
  { label: "Analise", icon: BarChart3 },
  { label: "Credito", icon: BadgeCheck, active: true },
  { label: "Perfil", icon: User },
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

function statusView(status: CreditRequest["status"]) {
  if (status === "APPROVED") {
    return {
      title: "Credito Aprovado",
      icon: CheckCircle2,
      className: "border-emerald-200 bg-emerald-50 text-emerald-700",
    };
  }

  if (status === "REVIEW" || status === "REQUESTED") {
    return {
      title: "Em Analise",
      icon: Clock,
      className: "border-amber-200 bg-amber-50 text-amber-700",
    };
  }

  return {
    title: status === "CANCELLED" ? "Cancelado" : "Credito Negado",
    icon: Info,
    className: "border-red-200 bg-red-50 text-red-700",
  };
}

export default function CreditRequestPage() {
  const [requestedAmount, setRequestedAmount] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const {
    data,
    isLoading,
    error: loadError,
  } = useQuery({
    queryKey: ["credit-request-page"],
    queryFn: async () => {
      const [latestScore, creditRequests] = await Promise.all([
        apiRequest<CreditScore | null>("/credit-score/latest"),
        apiRequest<CreditRequest[]>("/credit-requests"),
      ]);

      return { score: latestScore, requests: creditRequests };
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
      queryClient.invalidateQueries({ queryKey: ["credit-request-page"] });
    },
  });

  const score = data?.score ?? null;
  const requests = data?.requests ?? [];

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setValidationError(null);

    try {
      const normalizedAmount = Number(
        requestedAmount.replace(/\./g, "").replace(",", "."),
      );

      if (!Number.isFinite(normalizedAmount) || normalizedAmount <= 0) {
        throw new Error("Informe um valor valido.");
      }

      await createCreditRequest.mutateAsync(normalizedAmount);
    } catch (error) {
      if (
        error instanceof Error &&
        error.message === "Informe um valor valido."
      ) {
        setValidationError(error.message);
      }
    }
  }

  const errorMessage =
    validationError ??
    (loadError instanceof Error
      ? loadError.message
      : createCreditRequest.error instanceof Error
        ? createCreditRequest.error.message
        : null);

  return (
    <main className="min-h-svh bg-[#f7fafa] text-[#102a43]">
      <header className="sticky top-0 z-50 flex h-14 items-center justify-between border-b border-slate-200 bg-white/90 px-5 shadow-sm backdrop-blur md:px-8">
        <div className="flex items-center gap-6">
          <span className="font-mono text-xl font-bold text-[#00766d]">
            FluxCred
          </span>
          <div className="relative hidden lg:block">
            <Search
              className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />
            <Input
              placeholder="Buscar dados..."
              className="h-9 w-72 rounded-full border-0 bg-slate-100 pl-10 shadow-none focus-visible:ring-[#00766d]"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="flex size-9 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100"
            aria-label="Notificacoes"
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
          <div className="ml-1 flex size-9 items-center justify-center rounded-full bg-[#006d77] text-white">
            <User className="size-5" aria-hidden="true" />
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1440px]">
        <aside className="sticky top-14 hidden h-[calc(100svh-56px)] w-72 shrink-0 flex-col border-r border-slate-100 bg-white p-6 md:flex">
          <div className="mb-8">
            <h2 className="font-mono text-2xl font-black text-[#00766d]">
              FluxCred
            </h2>
            <p className="text-xs font-medium text-slate-500">
              Financas modernas
            </p>
          </div>

          <nav className="flex flex-col gap-2 text-sm font-medium">
            {navItems.map((item) => {
              const Icon = item.icon;

              return (
                <a
                  href="/credit-request"
                  key={item.label}
                  className={
                    item.active
                      ? "flex items-center gap-3 rounded-lg border-r-4 border-[#00766d] bg-[#e8f7f4] px-4 py-3 font-bold text-[#00766d]"
                      : "flex items-center gap-3 rounded-lg px-4 py-3 text-slate-600 transition-colors hover:bg-slate-50 hover:text-[#00766d]"
                  }
                >
                  <Icon className="size-5" aria-hidden="true" />
                  {item.label}
                </a>
              );
            })}
          </nav>

          <div className="mt-auto space-y-4 border-t border-slate-100 pt-5">
            <a
              href="/credit-request"
              className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-[#00766d]"
            >
              <Settings className="size-5" aria-hidden="true" />
              Configuracoes
            </a>
            <a
              href="/login"
              className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-[#00766d]"
            >
              <LogOut className="size-5" aria-hidden="true" />
              Sair
            </a>
          </div>
        </aside>

        <section className="flex-1 px-5 py-8 pb-28 md:px-10 md:pb-10">
          <div className="mx-auto max-w-[760px] space-y-8">
            {errorMessage && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {errorMessage}
              </div>
            )}

            <div>
              <h1 className="font-mono text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">
                Solicitar Credito
              </h1>
              <p className="mt-2 max-w-xl text-base leading-7 text-[#506383]">
                Solicite financiamento com as melhores taxas do mercado
                corporativo.
              </p>
            </div>

            <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
              <div className="grid gap-6 md:grid-cols-[1fr_auto]">
                <div>
                  <span className="mb-5 inline-flex rounded-full bg-[#d9fbf5] px-4 py-2 text-[11px] font-bold text-[#00766d]">
                    Simulacao de Credito
                  </span>
                  <h2 className="max-w-[220px] font-mono text-2xl font-semibold leading-tight text-slate-950">
                    Quanto voce precisa?
                  </h2>
                </div>

                <div className="text-left md:text-right">
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#506383]">
                    Limite recomendado
                  </p>
                  <p className="mt-1 font-mono text-3xl font-bold leading-tight text-[#00766d]">
                    R$
                  </p>
                  <p className="font-mono text-2xl font-bold text-[#00766d]">
                    {isLoading
                      ? "..."
                      : formatCurrency(score?.recommendedLimit).replace(
                          "R$",
                          "",
                        )}
                  </p>
                </div>
              </div>

              <form className="mt-7 space-y-5" onSubmit={handleSubmit}>
                <div className="space-y-2">
                  <label
                    htmlFor="requestedAmount"
                    className="text-sm font-medium text-[#506383]"
                  >
                    Valor solicitado
                  </label>
                  <div className="relative">
                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-lg font-bold text-[#8a9ab2]">
                      R$
                    </span>
                    <Input
                      id="requestedAmount"
                      name="requestedAmount"
                      inputMode="decimal"
                      placeholder="0,00"
                      value={requestedAmount}
                      onChange={(event) =>
                        setRequestedAmount(event.target.value)
                      }
                      className="h-16 rounded-lg border-slate-200 bg-white pl-16 text-2xl font-bold text-[#506383] shadow-none placeholder:text-[#7d8ca5] focus-visible:ring-[#00766d]"
                    />
                  </div>
                </div>

                <p className="flex items-start gap-2 text-xs leading-5 text-[#506383]">
                  <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                  O valor solicitado sera analisado em ate 24 horas uteis.
                </p>

                <Button
                  disabled={createCreditRequest.isPending || !score}
                  className="mt-4 h-14 w-full rounded-lg bg-[#007d82] text-base font-bold text-white shadow-lg shadow-[#00766d]/20 hover:bg-[#00666b]"
                >
                  <CircleDollarSign className="size-5" aria-hidden="true" />
                  {createCreditRequest.isPending
                    ? "Solicitando..."
                    : "Solicitar credito"}
                </Button>
              </form>
            </section>

            <section className="space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-[#8a9ab2]">
                Historico de solicitacoes
              </h2>

              <div className="space-y-4">
                {requests.map((request) => {
                  const view = statusView(request.status);
                  const Icon = view.icon;

                  return (
                    <article
                      className={`rounded-xl border p-5 ${view.className}`}
                      key={request.id}
                    >
                      <div className="flex gap-4">
                        <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-current/10">
                          <Icon className="size-6" aria-hidden="true" />
                        </span>
                        <div>
                          <h3 className="font-bold">{view.title}</h3>
                          <p className="mt-1 text-sm leading-6">
                            {formatCurrency(request.requestedAmount)} solicitado
                            em {formatDate(request.requestedAt)}.
                            {request.approvedAmount
                              ? ` Valor aprovado: ${formatCurrency(request.approvedAmount)}.`
                              : ""}
                            {request.explanation
                              ? ` ${request.explanation}`
                              : ""}
                          </p>
                        </div>
                      </div>
                    </article>
                  );
                })}
                {!isLoading && requests.length === 0 && (
                  <div className="rounded-xl border border-dashed border-slate-200 bg-white p-5 text-sm text-[#506383]">
                    Nenhuma solicitacao de credito registrada ainda.
                  </div>
                )}
              </div>
            </section>
          </div>
        </section>
      </div>

      <nav className="fixed bottom-0 left-0 z-50 flex w-full items-center justify-around rounded-t-2xl border-t border-slate-200 bg-white/95 px-3 py-3 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] backdrop-blur md:hidden">
        {bottomNavItems.map((item) => {
          const Icon = item.icon;

          return (
            <a
              href="/credit-request"
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

