import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getApiBaseUrl, parseJsonResponse } from "@/lib/api";

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token") ?? "";
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  function mapResetError(message: string) {
    if (message === "Invalid reset token") {
      return "O link de redefinição é inválido.";
    }

    if (message === "Reset token expired") {
      return "O link de redefinição expirou.";
    }

    return message;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const formData = new FormData(event.currentTarget);
    const password = String(formData.get("password") ?? "");
    const confirmPassword = String(formData.get("confirmPassword") ?? "");

    try {
      if (!token) {
        throw new Error("O link de redefinição está incompleto.");
      }

      if (password.length < 8) {
        throw new Error("A senha precisa ter pelo menos 8 caracteres.");
      }

      if (password !== confirmPassword) {
        throw new Error("As senhas não coincidem.");
      }

      const response = await fetch(`${getApiBaseUrl()}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await parseJsonResponse<{ message?: string }>(response).catch(
        () => null,
      );

      if (!response.ok) {
        throw new Error(data?.message ?? "Não foi possível redefinir a senha.");
      }

      setSuccessMessage(
        data?.message ?? "Senha redefinida. Faça login com a nova senha.",
      );
      window.setTimeout(() => {
        navigate("/login");
      }, 1600);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? mapResetError(error.message)
          : "Não foi possível redefinir a senha.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-svh items-center justify-center bg-[#f7fafa] px-5 py-10">
      <section className="w-full max-w-[480px] rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="font-mono text-3xl font-semibold text-[#181c1d]">
          Criar nova senha
        </h1>
        <p className="mt-3 text-sm leading-7 text-[#506383]">
          Defina uma nova senha para sua conta FluxCred.
        </p>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="password">Nova senha</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="Mínimo de 8 caracteres"
              className="h-12 rounded-xl border-slate-200 bg-slate-50 shadow-none"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmar senha</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              placeholder="Repita a nova senha"
              className="h-12 rounded-xl border-slate-200 bg-slate-50 shadow-none"
            />
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="h-12 w-full rounded-xl bg-[#00766d] text-white hover:bg-[#005f58]"
          >
            {isSubmitting ? "Atualizando..." : "Atualizar senha"}
          </Button>

          {successMessage && (
            <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {successMessage}
            </p>
          )}

          {errorMessage && (
            <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {errorMessage}
            </p>
          )}
        </form>

        <div className="mt-6 text-center text-sm text-[#506383]">
          <Link to="/login" className="font-semibold text-[#00766d] hover:underline">
            Voltar para o login
          </Link>
        </div>
      </section>
    </main>
  );
}
