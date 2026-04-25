export function Footer() {
  return (
    <footer className="mt-16 border-t border-border px-5 py-12 lg:mt-24">
      <div className="container mx-auto">
        <div className="mb-8 max-w-sm">
          <a
            href="/"
            className="flex items-center gap-2 text-lg font-semibold transition-opacity hover:opacity-80"
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

        <div className="flex flex-col items-start justify-between gap-4 border-border pt-8 sm:flex-row">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} FluxCred. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
