<!-- SEED: re-run /impeccable document once there's code to capture the actual tokens and components. -->
---
name: CRM Pessoal
description: CRM pessoal dark, denso e silencioso — um clique a menos por contato.
---

# Design System: CRM Pessoal

## 1. Overview

**Creative North Star: "The Quiet Desk"**

Interface de ferramenta pessoal no tema escuro: densidade limpa, ações à mão, zero teatro visual. Inspirada em Linear (hierarquia e densidade), Raycast (ações imediatas) e Vercel (superfícies escuras contidas). Motion só onde há feedback útil — transição rápida, sem coreografia.

A superfície é neutra e fria (zinc/slate). Um único accent discreto (azul ou ciano) aparece em ≤10% da UI: foco, CTA primário, estado ativo. Tipografia: uma família sans geométrica em vários pesos.

Rejeita explicitamente landing "AI startup" roxa com glow, SaaS genérico, CRM enterprise inchado e dashboards de métricas vazias.

**Key Characteristics:**
- Tema escuro, neutros frios, accent único e raro
- Densidade de app desktop, não de marketing
- Motion responsive: feedback e transition, sem entrada teatral
- Sidebar fixa + header simples + cards modernos com sombra suave

## 2. Colors

Estratégia **Restrained**: neutros frios carregam a UI; accent ≤10%.

### Primary
- **Quiet Cyan/Blue** `[to be resolved during implementation]`: único accent — botão primário, item ativo da sidebar, foco, links de ação. Raridade é o ponto.

### Neutral
- **Void / Surface / Elevated** `[to be resolved during implementation]`: ramp escura zinc/slate para body, sidebar, cards e header.
- **Ink / Muted / Faint** `[to be resolved during implementation]`: texto e secondary text com contraste ≥4.5:1 no body.

### Named Rules
**The One Accent Rule.** O accent aparece em ≤10% de qualquer tela. Se a UI parecer "colorida", corte accent.

**The No Purple Rule.** Nunca roxo, índigo marketing ou glow neon. Neutros frios + um azul/ciano contido.

## 3. Typography

**Display Font:** `[font pairing to be chosen at implementation — geometric sans]`
**Body Font:** mesma família, pesos médios
**Label/Mono Font:** opcional só se labels de status pedirem; default = geometric sans

**Character:** Sans geométrica técnica (precisão Linear/Vercel), nunca display serif, nunca script.

### Hierarchy
- **Display** `[to be resolved]`: títulos de página raros (ex.: "Próximo Cliente" no modo prospecção).
- **Headline** `[to be resolved]`: nomes de empresa / seções.
- **Title** `[to be resolved]`: cards e headers de painel.
- **Body** `[to be resolved]`: dados e observações; line-length ~65–75ch em prosa.
- **Label** `[to be resolved]`: status, filtros, metadados — sem all-caps tracked em toda seção.

### Named Rules
**The One Family Rule.** Uma sans geométrica. Ênfase via weight e tamanho, nunca via segunda família decorativa.

## 4. Elevation

Híbrido contido: superfícies tonais (bg → surface → elevated) + sombras suaves em cards e popovers. Flat no repouso da sidebar/header; lift leve em cards e modais.

Motion energy **responsive** → profundidade estável, sem parallax nem glassmorphism decorativo.

### Named Rules
**The Soft Lift Rule.** Sombra só para separar superfície do fundo escuro. Se parecer flutuador neon, está errado.

## 5. Components

*(Seed: omitido — componentes ainda não existem. Re-rodar `/impeccable document` após a primeira implementação.)*

## 6. Do's and Don'ts

### Do:
- **Do** manter densidades de app (Linear/Raycast): muita informação, pouco chrome.
- **Do** colocar ações de contato (WhatsApp, e-mail, status, follow-up) no contexto do cliente.
- **Do** usar accent só em CTA e estado ativo.
- **Do** respeitar `prefers-reduced-motion` (fade ou instant).

### Don't:
- **Don't** parecer landing "AI startup" roxa com glow.
- **Don't** imitar SaaS genérico (planos, permissões, multi-tenant).
- **Don't** montar dashboard inchado com métricas vazias.
- **Don't** copiar CRM enterprise (HubSpot/Salesforce).
- **Don't** usar border-left colorida >1px, gradient text, ou glassmorphism decorativo.
- **Don't** colocar eyebrow all-caps tracked em cima de cada seção.
