import { Eye, EyeOff, LogIn, ShieldCheck, UserPlus } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { storeAccessToken } from "@/lib/auth";
import { getApiBaseUrl, parseJsonResponse } from "@/lib/api";

type AuthFormMode = "login" | "register";

type LoginFormProps = {
  mode?: AuthFormMode;
  showOnMobile?: boolean;
};

export function LoginForm({
  mode = "register",
  showOnMobile = false,
}: LoginFormProps) {
  const navigate = useNavigate();
  const isLogin = mode === "login";
  const Icon = isLogin ? LogIn : UserPlus;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isLogin) {
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const formData = new FormData(event.currentTarget);
    const apiBaseUrl = getApiBaseUrl();
    const payload = {
      name: String(formData.get("name") ?? "").trim(),
      email: String(formData.get("email") ?? "")
        .trim()
        .toLowerCase(),
      phone: String(formData.get("phone") ?? "").trim() || undefined,
      document:
        String(formData.get("document") ?? "").replace(/\D/g, "") || undefined,
      password: String(formData.get("password") ?? ""),
    };

    try {
      if (!payload.name || !payload.email || !payload.password) {
        throw new Error("Preencha nome, e-mail e senha.");
      }

      if (payload.password.length < 8) {
        throw new Error("A senha precisa ter pelo menos 8 caracteres.");
      }

      const response = await fetch(`${apiBaseUrl}/auth/register`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await parseJsonResponse<{ message?: string | string[] }>(
          response,
        ).catch(() => null);
        const message =
          typeof data?.message === "string"
            ? data.message
            : Array.isArray(data?.message)
              ? data.message.join(", ")
            : "Não foi possível criar sua conta.";
        throw new Error(
          message === "Email already registered"
            ? "Este e-mail ja esta cadastrado."
            : message,
        );
      }

      const data = await parseJsonResponse<{ accessToken?: string }>(response);

      if (!data?.accessToken) {
        throw new Error("A API não retornou o token de acesso.");
      }

      storeAccessToken(data.accessToken);
      navigate("/dashboard");
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Não foi possível criar sua conta.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section
      className={
        showOnMobile
          ? "flex min-h-svh items-center justify-center overflow-y-auto bg-[#fbfdfd] px-5 py-6 sm:px-6 lg:px-10 xl:px-12"
          : "hidden min-h-svh items-center justify-center overflow-y-auto bg-[#fbfdfd] px-5 py-6 sm:px-6 lg:flex lg:px-10 xl:px-12"
      }
    >
      <div className="w-full max-w-[460px] space-y-6">
        <div className="space-y-2">
          <h1 className="font-mono text-3xl font-semibold tracking-tight text-[#181c1d]">
            {isLogin ? "Entre na sua conta" : "Crie sua conta"}
          </h1>
          <p className="text-base leading-7 text-[#3e494a]">
            {isLogin
              ? "Acesse sua análise de crédito, contas conectadas e solicitações."
              : "Cadastre seus dados para iniciar sua análise de crédito com Open Finance."}
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          {!isLogin && (
            <div className="space-y-2">
              <Label
                htmlFor="name"
                className="text-xs font-semibold uppercase tracking-[0.14em] text-[#3e494a]"
              >
                Nome completo
              </Label>
              <Input
                id="name"
                name="name"
                type="text"
                placeholder="Marina Costa"
                autoComplete="name"
                className="h-12 rounded-lg border-[#bec8ca] bg-[#f1f4f4] px-4 text-base shadow-none focus-visible:ring-primary"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label
              htmlFor="email"
              className="text-xs font-semibold uppercase tracking-[0.14em] text-[#3e494a]"
            >
              E-mail
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="exemplo@gmail.com"
              autoComplete="email"
              className="h-12 rounded-lg border-[#bec8ca] bg-[#f1f4f4] px-4 text-base shadow-none focus-visible:ring-primary"
            />
          </div>

          {!isLogin && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label
                  htmlFor="phone"
                  className="text-xs font-semibold uppercase tracking-[0.14em] text-[#3e494a]"
                >
                  Telefone
                </Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="11 99999-9999"
                  autoComplete="tel"
                  className="h-12 rounded-lg border-[#bec8ca] bg-[#f1f4f4] px-4 text-base shadow-none focus-visible:ring-primary"
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="document"
                  className="text-xs font-semibold uppercase tracking-[0.14em] text-[#3e494a]"
                >
                  CPF
                </Label>
                <Input
                  id="document"
                  name="document"
                  type="text"
                  placeholder="123.456.789-00"
                  autoComplete="off"
                  className="h-12 rounded-lg border-[#bec8ca] bg-[#f1f4f4] px-4 text-base shadow-none focus-visible:ring-primary"
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-4">
              <Label
                htmlFor="password"
                className="text-xs font-semibold uppercase tracking-[0.14em] text-[#3e494a]"
              >
                Senha
              </Label>
            </div>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder={isLogin ? "Sua senha" : "Mínimo de 8 caracteres"}
                autoComplete={isLogin ? "current-password" : "new-password"}
                className="h-12 rounded-lg border-[#bec8ca] bg-[#f1f4f4] px-4 pr-12 text-base shadow-none focus-visible:ring-primary"
              />
              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#3e494a] transition-colors hover:text-primary"
                aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                aria-pressed={showPassword}
              >
                {showPassword ? (
                  <EyeOff className="size-5" aria-hidden="true" />
                ) : (
                  <Eye className="size-5" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>

          {isLogin ? (
            <div className="flex items-center justify-between gap-4 text-sm">
              <label className="flex items-center gap-2 text-[#3e494a]">
                <input
                  type="checkbox"
                  className="size-4 rounded border-[#9fb3b5] text-primary focus:ring-primary"
                />
                Manter conectado
              </label>
              <Link to="#" className="font-medium text-primary hover:underline">
                Esqueci minha senha
              </Link>
            </div>
          ) : (
            <label className="flex items-start gap-3 rounded-lg border border-[#d8e6e7] bg-[#f0fbfa] p-3 text-sm leading-6 text-[#3e494a]">
              <input
                type="checkbox"
                className="mt-1 size-4 rounded border-[#9fb3b5] text-primary focus:ring-primary"
              />
              <span>
                Aceito os termos de uso e autorizo a análise dos dados
                informados para avaliação de crédito.
              </span>
            </label>
          )}

          <div className="flex gap-3 rounded-lg border border-[#cce7e9] bg-[#eefafa] p-3">
            <ShieldCheck
              className="mt-1 size-5 shrink-0 text-primary"
              aria-hidden="true"
            />
            <p className="text-sm leading-6 text-[#3e494a]">
              Seus dados são protegidos e usados apenas para melhorar sua
              análise de crédito.
            </p>
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="h-12 w-full rounded-lg bg-primary text-sm font-semibold uppercase tracking-[0.08em] text-primary-foreground shadow-sm hover:bg-[#004f56]"
          >
            <Icon className="size-4" aria-hidden="true" />
            {isSubmitting
              ? "Criando conta..."
              : isLogin
                ? "Entrar"
                : "Criar conta"}
          </Button>

          {errorMessage && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700">
              {errorMessage}
            </p>
          )}
        </form>

        <div className="space-y-4 border-t border-[#d7e0e1] pt-5 text-center">
          <p className="text-sm text-[#3e494a]">
            {isLogin ? "Ainda não tem conta?" : "Já tem uma conta?"}{" "}
            <Link
              to={isLogin ? "/register?view=form" : "/login?view=form"}
              className="font-semibold text-primary hover:underline"
            >
              {isLogin ? "Criar conta" : "Entrar"}
            </Link>
          </p>
          <div className="flex justify-center gap-6">
            <Link
              to="#"
              className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#6f797a] hover:text-primary"
            >
              Termos
            </Link>
            <Link
              to="#"
              className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#6f797a] hover:text-primary"
            >
              Privacidade
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
