import { ThemeSwitcher } from "@/components/theme-switcher";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-5">
      <div className="container mx-auto flex h-16 items-center justify-between">
        <a
          href="/"
          className="flex items-center gap-2 text-lg font-semibold"
          aria-label="Pagina inicial FluxCred"
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
        <nav
          aria-label="Principal"
          className="hidden md:flex items-center gap-8 text-sm"
        >
          <a
            href="#problem"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            Desafio
          </a>
          <a
            href="#features"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            Recursos
          </a>
          <a
            href="#open-source"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            Tecnologia
          </a>
        </nav>
        <div className="flex items-center gap-2">
          <ThemeSwitcher />
        </div>
      </div>
    </header>
  );
}
