import { useQuery } from "@tanstack/react-query";
import {
  BarChart3,
  Bell,
  Building2,
  CircleUserRound,
  CreditCard,
  Eye,
  Gauge,
  HelpCircle,
  Home,
  LayoutDashboard,
  Link2,
  List,
  LogOut,
  Pencil,
  ReceiptText,
  Search,
  Settings,
  ShieldCheck,
  User,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiRequest, formatDate } from "@/lib/api";

type UserProfile = {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  document?: string | null;
  createdAt: string;
  updatedAt: string;
};

type PluggyItem = {
  id: string;
  pluggyItemId: string;
  institutionName?: string | null;
  status: string;
  statusDetail?: string | null;
  lastUpdatedAt?: string | null;
  lastSuccessfulSyncAt?: string | null;
  errorMessage?: string | null;
};

const sideNavItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Transações", href: "/transactions", icon: ReceiptText },
  { label: "Análise", href: "/analysis", icon: BarChart3 },
  { label: "Credit Score", href: "/credit-score", icon: Gauge },
  { label: "Credit Request", href: "/credit-request", icon: CreditCard },
  { label: "Instituições", href: "/connect-accounts", icon: Building2 },
];

const mobileNavItems = [
  { label: "Home", href: "/dashboard", icon: Home },
  { label: "Atividade", href: "/transactions", icon: List },
  { label: "Análise", href: "/analysis", icon: BarChart3 },
  { label: "Crédito", href: "/credit-request", icon: CreditCard },
  { label: "Perfil", href: "/profile", icon: User, active: true },
];

function getInitials(name?: string | null) {
  if (!name) {
    return "FC";
  }

  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return "FC";
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

function maskDocument(value?: string | null) {
  if (!value) {
    return "Não informado";
  }

  const digits = value.replace(/\D/g, "");

  if (digits.length === 11) {
    return `***.${digits.slice(3, 6)}.${digits.slice(6, 9)}-**`;
  }

  if (digits.length >= 4) {
    return `${"*".repeat(Math.max(0, digits.length - 4))}${digits.slice(-4)}`;
  }

  return value;
}

function formatPhone(value?: string | null) {
  if (!value) {
    return "Não informado";
  }

  const digits = value.replace(/\D/g, "");

  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }

  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }

  return value;
}

