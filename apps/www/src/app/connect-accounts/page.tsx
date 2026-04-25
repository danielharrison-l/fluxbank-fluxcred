import {
  AlertTriangle,
  BarChart3,
  Bell,
  Building2,
  CheckCircle2,
  HelpCircle,
  Home,
  Landmark,
  LayoutDashboard,
  Link2,
  List,
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiRequest as authenticatedApiRequest } from "@/lib/api";

const banks = [
  { name: "Itau", initials: "I", className: "bg-orange-500 text-white" },
  { name: "Bradesco", initials: "B", className: "bg-red-600 text-white" },
  { name: "Nubank", initials: "N", className: "bg-purple-700 text-white" },
  {
    name: "Banco do Brasil",
    initials: "BB",
    className: "bg-yellow-400 text-slate-900",
  },
  { name: "Santander", initials: "S", className: "bg-red-500 text-white" },
  { name: "Caixa", initials: "C", className: "bg-blue-600 text-white" },
  { name: "Inter", initials: "IN", className: "bg-orange-600 text-white" },
  { name: "Outro", initials: "+", className: "bg-slate-100 text-slate-400" },
];

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard },
  { label: "Instituicoes", icon: Building2, active: true },
  { label: "Transacoes", icon: ReceiptText },
  { label: "Analise", icon: BarChart3 },
  { label: "Configuracoes", icon: Settings },
];

const bottomNavItems = [
  { label: "Home", icon: Home },
  { label: "Atividade", icon: List },
  { label: "Credito", icon: Landmark, active: true },
  { label: "Analise", icon: BarChart3 },
  { label: "Perfil", icon: User },
];

type ConnectionStatus = "idle" | "loading" | "success" | "error";

type PluggyItem = {
  pluggyItemId: string;
  institutionName?: string | null;
  lastSuccessfulSyncAt?: string | null;
  errorMessage?: string | null;
};

type PluggyConnectSuccess = {
  item?: { id?: string };
  itemId?: string;
  id?: string;
};

type PluggyConnectError = {
  message?: string;
};

type PluggyConnectConstructor = new (config: {
  connectToken: string;
  includeSandbox?: boolean;
  allowFullscreen?: boolean;
  theme?: "light" | "dark";
  onSuccess?: (data: PluggyConnectSuccess) => void | Promise<void>;
  onError?: (error: PluggyConnectError) => void;
}) => {
  init: () => Promise<void>;
};

declare global {
  interface Window {
    PluggyConnect?: PluggyConnectConstructor;
  }
}

async function loadPluggyConnect() {
  if (window.PluggyConnect) {
    return window.PluggyConnect;
  }

  await new Promise<void>((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[data-pluggy-connect="true"]',
    );

    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(), { once: true });
      existingScript.addEventListener("error", () => reject(), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src =
      "https://cdn.pluggy.ai/pluggy-connect/latest/pluggy-connect.js";
    script.async = true;
    script.dataset.pluggyConnect = "true";
    script.onload = () => resolve();
    script.onerror = () =>
      reject(new Error("Nao foi possivel carregar o Pluggy Connect"));
    document.body.appendChild(script);
  });

  if (!window.PluggyConnect) {
    throw new Error("Pluggy Connect nao esta disponivel");
  }

  return window.PluggyConnect;
}

