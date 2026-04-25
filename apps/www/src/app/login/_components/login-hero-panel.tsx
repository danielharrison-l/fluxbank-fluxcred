import { BriefcaseBusiness, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BrandMark } from "./brand-mark";

const highlights = [
  {
    title: "Cadastro simples",
    description: "Poucos dados para começar sua avaliacao com clareza.",
    icon: BriefcaseBusiness,
  },
  {
    title: "Open Finance humano",
    description:
      "Sua movimentacao ajuda a provar seu potencial com menos burocracia.",
    icon: ShieldCheck,
  },
];

export function LoginHeroPanel() {
  return (
    <aside className="relative flex min-h-svh overflow-hidden bg-[#005b64] px-5 py-8 text-primary-foreground sm:px-8 lg:items-center lg:justify-center lg:px-12 lg:py-16 xl:px-16">
      <div
        className="absolute inset-0 bg-cover bg-center opacity-20"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1400&q=80')",
        }}
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 bg-gradient-to-br from-[#004c55] via-[#006d77]/95 to-[#128074]"
        aria-hidden="true"
      />

      <div className="relative z-10 max-w-lg space-y-7 lg:space-y-10">
        <BrandMark />

        <div className="space-y-4 lg:space-y-5">
          <h1 className="font-mono text-3xl font-bold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
            Abra sua conta FluxCred em poucos passos.
          </h1>
          <p className="text-base leading-7 text-white/88 lg:text-lg lg:leading-8">
            Informe seus dados, conecte suas contas quando quiser e acompanhe
            uma analise de credito feita para autonomos e profissionais
            liberais.
          </p>
        </div>

        <div className="grid gap-3 sm:max-w-sm sm:grid-cols-2 lg:hidden">
          <Button
            asChild
            className="h-12 rounded-lg bg-white text-sm font-semibold uppercase tracking-[0.08em] text-[#005b64] hover:bg-white/90"
          >
            <Link to="/register?view=form">Criar conta</Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="h-12 rounded-lg border-white/45 bg-white/8 text-sm font-semibold uppercase tracking-[0.08em] text-white hover:bg-white/14 hover:text-white"
          >
            <Link to="/login">Entrar</Link>
          </Button>
        </div>

        <div className="grid gap-4 pt-1 sm:grid-cols-2 lg:block lg:space-y-6 lg:pt-4">
          {highlights.map((item) => {
            const Icon = item.icon;

            return (
              <div className="flex gap-3 lg:gap-4" key={item.title}>
                <span className="mt-1 flex size-9 shrink-0 items-center justify-center rounded-lg bg-white/14 text-[#9ff0fb]">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <div className="space-y-1">
                  <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-white/72">
                    {item.title}
                  </h2>
                  <p className="text-sm leading-6 text-white/90 lg:text-base lg:leading-7">
                    {item.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
