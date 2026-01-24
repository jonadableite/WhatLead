## Objetivo visual
- Deixar **todos os botões** com estética “Dark Chrome UI” (gradiente, brilho suave, borda luminosa, sensação de vidro), como na imagem.
- Deixar **cards** mais modernos (glass + glow + borda com shine), reduzindo CSS “por página” e centralizando no design system.

## 1) Botões (design system)
- Atualizar o componente [button.tsx](file:///d:/Projeto/WhatLead/apps/web/src/components/ui/button.tsx):
  - Introduzir variantes `chrome` e `chromeOutline` (e manter `destructive`, `ghost`, `link`).
  - Tornar `default`/`outline` visualmente equivalentes ao estilo chrome (para garantir que “todos os botões” fiquem consistentes sem refatorar o app inteiro).
  - Injetar efeito de brilho/borda usando o componente existente [ShineBorder](file:///d:/Projeto/WhatLead/apps/web/src/components/ui/shine-border.tsx) internamente quando a variante for chrome.
  - Ajustar radius e sombras para “pill/glass” (mais próximo da imagem) sem perder acessibilidade (focus ring e contraste).

## 2) Cards (design system)
- Atualizar o componente [card.tsx](file:///d:/Projeto/WhatLead/apps/web/src/components/ui/card.tsx):
  - Alterar `Card` default para `rounded-2xl`, `bg` com leve gradiente e `shadow` premium.
  - Aplicar `ShineBorder` como overlay sutil para dar “chroma edge” (pointer-events-none).
  - Manter compatibilidade com `size` e subcomponentes (`CardHeader`, `CardContent`, etc.).

## 3) Remover overrides locais e padronizar telas
- Ajustar telas que hoje “reimplementam” card/glass via `className` (ex.: instâncias e org) para confiar no `Card` do design system:
  - [instances-dashboard.tsx](file:///d:/Projeto/WhatLead/apps/web/src/app/(dashboard)/instances/instances-dashboard.tsx)
  - [instance-details-page-client.tsx](file:///d:/Projeto/WhatLead/apps/web/src/app/(dashboard)/instances/%5Bid%5D/instance-details-page-client.tsx)
  - [instance-health-page-client.tsx](file:///d:/Projeto/WhatLead/apps/web/src/app/(dashboard)/instances/%5Bid%5D/health/instance-health-page-client.tsx)
  - [new-instance-page-client.tsx](file:///d:/Projeto/WhatLead/apps/web/src/app/(dashboard)/instances/new/new-instance-page-client.tsx)
  - [instance-gate.tsx](file:///d:/Projeto/WhatLead/apps/web/src/components/instances/instance-gate.tsx)
  - (e também páginas de organization/auth onde houver o mesmo padrão)
- Ajustar botões com `variant="outline"` que hoje recebem classes manuais para usar `chromeOutline` (ou só `outline` se eu fizer o mapping global).

## 4) Verificação
- Rodar `pnpm -F web build` para garantir TypeScript e Next build.
- Smoke test visual nas páginas /instances e /organization para confirmar que:
  - botões ficaram “chroma”
  - cards ficaram modernos
  - sem regressões de layout

Se você aprovar, eu aplico as mudanças mantendo a API atual de `Button`/`Card` (para não quebrar o resto do app) e deixo o look alinhado com a referência da imagem.