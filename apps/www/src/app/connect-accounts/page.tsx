import {
  AlertTriangle,
  BarChart3,
  Bell,
  Building2,
  CheckCircle2,
  CreditCard,
  HelpCircle,
  Home,
  Landmark,
  LayoutDashboard,
  Link2,
  List,
  LogOut,
  Plus,
  ReceiptText,
  RefreshCw,
  Search,
  Settings,
  ShieldCheck,
  TrendingUp,
  User,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiRequest as authenticatedApiRequest } from "@/lib/api";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Transações", href: "/transactions", icon: ReceiptText },
  { label: "Análise", href: "/analysis", icon: BarChart3 },
  { label: "Score de Crédito", href: "/credit-score", icon: Landmark },
  { label: "Solicitar Crédito", href: "/credit-request", icon: CreditCard },
  {
    label: "Instituições",
    href: "/connect-accounts",
    icon: Building2,
    active: true,
  },
];

const bottomNavItems = [
  { label: "Home", href: "/dashboard", icon: Home },
  { label: "Atividade", href: "/transactions", icon: List },
  { label: "Contas", href: "/connect-accounts", icon: Building2, active: true },
  { label: "Análise", href: "/analysis", icon: BarChart3 },
  { label: "Perfil", href: "/profile", icon: User },
];

const demoProfiles = [
  {
    id: "approved",
    bank: "Itaú",
    title: "Perfil aprovado",
    description:
      "Renda frequente, gastos controlados e reserva positiva para gerar uma decisão aprovada.",
    badge: "Aprovado",
    logoText: "itaú",
    logoClassName: "bg-[#003399] text-[#ff7a00]",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
  },
  {
    id: "rejected",
    bank: "Santander",
    title: "Perfil não aprovado",
    description:
      "Baixa frequência de renda e alto comprometimento para simular recusa.",
    badge: "Recusado",
    logoText: "SAN",
    logoClassName: "bg-[#ec0000] text-white",
    className: "border-red-200 bg-red-50 text-red-700",
  },
] as const;

type DemoProfile = (typeof demoProfiles)[number]["id"];
type ConnectionStatus = "idle" | "loading" | "success" | "error";

type DemoItem = {
  pluggyItemId: string;
  institutionName?: string | null;
  lastSuccessfulSyncAt?: string | null;
  errorMessage?: string | null;
};

type DemoConnectResponse = {
  profile: DemoProfile;
  item: DemoItem;
  score: {
    score: number;
    decision: "APPROVED" | "REJECTED";
    recommendedLimit: string | number;
  };
  creditRequest: {
    status: "APPROVED" | "REJECTED" | "PENDING";
    requestedAmount: string | number;
    approvedAmount?: string | number | null;
  };
};

