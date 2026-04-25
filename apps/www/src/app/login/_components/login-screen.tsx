import {
  CircleHelp,
  Eye,
  EyeOff,
  Lock,
  ShieldCheck,
  User,
  WalletCards,
} from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiBaseUrl, parseJsonResponse } from "@/lib/api";

export function LoginScreen() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    const formData = new FormData(event.currentTarget);

    try {
      const response = await fetch(`${apiBaseUrl}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: String(formData.get("email") ?? ""),
          password: String(formData.get("password") ?? ""),
        }),
      });

      if (!response.ok) {
        throw new Error("E-mail ou senha invalidos.");
      }

      const data = await parseJsonResponse<{ accessToken?: string }>(response);

      if (!data?.accessToken) {
        throw new Error("A API nao retornou o token de acesso.");
      }

      window.localStorage.setItem("accessToken", data.accessToken);
      window.localStorage.setItem("fluxcred.accessToken", data.accessToken);
      navigate("/dashboard");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Nao foi possivel entrar.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="relative flex min-h-svh overflow-hidden bg-[#f6fafc] px-5 py-8 text-[#506383]">
      <div
        className="absolute left-[-120px] top-[-160px] size-[520px] rounded-full bg-[#bde8e3]/55 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="absolute bottom-[-220px] right-[-180px] size-[620px] rounded-full bg-[#dff3fb]/70 blur-3xl"
        aria-hidden="true"
      />

      <div className="relative z-10 mx-auto flex w-full max-w-[1180px] flex-col items-center justify-center gap-6">
        <section className="w-full max-w-[438px] rounded-xl border border-[#d8e3ee] bg-white px-10 py-12 shadow-[0_24px_70px_rgba(47,78,108,0.10)] sm:px-16 sm:py-16">
          <div className="mb-14 text-center">
            <div className="mb-3 flex items-center justify-center gap-2 text-[#0c9a8d]">
              <span className="flex size-8 items-center justify-center rounded-md bg-[#0c9a8d] text-white">
                <WalletCards className="size-5" aria-hidden="true" />
              </span>
              <span className="text-4xl font-semibold">FluxCred</span>
            </div>
            <p className="mx-auto max-w-[280px] text-lg leading-7 text-[#506383]">
              Credito sob medida para autonomos e profissionais liberais
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label
                htmlFor="email"
                className="text-xs font-bold uppercase tracking-[0.16em] text-[#506383]"
              >
                E-mail ou usuario
              </Label>
              <div className="relative">
                <User
                  className="absolute left-7 top-1/2 size-5 -translate-y-1/2 text-[#8a9ab2]"
                  aria-hidden="true"
                />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="seuemail@exemplo.com"
                  autoComplete="email"
                  className="h-14 rounded-lg border-[#d5e0eb] bg-[#f8fafc] pl-16 pr-4 text-lg text-[#506383] shadow-none placeholder:text-[#69778b] focus-visible:ring-[#0c9a8d]"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-4">
                <Label
                  htmlFor="password"
                  className="text-xs font-bold uppercase tracking-[0.16em] text-[#506383]"
                >
                  Senha
                </Label>
                <Link
                  to="#"
                  className="text-sm font-bold text-[#0c9a8d] hover:underline"
                >
                  Esqueci a senha
                </Link>
              </div>
              <div className="relative">
                <Lock
                  className="absolute left-7 top-1/2 size-5 -translate-y-1/2 text-[#8a9ab2]"
                  aria-hidden="true"
                />
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="h-14 rounded-lg border-[#d5e0eb] bg-[#f8fafc] pl-16 pr-14 text-lg text-[#506383] shadow-none placeholder:text-[#69778b] focus-visible:ring-[#0c9a8d]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-[#69778b] transition-colors hover:text-[#0c9a8d]"
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

            <label className="flex items-center gap-2 text-lg text-[#506383]">
              <input
                type="checkbox"
                className="size-5 rounded border-[#d5e0eb] text-[#0c9a8d] focus:ring-[#0c9a8d]"
              />
              Manter conectado no meu dispositivo
            </label>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="h-[72px] w-full rounded-lg bg-[#15998d] text-lg font-semibold text-white shadow-[0_10px_18px_rgba(12,119,109,0.22)] hover:bg-[#0f8278]"
            >
              {isSubmitting ? "Entrando..." : "Entrar"}
            </Button>

            {errorMessage && (
              <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700">
                {errorMessage}
              </p>
            )}
          </form>

          <div className="mt-20 text-center">
            <p className="mx-auto mb-3 max-w-[320px] text-lg leading-7 text-[#506383]">
              Trabalha por conta propria e precisa de credito?
            </p>
            <Link
              to="/register?view=form"
              className="text-lg font-bold text-[#0c9a8d] hover:underline"
            >
              Crie sua conta gratis
            </Link>
          </div>

          <div className="mt-8 border-t border-[#d5e0eb] pt-8">
            <div className="flex gap-3">
              <ShieldCheck
                className="mt-1 size-5 shrink-0 text-[#0c9a8d]"
                aria-hidden="true"
              />
              <p className="text-sm leading-6 text-[#506383]">
                Sua seguranca e nossa prioridade. Dados protegidos com o mesmo
                nivel de seguranca dos grandes bancos.
              </p>
            </div>
          </div>
        </section>

        <p className="text-center text-xs font-bold uppercase tracking-[0.18em] text-[#8a9ab2]">
          FluxCred Solucoes Financeiras © 2024
        </p>
      </div>

      <aside className="absolute bottom-10 right-10 hidden w-[320px] items-center gap-4 rounded-xl border border-[#d8e3ee] bg-white px-8 py-7 shadow-[0_18px_50px_rgba(47,78,108,0.12)] xl:flex">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-[#e5f7f4] text-[#0c9a8d]">
          <CircleHelp className="size-6" aria-hidden="true" />
        </span>
        <div>
          <h2 className="text-base font-bold text-[#00766d]">
            Precisa de ajuda?
          </h2>
          <p className="text-sm text-[#506383]">
            Fale com nosso suporte humanizado
          </p>
        </div>
      </aside>
    </main>
  );
}