function formatSyncDate(item: PluggyItem) {
  const value = item.lastSuccessfulSyncAt ?? item.lastUpdatedAt;

  if (!value) {
    return "Sem sincronização registrada";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function getItemStatusMeta(item: PluggyItem) {
  if (
    item.errorMessage ||
    item.status === "ERROR" ||
    item.status === "LOGIN_ERROR"
  ) {
    return {
      label: "Erro",
      className: "bg-red-50 text-red-700",
      detail: item.errorMessage ?? "Falha na última sincronização",
    };
  }

  if (item.status === "UPDATING" || item.status === "WAITING_USER_INPUT") {
    return {
      label: "Pendente",
      className: "bg-amber-50 text-amber-700",
      detail: item.statusDetail ?? "Aguardando atualização",
    };
  }

  return {
    label: "Ativa",
    className: "bg-emerald-50 text-emerald-700",
    detail: `Última sincronização: ${formatSyncDate(item)}`,
  };
}

export default function ProfilePage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["profile-page"],
    queryFn: async () => {
      const [user, pluggyItems] = await Promise.all([
        apiRequest<UserProfile | null>("/users/me"),
        apiRequest<PluggyItem[]>("/pluggy/items"),
      ]);

      return {
        user,
        pluggyItems,
      };
    },
  });

  const user = data?.user ?? null;
  const pluggyItems = data?.pluggyItems ?? [];

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
                  className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-slate-600 transition-colors hover:bg-slate-50 hover:text-[#00766d]"
                >
                  <Icon className="size-5" aria-hidden="true" />
                  <span className="font-mono text-sm">{item.label}</span>
                </a>
              );
            })}
          </nav>

          <div className="mt-auto border-t border-slate-100 pt-5">
            <a
              href="/profile"
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
                Configurações do perfil
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
              <div className="flex size-9 items-center justify-center rounded-full bg-[#006d77] text-white">
                <span className="text-xs font-bold">
                  {getInitials(user?.name)}
                </span>
              </div>
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-[1280px] space-y-6 p-5 md:p-8">
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error instanceof Error
                ? error.message
                : "Não foi possível carregar o perfil."}
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-12">
            <div className="space-y-6 lg:col-span-4">
              <section className="rounded-xl border border-slate-200 bg-white p-6 text-center shadow-sm">
                <div className="relative mx-auto mb-5 flex size-24 items-center justify-center rounded-full bg-slate-100 text-[#006d77] shadow-sm">
                  <CircleUserRound className="size-16" aria-hidden="true" />
                  <span className="absolute bottom-0 right-0 flex size-9 items-center justify-center rounded-full border-2 border-white bg-[#00766d] text-white shadow-md">
                    <Pencil className="size-4" aria-hidden="true" />
                  </span>
                </div>
                <h1 className="font-mono text-2xl font-semibold text-[#181c1d]">
                  {isLoading ? "Carregando..." : (user?.name ?? "Usuário")}
                </h1>
                <p className="mt-1 text-sm text-[#506383]">
                  {user?.createdAt
                    ? `Conta criada em ${formatDate(user.createdAt)}`
                    : "Conta FluxCred"}
                </p>

                <div className="mt-8 space-y-3 border-t border-slate-100 pt-6">
                  <Button
                    type="button"
                    disabled
                    className="h-12 w-full rounded-xl bg-[#00766d] font-bold text-white hover:bg-[#00766d] disabled:opacity-100"
                  >
                    Atualizar perfil
                  </Button>
                  <p className="text-xs text-[#506383]">
                    Edição de cadastro será liberada em breve.
                  </p>
                  <Button
                    asChild
                    variant="outline"
                    className="h-12 w-full rounded-xl border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                  >
                    <a href="/logout">Sair</a>
                  </Button>
                </div>
              </section>

              <section className="relative overflow-hidden rounded-xl bg-[#0b7a80] p-6 text-white shadow-sm">
                <div className="relative z-10">
                  <h2 className="text-xs font-bold uppercase tracking-[0.16em] text-[#9ff0fb]">
                    Segurança da conta
                  </h2>
                  <div className="mt-4 flex items-center gap-3">
                    <ShieldCheck
                      className="size-5 text-emerald-300"
                      aria-hidden="true"
                    />
                    <span className="font-mono text-xl font-semibold">
                      Sessão protegida
                    </span>
                  </div>
                  <p className="mt-4 text-sm leading-7 text-white/85">
                    Sua autenticação usa renovação automática de sessão e acesso
                    protegido. Em dispositivos compartilhados, finalize a sessão
                    ao sair.
                  </p>
                </div>
                <ShieldCheck
                  className="absolute -bottom-6 -right-6 size-28 text-white/10"
                  aria-hidden="true"
                />
              </section>
            </div>

            <div className="space-y-6 lg:col-span-8">
              <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-6 flex items-center gap-3">
                  <User className="size-5 text-[#00766d]" aria-hidden="true" />
                  <h2 className="font-mono text-xl font-semibold text-[#181c1d]">
                    Dados pessoais
                  </h2>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <div className="space-y-2">
                    <label
                      htmlFor="profile-name"
                      className="text-xs font-bold uppercase tracking-[0.12em] text-[#506383]"
                    >
                      Nome completo
                    </label>
                    <Input
                      id="profile-name"
                      readOnly
                      value={user?.name ?? "Não informado"}
                      className="h-12 rounded-xl border-slate-200 bg-slate-100 shadow-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label
                      htmlFor="profile-email"
                      className="text-xs font-bold uppercase tracking-[0.12em] text-[#506383]"
                    >
                      E-mail
                    </label>
                    <Input
                      id="profile-email"
                      readOnly
                      value={user?.email ?? "Não informado"}
                      className="h-12 rounded-xl border-slate-200 bg-slate-100 shadow-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label
                      htmlFor="profile-document"
                      className="text-xs font-bold uppercase tracking-[0.12em] text-[#506383]"
                    >
                      Documento
                    </label>
                    <div className="relative">
                      <Input
                        id="profile-document"
                        readOnly
                        value={maskDocument(user?.document)}
                        className="h-12 rounded-xl border-slate-200 bg-slate-100 pr-12 shadow-none"
                      />
                      <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                        <Eye className="size-4" aria-hidden="true" />
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label
                      htmlFor="profile-phone"
                      className="text-xs font-bold uppercase tracking-[0.12em] text-[#506383]"
                    >
                      Telefone
                    </label>
                    <Input
                      id="profile-phone"
                      readOnly
                      value={formatPhone(user?.phone)}
                      className="h-12 rounded-xl border-slate-200 bg-slate-100 shadow-none"
                    />
                  </div>
                </div>
              </section>

              <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-6 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <Link2
                      className="size-5 text-[#00766d]"
                      aria-hidden="true"
                    />
                    <h2 className="font-mono text-xl font-semibold text-[#181c1d]">
                      Gerenciamento de dados conectados
                    </h2>
                  </div>
                  <Link
                    to="/connect-accounts"
                    className="text-sm font-semibold text-[#00766d] hover:underline"
                  >
                    Adicionar nova
                  </Link>
                </div>

                <div className="space-y-3">
                  {pluggyItems.map((item) => {
                    const statusMeta = getItemStatusMeta(item);
                    const initials = getInitials(
                      item.institutionName ?? "Banco",
                    );

                    return (
                      <article
                        key={item.id}
                        className="flex flex-col gap-4 rounded-xl border border-slate-100 p-4 transition-colors hover:border-[#c8eae4] sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="flex items-center gap-4">
                          <span className="flex size-12 items-center justify-center rounded-lg bg-slate-100 text-sm font-bold text-[#00766d]">
                            {initials}
                          </span>
                          <div>
                            <h3 className="font-semibold text-[#181c1d]">
                              {item.institutionName ?? "Instituição conectada"}
                            </h3>
                            <p className="text-xs text-[#506383]">
                              {statusMeta.detail}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <span
                            className={`rounded-full px-3 py-1 text-[11px] font-bold ${statusMeta.className}`}
                          >
                            {statusMeta.label}
                          </span>
                          <Link
                            to="/connect-accounts"
                            className="text-sm font-medium text-[#00766d] hover:underline"
                          >
                            Gerenciar
                          </Link>
                        </div>
                      </article>
                    );
                  })}

                  {!isLoading && pluggyItems.length === 0 && (
                    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-[#506383]">
                      Nenhuma instituição conectada até o momento.
                    </div>
                  )}
                </div>
              </section>

              <section className="flex items-start gap-4 rounded-xl border border-slate-200 bg-slate-100 p-5">
                <ShieldCheck
                  className="mt-1 size-7 shrink-0 text-[#00766d]"
                  aria-hidden="true"
                />
                <div>
                  <h2 className="font-semibold text-[#181c1d]">
                    Seus dados continuam sob seu controle
                  </h2>
                  <p className="mt-2 text-sm leading-7 text-[#506383]">
                    O FluxCred usa integrações de Open Finance para consolidar
                    histórico financeiro e avaliação de crédito. A gestão das
                    conexões pode ser feita a qualquer momento na tela de
                    instituições.
                  </p>
                </div>
              </section>
            </div>
          </div>
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