export default function ConnectAccountsPage() {
  const [status, setStatus] = useState<ConnectionStatus>("idle");
  const [connectedItem, setConnectedItem] = useState<PluggyItem | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const apiRequest = useCallback(authenticatedApiRequest, []);

  useEffect(() => {
    apiRequest<PluggyItem[]>("/pluggy/items")
      .then((items) => {
        const [item] = items;

        if (item) {
          setConnectedItem(item);
          setStatus(item.errorMessage ? "error" : "success");
          setErrorMessage(item.errorMessage ?? null);
        }
      })
      .catch(() => {
        // The page can still render for unauthenticated users; the CTA explains it.
      });
  }, [apiRequest]);

  async function handleConnect() {
    setStatus("loading");
    setErrorMessage(null);

    try {
      const [{ connectToken }, PluggyConnect] = await Promise.all([
        apiRequest<{ connectToken: string }>("/pluggy/connect-token", {
          method: "POST",
        }),
        loadPluggyConnect(),
      ]);

      const pluggyConnect = new PluggyConnect({
        connectToken,
        includeSandbox: false,
        allowFullscreen: true,
        theme: "light",
        onSuccess: async (data) => {
          const itemId = data.item?.id ?? data.itemId ?? data.id;

          if (!itemId) {
            setStatus("error");
            setErrorMessage("A Pluggy nao retornou o item conectado.");
            return;
          }

          try {
            const item = await apiRequest<PluggyItem>("/pluggy/items", {
              method: "POST",
              body: JSON.stringify({ itemId }),
            });

            setConnectedItem(item);
            await apiRequest(`/pluggy/sync/${itemId}`, { method: "POST" });
            setStatus("success");
          } catch (error) {
            setStatus("error");
            setErrorMessage(
              error instanceof Error
                ? error.message
                : "A instituicao foi conectada, mas a sincronizacao falhou.",
            );
          }
        },
        onError: (error) => {
          setStatus("error");
          setErrorMessage(
            error.message ?? "Falha na autenticacao com o banco.",
          );
        },
      });

      await pluggyConnect.init();
    } catch (error) {
      setStatus("error");
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Nao foi possivel iniciar a conexao.",
      );
    }
  }

  return (
    <main className="min-h-svh bg-[#f7fafa] text-[#102a43]">
      <header className="sticky top-0 z-50 flex h-14 items-center justify-between border-b border-slate-200 bg-white/90 px-5 shadow-sm backdrop-blur md:px-8">
        <div className="flex items-center gap-6">
          <span className="font-mono text-xl font-bold text-[#00766d]">
            FluxCred
          </span>
          <div className="relative hidden lg:block">
            <Search
              className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />
            <Input
              placeholder="Buscar..."
              className="h-9 w-72 rounded-full border-0 bg-slate-100 pl-9 shadow-none focus-visible:ring-[#00766d]"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="flex size-9 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100"
            aria-label="Ajuda"
          >
            <HelpCircle className="size-5" aria-hidden="true" />
          </button>
          <button
            type="button"
            className="flex size-9 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100"
            aria-label="Notificacoes"
          >
            <Bell className="size-5" aria-hidden="true" />
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
                  href="/connect-accounts"
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

          <div className="mt-auto border-t border-slate-100 pt-5">
            <Button className="h-12 w-full rounded-xl bg-[#00766d] font-bold text-white hover:bg-[#005f58]">
              <Plus className="size-5" aria-hidden="true" />
              Novo Emprestimo
            </Button>
          </div>
        </aside>

        <section className="flex-1 px-5 py-8 pb-28 md:px-10 md:pb-10">
          <div className="mx-auto max-w-[1080px] space-y-6">
            <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
              <div>
                <h1 className="font-mono text-2xl font-semibold text-slate-950">
                  Conectar Conta
                </h1>
                <p className="mt-2 max-w-xl text-base leading-7 text-[#506383]">
                  Utilizamos o Pluggy para uma conexao segura via Open Finance.
                </p>
              </div>

              <div className="inline-flex items-center gap-2 rounded-lg border border-[#c8f1ec] bg-[#eefdfa] px-4 py-3 text-xs font-bold uppercase tracking-[0.08em] text-[#00766d]">
                <ShieldCheck className="size-5" aria-hidden="true" />
                Dados criptografados
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-12">
              <div className="space-y-6 lg:col-span-8">
                <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                  <div className="border-b border-slate-100 p-6">
                    <h2 className="font-mono text-xl font-semibold text-slate-900">
                      Selecione sua Instituicao
                    </h2>
                    <p className="mt-1 text-sm leading-6 text-[#506383]">
                      Busque ou escolha um dos bancos parceiros abaixo.
                    </p>
                  </div>

                  <div className="p-6">
                    <div className="relative mb-6">
                      <Search
                        className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-slate-400"
                        aria-hidden="true"
                      />
                      <Input
                        placeholder="Buscar banco..."
                        className="h-12 rounded-lg border-slate-200 bg-white pl-12 shadow-none focus-visible:ring-[#00766d]"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
                      {banks.map((bank) => (
                        <button
                          type="button"
                          key={bank.name}
                          className="group flex min-h-28 flex-col items-center justify-center gap-3 rounded-xl border border-slate-100 bg-white p-4 transition-all hover:border-[#00766d] hover:bg-[#ecfbf8]"
                        >
                          <span
                            className={`flex size-12 items-center justify-center rounded-lg text-sm font-bold shadow-sm ${bank.className}`}
                          >
                            {bank.initials}
                          </span>
                          <span className="text-center text-sm font-medium text-slate-700 group-hover:text-[#00766d]">
                            {bank.name}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col gap-4 border-t border-slate-100 bg-slate-50 p-6 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                        Tecnologia
                      </span>
                      <span className="text-sm font-bold text-[#506383]">
                        Pluggy
                      </span>
                    </div>
                    <Button
                      onClick={handleConnect}
                      disabled={status === "loading"}
                      className="h-12 rounded-xl bg-[#00766d] px-7 font-bold text-white shadow-lg shadow-[#00766d]/20 hover:bg-[#005f58]"
                    >
                      {status === "loading"
                        ? "Conectando..."
                        : "Conectar instituicao"}
                    </Button>
                  </div>
                </section>

                <div className="grid gap-4">
                  {status === "idle" && (
                    <div className="rounded-xl border border-[#c8f1ec] bg-[#eefdfa] p-5 text-sm leading-6 text-[#00766d]">
                      Selecione uma instituicao e inicie a conexao segura via
                      Pluggy.
                    </div>
                  )}
                  {status === "loading" && (
                    <div className="rounded-xl border border-l-4 border-slate-100 border-l-[#14b8a6] bg-white p-5 shadow-sm">
                      <div className="mb-3 flex items-center gap-3">
                        <span className="flex size-10 items-center justify-center rounded-full bg-[#d9fbf5] text-[#00766d]">
                          <RefreshCw className="size-5" aria-hidden="true" />
                        </span>
                        <h3 className="text-sm font-bold text-[#006d77]">
                          Sincronizacao em andamento
                        </h3>
                      </div>
                      <p className="text-xs leading-6 text-[#506383]">
                        Estamos buscando suas contas. Isso pode levar alguns
                        segundos enquanto validamos as permissoes.
                      </p>
                      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-100">
                        <div className="h-full w-[65%] rounded-full bg-[#14b8a6]" />
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
                          Erro na conexao
                        </h3>
                      </div>
                      <p className="text-xs leading-6 text-[#506383]">
                        {errorMessage ??
                          "Nao foi possivel sincronizar agora. Verifique sua conexao ou tente novamente mais tarde."}
                      </p>
                      <button
                        type="button"
                        onClick={handleConnect}
                        className="mt-4 flex items-center gap-1 text-xs font-bold text-red-600 hover:underline"
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
                      Conta conectada com sucesso
                    </h3>
                    <p className="mt-3 text-sm leading-6 text-[#506383]">
                      Sua conta foi vinculada e seus dados ja estao sendo
                      analisados para sua nova oferta de credito.
                    </p>

                    <div className="mt-6 flex items-center gap-3 rounded-lg border border-slate-100 bg-slate-50 p-3">
                      <span className="flex size-9 items-center justify-center rounded-md bg-orange-500 text-xs font-bold text-white">
                        I
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-bold text-slate-950">
                          {connectedItem?.institutionName ?? "Instituicao"}
                        </p>
                        <p className="mt-1 truncate text-[10px] text-[#506383]">
                          Conectada via Pluggy
                        </p>
                      </div>
                      <Link2
                        className="size-4 text-[#00766d]"
                        aria-hidden="true"
                      />
                    </div>
                  </div>
                )}

                <div className="relative overflow-hidden rounded-xl bg-[#00766d] p-6 text-white shadow-xl">
                  <div className="relative z-10">
                    <h3 className="mb-3 text-[11px] font-extrabold uppercase tracking-[0.2em] text-[#9ff0fb]">
                      Por que conectar?
                    </h3>
                    <p className="mb-4 font-mono text-xl font-semibold leading-snug">
                      Aumente suas chances de aprovacao em ate 45%
                    </p>
                    <p className="mb-6 text-xs leading-6 text-white/85">
                      Ao compartilhar seu historico, conseguimos oferecer taxas
                      personalizadas e limites maiores.
                    </p>

                    <ul className="space-y-4 text-xs font-medium">
                      {[
                        "Analise em tempo real",
                        "Sem burocracia de papelada",
                        "Voce tem controle total dos dados",
                      ].map((item) => (
                        <li className="flex items-start gap-3" key={item}>
                          <CheckCircle2
                            className="size-4 shrink-0 text-[#9ff0fb]"
                            aria-hidden="true"
                          />
                          {item}
                        </li>
                      ))}
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
        </section>
      </div>

      <nav className="fixed bottom-0 left-0 z-50 flex w-full items-center justify-around rounded-t-2xl border-t border-slate-200 bg-white/95 px-3 py-3 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] backdrop-blur md:hidden">
        {bottomNavItems.map((item) => {
          const Icon = item.icon;

          return (
            <a
              href="/connect-accounts"
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

