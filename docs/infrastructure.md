# Infraestrutura e Deploy

Este documento descreve a infraestrutura usada para disponibilizar o FluxCred em ambiente hospedado.

## Visão Geral

O projeto foi hospedado em uma VPS da Hostinger, com Dokploy autohospedado para centralizar operação, configuração e deploy das aplicações. A exposição pública dos serviços usa Traefik como proxy reverso, com apontamento de subdomínios pela Cloudflare.

O envio de e-mails transacionais usa o plano gratuito da Resend, configurado com o domínio do projeto. Essa configuração permite enviar e-mails de verificação de conta e redefinição de senha usando um remetente do próprio domínio.

## Componentes

- VPS: servidor virtual privado contratado na Hostinger.
- Dokploy: plataforma autohospedada usada para gerenciar aplicações, variáveis de ambiente, logs, builds e deploys.
- Traefik: proxy reverso responsável por rotear os subdomínios para os serviços corretos.
- Cloudflare: gerenciamento de DNS e apontamento dos subdomínios do projeto.
- Resend: serviço de e-mail transacional usado no plano gratuito.
- PostgreSQL: banco relacional usado pela API.

## Fluxo de Deploy

O Dokploy foi usado para automatizar o deploy das aplicações. Com isso, o ambiente consegue centralizar configurações, acompanhar logs, controlar variáveis de ambiente e reduzir o trabalho manual de publicação.

Fluxo geral:

1. O código é versionado no repositório.
2. O Dokploy executa o build e o deploy dos serviços configurados.
3. O Traefik recebe as requisições públicas e direciona cada subdomínio para o serviço correspondente.
4. A Cloudflare mantém os registros DNS apontando para a VPS.
5. A API usa a Resend para envio real de e-mails em produção.

## Domínios e Subdomínios

Os subdomínios são configurados na Cloudflare e roteados pelo Traefik dentro da VPS. Esse arranjo permite separar frontend, API e demais serviços usando nomes públicos diferentes, sem expor portas internas diretamente.

## Observações

- O plano gratuito da Resend é suficiente para o volume esperado de demonstração, mas pode exigir upgrade em um cenário de uso real.
- A VPS simplifica o custo de hospedagem, porém exige responsabilidade sobre atualização, backup, segurança e monitoramento.
- O Dokploy facilita a operação, mas não substitui uma estratégia formal de observabilidade, rollback e backup.
