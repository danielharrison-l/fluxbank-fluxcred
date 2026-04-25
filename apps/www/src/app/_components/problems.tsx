import { AlertCircle, FolderX, Layers, Link2Off } from "lucide-react";

const problems = [
  {
    icon: AlertCircle,
    title: "Crédito pouco personalizado",
    description:
      "Análises tradicionais ignoram parte importante do fluxo financeiro de autônomos e profissionais liberais.",
  },
  {
    icon: FolderX,
    title: "Dados espalhados",
    description:
      "Contas, saldos e transações ficam em bancos diferentes, dificultando uma avaliação rápida.",
  },
  {
    icon: Layers,
    title: "Processos lentos",
    description:
      "Solicitações manuais pedem documentos demais e atrasam a resposta para quem precisa de crédito.",
  },
  {
    icon: Link2Off,
    title: "Pouca visibilidade",
    description:
      "Sem clareza dos fatores de risco, fica difícil entender como melhorar o próprio score.",
  },
];

export function Problems() {
  return (
    <section id="problem" className="scroll-mt-20 px-5 py-16 lg:py-24">
      <div className="container mx-auto">
        <div className="mx-auto mb-10 max-w-3xl text-center lg:mb-16">
          <h2 className="mb-4 text-balance text-3xl font-bold sm:text-4xl">
            O desafio do crédito para autônomos
          </h2>
          <p className="text-pretty text-lg leading-relaxed text-muted-foreground">
            A FluxCred usa dados autorizados via Open Finance para reduzir
            incerteza e gerar uma avaliação mais completa.
          </p>
        </div>

        <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-2">
          {problems.map((problem) => (
            <div
              key={problem.title}
              className="group relative rounded-lg border border-border bg-card/30 p-6 transition-all duration-300 hover:border-foreground/30"
            >
              <div className="flex items-start gap-4">
                <div className="rounded-lg bg-accent/30 p-3 transition-colors group-hover:bg-accent">
                  <problem.icon className="h-6 w-6 text-foreground" />
                </div>
                <div>
                  <h3 className="mb-2 text-lg font-semibold">
                    {problem.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {problem.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
