# Gold Pharma — plataforma web

Site institucional com catálogo, tabela de valores, conteúdo educativo de saúde, integração com WhatsApp e painel administrativo protegido.

## Tecnologias

- Next.js 15 (App Router, Server Actions) + React 19 + TypeScript
- Tailwind CSS 4 (tema preto `#0A0A0A`, grafite `#191919`, dourado `#D4AF37`)
- SQLite (better-sqlite3) — banco local criado e populado automaticamente na primeira execução
- bcrypt para senhas, sessões em cookie httpOnly com token aleatório (hash SHA-256 no banco)
- Zod para validação no servidor · Vitest para testes

## Executar localmente

```bash
npm install
cp .env.example .env.local   # defina ADMIN_EMAIL e ADMIN_PASSWORD
npm run dev                  # http://localhost:3000
```

Painel: `http://localhost:3000/admin` (login com as credenciais do `.env.local`).

Produção: `npm run build && npm start`. Mantenha a pasta `data/` (banco e imagens) em armazenamento persistente e faça backup dela.

Testes: `npm test` (regras regulatórias, permissões, auditoria, formatação e WhatsApp).

## Estrutura

```
src/
  app/(site)/          páginas públicas: início, catálogo, ficha, tabela de valores, saúde, sobre, contato, políticas
  app/admin/           login, painel (produtos, categorias, saúde, site/WhatsApp, mensagens, auditoria, usuários, conta) e server actions
  app/uploads/         entrega das imagens enviadas pelo painel
  components/site/     cabeçalho, rodapé, cards, tabela, imagens cinematográficas
  components/admin/    formulários e componentes do painel
  lib/compliance.ts    regras sanitárias (fonte única do que pode ser exibido ao público)
  lib/product-service.ts  gravação de produtos com validação, permissões e auditoria
  lib/data.ts          consultas; a camada pública só devolve campos liberados
  lib/seed.ts          dados iniciais (17 itens informados, conteúdo educativo, textos-modelo)
tests/                 testes automatizados
```

## Regras de publicação

Cada produto tem status regulatório (pendente de verificação, em análise documental, regularidade confirmada, divulgação restrita, comercialização bloqueada), justificativa, fonte, data e responsável, além de controles separados para ficha pública, preço, disponibilidade e pedido via WhatsApp.

O servidor só libera um recurso quando a situação permite:

| Status | Ficha pública | Preço / disponibilidade / WhatsApp |
|---|---|---|
| Pendente, Em análise, Bloqueada | não | não |
| Divulgação restrita | sim (se marcada) | não |
| Regularidade confirmada + registro Anvisa, fonte e data | sim (se marcada) | sim (se marcados) |

Proibições vigentes ficam em `src/lib/compliance.ts` (`HARD_RULES`) e prevalecem sobre qualquer status escolhido no painel: anabolizantes da lista C5 (Portaria 344/98), princípios ativos sem uso humano autorizado, medicamentos de venda sob prescrição (RDC 96/2008) e fabricantes sem registro na Anvisa. O painel exibe “Exibição comercial bloqueada — verificar situação regulatória” nesses itens. Mudar uma dessas regras exige alteração de código revisada, com documentação oficial.

## Configurações

- **WhatsApp:** painel → Site e WhatsApp → número com DDD. Os links seguem `https://wa.me/55DDDNUMERO?text=...`; o cliente revisa e envia a mensagem manualmente.
- **Imagens:** envie fotografias próprias/licenciadas no painel (banner, treino, recuperação, nutrição, ciência, institucional, categorias, produtos). Sem imagem, o site exibe uma composição gráfica da marca como espaço reservado.
- **Textos legais:** política de privacidade, termos e informações legais vêm como modelos e devem ser revisados por assessoria jurídica.

## Supabase (opcional)

O acesso a dados está concentrado em `src/lib/db.ts`, `src/lib/data.ts` e `src/lib/product-service.ts`. Para migrar para Supabase/Postgres, reproduza o esquema de `db.ts` e substitua essas funções; as regras de `compliance.ts` não mudam.

## Créditos das fotografias padrão

Fotos gratuitas sob a [Licença Unsplash](https://unsplash.com/license) (uso comercial permitido, sem atribuição obrigatória), carregadas de `images.unsplash.com`. Podem ser trocadas no painel → Site e WhatsApp.

- Banner: Ambitious Studio / Rick Barrett — https://unsplash.com/photos/w7jYaN7GqyA
- Treino de força: Anastase Maragos — https://unsplash.com/photos/4dlhin0ghOk
- Recuperação: Hayley Kim Studios — https://unsplash.com/photos/eot-ka5dM7Q
- Nutrição: Ella Olsson — https://unsplash.com/photos/lMcRyBx4G50
- Ciência/laboratório: Nathan Rimoux — https://unsplash.com/photos/HRLTL6bmeow
- Institucional: Mohamed Fareed — https://unsplash.com/photos/rbSNsoXk-3A
