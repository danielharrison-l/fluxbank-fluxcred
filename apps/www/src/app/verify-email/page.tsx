import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getApiBaseUrl, parseJsonResponse } from "@/lib/api";

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const emailFromQuery = searchParams.get("email") ?? "";
  const sentFlag = searchParams.get("sent") === "1";
  const [verificationStatus, setVerificationStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >(token ? "loading" : "idle");
  const [message, setMessage] = useState<string | null>(
    sentFlag && !token
      ? "Enviamos um link de confirmação para o seu e-mail."
      : null,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  function mapVerificationError(message: string) {
    if (message === "Invalid verification token") {
      return "O link de confirmação é inválido.";
    }

    if (message === "Verification token expired") {
      return "O link de confirmação expirou.";
    }

    return message;
  }

  useEffect(() => {
    if (!token) {
      return;
    }

    let isMounted = true;

    async function verify() {
      try {
        const response = await fetch(`${getApiBaseUrl()}/auth/verify-email`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });

        const data = await parseJsonResponse<{ message?: string }>(response).catch(
          () => null,
        );

        if (!response.ok) {
          throw new Error(data?.message ?? "Não foi possível confirmar o e-mail.");
        }

        if (!isMounted) {
          return;
        }

        setVerificationStatus("success");
        setMessage(
          data?.message ??
            "E-mail confirmado com sucesso. Faça login para continuar.",
        );
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setVerificationStatus("error");
        setMessage(
          error instanceof Error
            ? mapVerificationError(error.message)
            : "Não foi possível confirmar o e-mail.",
        );
      }
    }

    void verify();

    return () => {
      isMounted = false;
    };
  }, [token]);

  async function handleResend(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);

    try {
      const response = await fetch(
        `${getApiBaseUrl()}/auth/resend-verification`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: String(formData.get("email") ?? "").trim().toLowerCase(),
          }),
        },
      );

      const data = await parseJsonResponse<{ message?: string }>(response).catch(
        () => null,
      );

      if (!response.ok) {
        throw new Error(data?.message ?? "Não foi possível reenviar o e-mail.");
      }

      setMessage(
        data?.message ??
          "Se a conta existir, enviaremos um novo link de confirmação.",
      );
      setVerificationStatus("idle");
    } catch (error) {
      setVerificationStatus("error");
      setMessage(
        error instanceof Error
          ? mapVerificationError(error.message)
          : "Não foi possível reenviar o e-mail.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-svh items-center justify-center bg-[#f7fafa] px-5 py-10">
      <section className="w-full max-w-[520px] rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="font-mono text-3xl font-semibold text-[#181c1d]">
          Confirmar e-mail
        </h1>
        <p className="mt-3 text-sm leading-7 text-[#506383]">
          Ative sua conta pelo link enviado ao seu e-mail. Se precisar, você
          pode solicitar um novo envio.
        </p>

        {verificationStatus === "loading" && (
          <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-[#506383]">
            Confirmando seu e-mail...
          </div>
        )}

        {message && verificationStatus !== "loading" && (
          <div
            className={
              verificationStatus === "error"
                ? "mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
                : "mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700"
            }
          >
            {message}
          </div>
        )}

        {!token && (
          <form className="mt-8 space-y-5" onSubmit={handleResend}>
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                name="email"
                type="email"
                defaultValue={emailFromQuery}
                placeholder="seuemail@exemplo.com"
                className="h-12 rounded-xl border-slate-200 bg-slate-50 shadow-none"
              />
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="h-12 w-full rounded-xl bg-[#00766d] text-white hover:bg-[#005f58]"
            >
              {isSubmitting ? "Enviando..." : "Reenviar confirmação"}
            </Button>
          </form>
        )}

        <div className="mt-6 text-center text-sm text-[#506383]">
          <Link to="/login" className="font-semibold text-[#00766d] hover:underline">
            Ir para o login
          </Link>
        </div>
      </section>
    </main>
  );
}
