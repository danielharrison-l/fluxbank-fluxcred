import { Inbox, Network, Search, Send, Tag, Zap } from "lucide-react";

const features = [
  {
    icon: Zap,
    title: "Score em tempo real",
    description:
      "Calcule seu score com base nas contas conectadas e no comportamento financeiro recente.",
  },
  {
    icon: Inbox,
    title: "Contas conectadas",
    description:
      "Centralize saldos e transações em uma visão clara para acelerar sua análise de crédito.",
  },
  {
    icon: Search,
    title: "Análise transparente",
    description:
      "Entenda os fatores que influenciam sua aprovação, como renda, estabilidade e gastos.",
  },
  {
    icon: Network,
    title: "Conexões automáticas",
    description:
      "Use Open Finance para sincronizar dados com segurança e reduzir etapas manuais.",
  },
  {
    icon: Tag,
    title: "Solicitação simples",
    description:
      "Peça crédito direto pela plataforma com limite recomendado a partir do seu score.",
  },
  {
    icon: Send,
    title: "Acompanhamento continuo",
    description:
      "Acompanhe contas, transações, score e solicitações em um único dashboard.",
  },
];

export function Features() {
  return (
    <section id="features" className="scroll-mt-20 px-5 py-16 lg:py-24">
      <div className="container mx-auto">
        <div className="mx-auto mb-10 max-w-3xl text-center lg:mb-16">
          <h2 className="mb-4 text-balance text-3xl font-bold sm:text-4xl">
            Feito para crédito rápido, claro e conectado
          </h2>
          <p className="text-pretty text-lg leading-relaxed text-muted-foreground">
            A FluxCred reduz atrito em cada etapa: conexão, análise, score e
            solicitação.
          </p>
        </div>

        <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group relative rounded-lg border border-border bg-card/30 p-6 transition-all duration-300 hover:border-foreground/30 hover:shadow-lg"
            >
              <div className="mb-4 inline-flex rounded-lg bg-accent/30 p-3 transition-colors group-hover:bg-accent">
                <feature.icon className="h-6 w-6 text-foreground" />
              </div>
              <h3 className="mb-3 text-xl font-semibold">{feature.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
