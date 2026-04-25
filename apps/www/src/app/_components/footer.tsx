import { Github } from "lucide-react";
import { GITHUB_PROJECT_URL } from "@/lib/constants";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-border px-5 py-12 lg:mt-24">
      <div className="container mx-auto">
        <div className="mb-8 grid gap-8 md:grid-cols-2">
          <div className="col-span-1 max-w-sm">
            <a
              href="/"
              className="flex items-center gap-2 text-lg font-semibold"
              aria-label="Página inicial FluxCred"
            >
              <img
                alt="FluxCred logo"
                src="/logo.svg"
                className="dark:invert"
                width={18}
                height={18}
              />
              <span className="text-xl">FluxCred</span>
            </a>
            <p className="mt-3 text-muted-foreground">
              Crédito sob medida com Open Finance, score transparente e
              solicitação digital.
            </p>
          </div>
          <div className="col-span-1">
            <h3 className="mb-4 font-semibold">Links</h3>
            <ul className="space-y-2 text-sm" aria-label="Links">
              <li>
                <a
                  href="/register?view=form"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  Criar conta
                </a>
              </li>
              <li>
                <a
                  href="/login?view=form"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  Entrar
                </a>
              </li>
              <li>
                <a
                  href={GITHUB_PROJECT_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  GitHub
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-4 border-border pt-8 sm:flex-row">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} FluxCred. Todos os direitos
            reservados.
          </p>
          <div className="flex items-center gap-4">
            <a
              aria-label="GitHub"
              href={GITHUB_PROJECT_URL}
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              <Github aria-hidden className="h-5 w-5" />
              <span className="sr-only">GitHub</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
