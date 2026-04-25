import { Code2, CodeXml, Eye, Puzzle, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

const technology = [
  {
    icon: Eye,
    title: "Transparência",
    description:
      "Mostramos os fatores que influenciam o score para orientar decisões melhores.",
  },
  {
    icon: Code2,
    title: "API integrada",
    description:
      "O dashboard consome dados reais da API para contas, transações, score e solicitações.",
  },
  {
    icon: Users,
    title: "Foco no usuário",
    description:
      "A experiência foi pensada para quem precisa de crédito com menos burocracia.",
  },
  {
    icon: Puzzle,
    title: "Open Finance",
    description:
      "Conexão segura com instituições financeiras para enriquecer a análise.",
  },
];

export function OpenSource() {
  return (
    <section id="open-source" className="scroll-mt-20 px-5 py-16 lg:py-24">
      <div className="container mx-auto">
        <div className="mx-auto max-w-5xl">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div className="flex flex-col">
              <h2 className="mb-6 text-center text-balance text-3xl font-bold sm:text-4xl lg:text-left">
                Tecnologia para uma análise mais justa
              </h2>
              <p className="mb-8 text-center text-lg leading-relaxed text-muted-foreground lg:text-left">
                Com dados financeiros autorizados, a FluxCred consegue avaliar
                renda, estabilidade e risco com mais contexto.
              </p>

              <div className="mb-8 space-y-4">
                {technology.map((item) => (
                  <div key={item.title} className="flex items-start gap-3">
                    <div className="mt-1 rounded-md bg-accent p-2">
                      <item.icon className="h-4 w-4 text-foreground" />
                    </div>
                    <div>
                      <h3 className="mb-1 font-semibold">{item.title}</h3>
                      <p className="text-sm leading-relaxed text-muted-foreground">
                        {item.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="self-center lg:self-start"
              >
                <a href="/register?view=form" className="flex items-center gap-2">
                  <CodeXml className="h-4 w-4" />
                  Começar agora
                </a>
              </Button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-accent blur-3xl" />
              <div className="relative rounded-lg border border-border bg-card/80 p-6 shadow-2xl backdrop-blur-sm">
                <div className="font-mono text-sm">
                  <div className="mb-4 flex items-center gap-2 border-b border-border pb-3">
                    <div className="flex gap-1.5">
                      <div className="h-3 w-3 rounded-full bg-red-500/80" />
                      <div className="h-3 w-3 rounded-full bg-yellow-500/80" />
                      <div className="h-3 w-3 rounded-full bg-green-500/80" />
                    </div>
                    <span className="text-xs text-muted-foreground">
                      fluxo-score.ts
                    </span>
                  </div>
                  <pre className="text-xs leading-relaxed">
                    <code className="text-muted-foreground">
                      <span className="text-blue-400">const</span> score ={" "}
                      <span className="text-yellow-400">calcularScore</span>
                      ({"{"}
                      {"\n  "}renda: "recorrente",
                      {"\n  "}gastos: "saudáveis",
                      {"\n  "}saldo: "estável"
                      {"\n}"}){"\n\n"}
                      <span className="text-purple-400">await</span> credito.
                      <span className="text-yellow-400">solicitar</span>({"{"}
                      {"\n  "}limiteRecomendado: score.limite
                      {"\n}"})
                    </code>
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
