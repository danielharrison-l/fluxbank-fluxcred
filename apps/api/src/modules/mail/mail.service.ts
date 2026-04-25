import { Injectable, ServiceUnavailableException } from "@nestjs/common";
import { Resend } from "resend";

type VerificationEmailInput = {
  email: string;
  name: string;
  token: string;
};

type PasswordResetEmailInput = {
  email: string;
  name: string;
  token: string;
};

@Injectable()
export class MailService {
  private resendClient: Resend | null = null;

  async sendEmailVerification(input: VerificationEmailInput) {
    const link = `${this.getAppWebUrl()}/verify-email?token=${encodeURIComponent(input.token)}&email=${encodeURIComponent(input.email)}`;

    if (this.shouldLogEmailInsteadOfSending()) {
      console.log(`Email verification link for ${input.email}: ${link}`);
      return;
    }

    await this.getResendClient().emails.send({
      from: this.getMailFrom(),
      to: input.email,
      subject: "Confirme seu e-mail no FluxCred",
      text: [
        `Olá, ${input.name}.`,
        "",
        "Confirme seu e-mail para ativar sua conta no FluxCred.",
        link,
        "",
        "Se você não criou esta conta, ignore esta mensagem.",
      ].join("\n"),
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.6;color:#181c1d">
          <h2 style="margin:0 0 16px;color:#00535b">Confirme seu e-mail</h2>
          <p>Olá, ${this.escapeHtml(input.name)}.</p>
          <p>Confirme seu e-mail para ativar sua conta no FluxCred.</p>
          <p style="margin:24px 0">
            <a href="${link}" style="display:inline-block;background:#00535b;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:10px;font-weight:700">
              Confirmar e-mail
            </a>
          </p>
          <p>Se o botão não abrir, use este link:</p>
          <p><a href="${link}">${link}</a></p>
          <p>Se você não criou esta conta, ignore esta mensagem.</p>
        </div>
      `,
    });
  }

  async sendPasswordReset(input: PasswordResetEmailInput) {
    const link = `${this.getAppWebUrl()}/reset-password?token=${encodeURIComponent(input.token)}&email=${encodeURIComponent(input.email)}`;

    if (this.shouldLogEmailInsteadOfSending()) {
      console.log(`Password reset link for ${input.email}: ${link}`);
      return;
    }

    await this.getResendClient().emails.send({
      from: this.getMailFrom(),
      to: input.email,
      subject: "Redefina sua senha do FluxCred",
      text: [
        `Olá, ${input.name}.`,
        "",
        "Recebemos um pedido para redefinir sua senha.",
        "Use o link abaixo para criar uma nova senha:",
        link,
        "",
        "Se você não solicitou a alteração, ignore esta mensagem.",
      ].join("\n"),
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.6;color:#181c1d">
          <h2 style="margin:0 0 16px;color:#00535b">Redefina sua senha</h2>
          <p>Olá, ${this.escapeHtml(input.name)}.</p>
          <p>Recebemos um pedido para redefinir sua senha.</p>
          <p style="margin:24px 0">
            <a href="${link}" style="display:inline-block;background:#00535b;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:10px;font-weight:700">
              Criar nova senha
            </a>
          </p>
          <p>Se o botão não abrir, use este link:</p>
          <p><a href="${link}">${link}</a></p>
          <p>Se você não solicitou a alteração, ignore esta mensagem.</p>
        </div>
      `,
    });
  }

  private getResendClient() {
    if (this.resendClient) {
      return this.resendClient;
    }

    const apiKey = process.env.RESEND_API_KEY?.trim();

    if (!apiKey) {
      throw new ServiceUnavailableException(
        "RESEND_API_KEY não foi configurada.",
      );
    }

    this.resendClient = new Resend(apiKey);
    return this.resendClient;
  }

  private shouldLogEmailInsteadOfSending() {
    const explicitMode = process.env.MAIL_DELIVERY_MODE?.trim().toLowerCase();

    if (explicitMode === "console") {
      return true;
    }

    return (
      !process.env.RESEND_API_KEY?.trim() &&
      process.env.NODE_ENV !== "production"
    );
  }

  private getMailFrom() {
    const from = process.env.MAIL_FROM?.trim();

    if (!from) {
      throw new ServiceUnavailableException("MAIL_FROM não foi configurada.");
    }

    return from;
  }

  private getAppWebUrl() {
    const appWebUrl = process.env.APP_WEB_URL?.trim().replace(/\/$/, "");

    if (!appWebUrl) {
      throw new ServiceUnavailableException("APP_WEB_URL não foi configurada.");
    }

    return appWebUrl;
  }

  private escapeHtml(value: string) {
    return value
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }
}