export default function ConnectAccountsPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<ConnectionStatus>("idle");
  const [selectedProfile, setSelectedProfile] =
    useState<DemoProfile>("approved");
  const [connectedItem, setConnectedItem] = useState<DemoItem | null>(null);
  const [demoResult, setDemoResult] = useState<DemoConnectResponse | null>(
    null,
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState(false);
  const selectedProfileData =
    demoProfiles.find((profile) => profile.id === selectedProfile) ??
    demoProfiles[0];

  const apiRequest = useCallback(authenticatedApiRequest, []);

  useEffect(() => {
    apiRequest<DemoItem[]>("/pluggy/items")
      .then((items) => {
        const [item] = items;

        if (item) {
          setConnectedItem(item);
          setStatus(item.errorMessage ? "error" : "success");
          setErrorMessage(item.errorMessage ?? null);
        }
      })
      .catch(() => {
        // The page can still render; protected actions will request login.
      });
  }, [apiRequest]);

  async function handleConnect(profile: DemoProfile) {
    setSelectedProfile(profile);
    setStatus("loading");
    setErrorMessage(null);

    try {
      const response = await apiRequest<DemoConnectResponse>("/demo/connect", {
        method: "POST",
        body: JSON.stringify({ profile }),
      });

      setConnectedItem(response.item);
      setDemoResult(response);
      setStatus("success");
    } catch (error) {
      setStatus("error");
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Não foi possível gerar os dados demonstrativos.",
      );
    }
  }

  async function handleReset() {
    setIsResetting(true);
    setErrorMessage(null);

    try {
      await apiRequest("/demo/reset", { method: "POST" });
      setConnectedItem(null);
      setDemoResult(null);
      setStatus("idle");
    } catch (error) {
      setStatus("error");
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Não foi possível limpar os dados demonstrativos.",
      );
    } finally {
      setIsResetting(false);
    }
  }

  return (
    <main className="min-h-svh bg-[#f7fafa] text-[#102a43]">
      <aside className="fixed left-0 top-0 z-50 hidden h-svh w-72 border-r border-slate-200 bg-white md:flex md:flex-col">
        <div className="flex h-full flex-col p-6">
          <div className="mb-8">
            <h2 className="font-mono text-2xl font-black text-[#00766d]">
              FluxCred
            </h2>
            <p className="text-xs font-medium text-slate-500">
              Finanças modernas
            </p>
          </div>

          <nav className="flex flex-col gap-2 text-sm font-medium">
            {navItems.map((item) => {
              const Icon = item.icon;

              return (
                <a
                  href={item.href}
                  key={item.label}
                  className={
                    item.active
                      ? "flex items-center gap-3 rounded-lg border-r-4 border-[#00766d] bg-[#e8f7f4] px-4 py-3 font-bold text-[#00766d] transition-colors hover:bg-[#d9f1ed]"
                      : "flex items-center gap-3 rounded-lg px-4 py-3 text-slate-600 transition-colors hover:bg-slate-50 hover:text-[#00766d]"
                  }
                >
                  <Icon className="size-5" aria-hidden="true" />
                  {item.label}
                </a>
              );
            })}
          </nav>

          <div className="mt-auto space-y-1 border-t border-slate-100 pt-5">
            <Button
              asChild
              className="mb-4 h-12 w-full rounded-xl bg-[#00766d] font-bold text-white hover:bg-[#005f58]"
            >
              <a href="/credit-request">
                <Plus className="size-5" aria-hidden="true" />
                Novo empréstimo
              </a>
            </Button>
            <a
              href="/profile"
              className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm text-slate-600 transition-colors hover:bg-slate-50 hover:text-[#00766d]"
            >
              <Settings className="size-5" aria-hidden="true" />
              Configurações
            </a>
            <a
              href="/logout"
              className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm text-slate-600 transition-colors hover:bg-slate-50 hover:text-red-600"
            >
              <LogOut className="size-5" aria-hidden="true" />
              Sair
            </a>
          </div>
        </div>
      </aside>

      <section className="min-h-svh pb-28 md:ml-72 md:pb-10">
        <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/85 shadow-sm backdrop-blur">
          <div className="flex h-16 items-center justify-between px-5 md:px-8">
            <div className="flex items-center gap-4">
              <span className="font-mono text-xl font-extrabold text-[#00766d] md:hidden">
                FluxCred
              </span>
              <h2 className="hidden font-mono text-lg font-semibold text-slate-950 md:block">
                Instituições conectadas
              </h2>
            </div>

            <div className="flex items-center gap-3 sm:gap-5">
              <div className="relative hidden lg:block">
                <Search
                  className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400"
                  aria-hidden="true"
                />
                <Input
                  placeholder="Buscar..."
                  className="h-10 w-56 rounded-full border-0 bg-slate-100 pl-10 shadow-none focus-visible:ring-[#00766d] lg:w-72"
                />
              </div>
              <button
                type="button"
                className="flex size-9 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-[#00766d]"
                aria-label="Ajuda"
              >
                <HelpCircle className="size-5" aria-hidden="true" />
              </button>
              <button
                type="button"
                className="flex size-9 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-[#00766d]"
                aria-label="Notificações"
              >
                <Bell className="size-5" aria-hidden="true" />
              </button>
              <div className="ml-1 flex size-9 items-center justify-center rounded-full bg-[#006d77] text-white">
                <User className="size-5" aria-hidden="true" />
              </div>
            </div>
          </div>
        </header>

        <div className="p-5 md:p-8">
          <div className="mx-auto max-w-[1280px] space-y-6">
            <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
              <div>
                <h1 className="font-mono text-2xl font-semibold text-slate-950">
                  Conectar conta demo
                </h1>
                <p className="mt-2 max-w-xl text-base leading-7 text-[#506383]">
                  Escolha um banco demonstrativo para gerar contas, transações,
                  métricas, score e pedido de crédito mockados.
                </p>
              </div>

              <div className="inline-flex items-center gap-2 rounded-lg border border-[#c8f1ec] bg-[#eefdfa] px-4 py-3 text-xs font-bold uppercase tracking-[0.08em] text-[#00766d]">
                <ShieldCheck className="size-5" aria-hidden="true" />
                Modo demonstração
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-12">
              <div className="space-y-6 lg:col-span-8">
                <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                  <div className="border-b border-slate-100 p-6">
                    <h2 className="font-mono text-xl font-semibold text-slate-900">
                      Escolha o perfil financeiro
                    </h2>
                    <p className="mt-1 text-sm leading-6 text-[#506383]">
                      Cada opção substitui os dados financeiros atuais do
                      usuário por um histórico demo coerente.
                    </p>
                  </div>

                  <div className="grid gap-4 p-6 md:grid-cols-3">
                    {demoProfiles.map((profile) => {
                      const isSelected = selectedProfile === profile.id;
                      const isLoading =
                        status === "loading" && selectedProfile === profile.id;

                      return (
                        <button
                          type="button"
                          key={profile.id}
                          onClick={() => handleConnect(profile.id)}
                          disabled={status === "loading" || isResetting}
                          className={cn(
                            "group flex min-h-64 flex-col rounded-xl border bg-white p-5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-[#00766d] hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-70",
                            isSelected
                              ? "border-[#00766d] ring-2 ring-[#d9fbf5]"
                              : "border-slate-200",
                          )}
                        >
                          <div
                            className={cn(
                              "mb-5 flex size-14 items-center justify-center rounded-xl text-base font-black shadow-sm",
                              profile.logoClassName,
                            )}
                            aria-hidden="true"
                          >
                            {profile.logoText}
                          </div>
                          <p className="mb-2 text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
                            {profile.bank}
                          </p>
                          <div className="mb-3 inline-flex w-fit rounded-full bg-slate-100 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500 transition-colors group-hover:bg-[#e8f7f4] group-hover:text-[#00766d]">
                            {profile.badge}
                          </div>
                          <h3 className="font-mono text-lg font-semibold text-slate-950">
                            {profile.title}
                          </h3>
                          <p className="mt-3 flex-1 text-sm leading-6 text-[#506383]">
                            {profile.description}
                          </p>
                          <span className="mt-5 inline-flex h-10 items-center justify-center rounded-lg bg-[#00766d] px-4 text-sm font-bold text-white transition-colors group-hover:bg-[#005f58]">
                            {isLoading ? "Gerando..." : "Usar este perfil"}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex flex-col gap-4 border-t border-slate-100 bg-slate-50 p-6 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                        Fonte
                      </span>
                      <span className="text-sm font-bold text-[#506383]">
                        Dados mockados locais
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleReset}
                      disabled={isResetting || status === "loading"}
                      className="h-11 rounded-xl border-slate-200 px-5 font-bold text-slate-700 hover:border-red-200 hover:bg-red-50 hover:text-red-700"
                    >
                      {isResetting ? "Limpando..." : "Limpar dados demo"}
                    </Button>
                  </div>
                </section>

                <div className="grid gap-4">
                  {status === "idle" && (
                    <div className="rounded-xl border border-[#c8f1ec] bg-[#eefdfa] p-5 text-sm leading-6 text-[#00766d]">
                      Selecione um perfil para popular o ambiente com dados de
                      demonstração.
                    </div>
                  )}
                  {status === "loading" && (
                    <div className="rounded-xl border border-l-4 border-slate-100 border-l-[#14b8a6] bg-white p-5 shadow-sm">
                      <div className="mb-3 flex items-center gap-3">
                        <span className="flex size-10 items-center justify-center rounded-full bg-[#d9fbf5] text-[#00766d]">
                          <RefreshCw
                            className="size-5 animate-spin"
                            aria-hidden="true"
                          />
                        </span>
                        <h3 className="text-sm font-bold text-[#006d77]">
                          Gerando histórico demonstrativo
                        </h3>
                      </div>
                      <p className="text-xs leading-6 text-[#506383]">
                        Estamos criando contas, transações, métricas, score e
                        solicitação de crédito para o perfil escolhido.
                      </p>
                      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-100">
                        <div className="h-full w-[70%] rounded-full bg-[#14b8a6]" />
                      </div>
                    </div>
                  )}

                  {status === "error" && (
                    <div className="rounded-xl border border-l-4 border-slate-100 border-l-red-500 bg-white p-5 shadow-sm">
                      <div className="mb-3 flex items-center gap-3">
                        <span className="flex size-10 items-center justify-center rounded-full bg-red-50 text-red-600">
                          <AlertTriangle
                            className="size-5"
                            aria-hidden="true"
                          />
                        </span>
                        <h3 className="text-sm font-bold text-red-900">
                          Erro ao gerar demo
                        </h3>
                      </div>
                      <p className="text-xs leading-6 text-[#506383]">
                        {errorMessage ??
                          "Não foi possível preparar os dados agora."}
                      </p>
                      <button
                        type="button"
                        onClick={() => handleConnect(selectedProfile)}
                        className="mt-4 flex items-center gap-1 text-xs font-bold text-red-600 transition-colors hover:text-red-700 hover:underline"
                      >
                        Tentar novamente
                        <RefreshCw className="size-3" aria-hidden="true" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <aside className="space-y-6 lg:col-span-4">
                {status === "success" && (
                  <div className="rounded-xl border border-[#c8f1ec] bg-white p-6 shadow-sm ring-2 ring-[#eefdfa]">
                    <span className="mb-4 flex size-12 items-center justify-center rounded-full bg-[#d9fbf5] text-[#00766d]">
                      <CheckCircle2 className="size-7" aria-hidden="true" />
                    </span>
                    <h3 className="font-mono text-lg font-semibold text-slate-950">
                      Dados demo gerados
                    </h3>
                    <p className="mt-3 text-sm leading-6 text-[#506383]">
                      O banco foi vinculado e os dados já podem ser avaliados no
                      dashboard, análise, score e solicitação de crédito.
                    </p>

                    <div className="mt-6 space-y-3 rounded-lg border border-slate-100 bg-slate-50 p-3">
                      <div className="flex items-center gap-3">
                        <span
                          className={cn(
                            "flex size-10 items-center justify-center rounded-md text-xs font-black shadow-sm",
                            selectedProfileData.logoClassName,
                          )}
                        >
                          {selectedProfileData.logoText}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-bold text-slate-950">
                            {connectedItem?.institutionName ??
                              selectedProfileData.bank}
                          </p>
                          <p className="mt-1 truncate text-[10px] text-[#506383]">
                            Conectada via modo demonstração
                          </p>
                        </div>
                        <Link2
                          className="size-4 text-[#00766d]"
                          aria-hidden="true"
                        />
                      </div>
                      {demoResult && (
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="rounded-md bg-white p-3">
                            <p className="text-slate-500">Score</p>
                            <p className="mt-1 font-bold text-slate-950">
                              {demoResult.score.score}
                            </p>
                          </div>
                          <div className="rounded-md bg-white p-3">
                            <p className="text-slate-500">Pedido</p>
                            <p className="mt-1 font-bold text-slate-950">
                              {demoResult.creditRequest.status}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    <Button
                      type="button"
                      onClick={() => navigate("/dashboard")}
                      className="mt-5 h-11 w-full rounded-xl bg-[#00766d] font-bold text-white hover:bg-[#005f58]"
                    >
                      Ver dashboard
                    </Button>
                  </div>
                )}

                <div className="relative overflow-hidden rounded-xl bg-[#00766d] p-6 text-white shadow-xl">
                  <div className="relative z-10">
                    <h3 className="mb-3 text-[11px] font-extrabold uppercase tracking-[0.2em] text-[#9ff0fb]">
                      Como usar
                    </h3>
                    <p className="mb-4 font-mono text-xl font-semibold leading-snug">
                      Teste os dois resultados principais do produto
                    </p>
                    <p className="mb-6 text-xs leading-6 text-white/85">
                      Cada perfil gera uma massa de dados completa para validar
                      a experiência sem depender de uma conta real do Pluggy.
                    </p>

                    <ul className="space-y-4 text-xs font-medium">
                      {["Aprovação automática", "Recusa por risco"].map(
                        (item) => (
                          <li className="flex items-start gap-3" key={item}>
                            <CheckCircle2
                              className="size-4 shrink-0 text-[#9ff0fb]"
                              aria-hidden="true"
                            />
                            {item}
                          </li>
                        ),
                      )}
                    </ul>
                  </div>

                  <TrendingUp
                    className="absolute -bottom-8 -right-8 size-40 text-white/10"
                    aria-hidden="true"
                  />
                </div>
              </aside>
            </div>
          </div>
        </div>
      </section>

      <nav className="fixed bottom-0 left-0 z-50 flex w-full items-center justify-around rounded-t-2xl border-t border-slate-200 bg-white/95 px-3 py-3 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] backdrop-blur md:hidden">
        {bottomNavItems.map((item) => {
          const Icon = item.icon;

          return (
            <a
              href={item.href}
              key={item.label}
              className={
                item.active
                  ? "flex flex-col items-center rounded-xl bg-[#e8f7f4] px-3 py-1 text-[#00766d] transition-colors hover:bg-[#d9f1ed]"
                  : "flex flex-col items-center rounded-xl px-2 py-1 text-slate-400 transition-colors hover:bg-slate-50 hover:text-[#00766d]"
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
