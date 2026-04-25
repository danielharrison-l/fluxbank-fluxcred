import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getApiBaseUrl, parseJsonResponse } from "@/lib/api";

export default function ForgotPasswordPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const formData = new FormData(event.currentTarget);

    try {
      const response = await fetch(`${getApiBaseUrl()}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: String(formData.get("email") ?? "").trim().toLowerCase(),
        }),
      });

      const data = await parseJsonResponse<{ message?: string }>(response).catch(
        () => null,
      );

      if (!response.ok) {
        throw new Error(data?.message ?? "Não foi possível solicitar o reset.");
      }

      setSuccessMessage(
        data?.message ??
          "Se a conta existir, enviaremos instruções para redefinir a senha.",
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Não foi possível solicitar o reset.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-svh items-center justify-center bg-[#f7fafa] px-5 py-10">
      <section className="w-full max-w-[480px] rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="font-mono text-3xl font-semibold text-[#181c1d]">
          Redefinir senha
        </h1>
        <p className="mt-3 text-sm leading-7 text-[#506383]">
          Informe seu e-mail. Se a conta existir, enviaremos um link para criar
          uma nova senha.
        </p>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="seuemail@exemplo.com"
              className="h-12 rounded-xl border-slate-200 bg-slate-50 shadow-none"
            />
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="h-12 w-full rounded-xl bg-[#00766d] text-white hover:bg-[#005f58]"
          >
            {isSubmitting ? "Enviando..." : "Enviar link de redefinição"}
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
