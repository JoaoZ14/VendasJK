---
name: CRM Pessoal
description: CRM pessoal dark, denso e direto — um clique a menos por contato.
colors:
  bg: "oklch(0.09 0 0)"
  surface: "oklch(0.135 0 0)"
  elevated: "oklch(0.17 0 0)"
  border: "oklch(0.22 0 0)"
  border-hover: "oklch(0.28 0 0)"
  ink: "oklch(0.95 0.008 230)"
  muted: "oklch(0.62 0.015 230)"
  faint: "oklch(0.45 0.01 230)"
  primary: "oklch(0.65 0.12 230)"
  primary-hover: "oklch(0.70 0.13 230)"
  primary-muted: "oklch(0.28 0.06 230)"
  accent: "oklch(0.72 0.11 195)"
  danger: "oklch(0.65 0.18 25)"
  danger-muted: "oklch(0.28 0.06 25)"
  danger-hover: "oklch(0.35 0.08 25)"
  success: "oklch(0.72 0.14 155)"
  success-muted: "oklch(0.26 0.05 155)"
  warning: "oklch(0.78 0.12 85)"
  warning-muted: "oklch(0.28 0.05 85)"
  on-primary: "oklch(0.98 0 0)"
typography:
  body:
    fontFamily: "Outfit, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  title:
    fontFamily: "Outfit, system-ui, sans-serif"
    fontSize: "1.375rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.03em"
  display:
    fontFamily: "Outfit, system-ui, sans-serif"
    fontSize: "1.75rem"
    fontWeight: 600
    lineHeight: 1.15
    letterSpacing: "-0.03em"
rounded:
  sm: "6px"
  md: "10px"
  lg: "14px"
  xl: "18px"
spacing:
  1: "4px"
  2: "8px"
  3: "12px"
  4: "16px"
  5: "20px"
  6: "24px"
  8: "32px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.md}"
    padding: "10px 16px"
    height: "38px"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
    textColor: "{colors.bg}"
  nav-active:
    backgroundColor: "{colors.primary-muted}"
    textColor: "{colors.primary}"
    rounded: "{rounded.md}"
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "16px"
---

# Design System: CRM Pessoal

## Overview

**Creative North Star: "The Quiet Desk"**

Ferramenta pessoal dark: densidade limpa, ações à mão, zero teatro. Linear (hierarquia), Raycast (ação imediata), Vercel (superfície escura contida). Motion só como feedback — transição rápida, sem coreografia.

Neutros frios (zinc). Accent ciano/azul ≤10%: foco, CTA, item ativo. Uma família sans (Outfit) em poucos pesos.

Rejeita landing "AI startup" roxa, SaaS genérico, CRM enterprise e dashboards de métricas vazias.

## Colors

Estratégia **Restrained**. Fonte de verdade: `src/styles/theme.ts` (OKLCH).

### Primary
- **primary** `oklch(0.65 0.12 230)` — CTA, links de ação, item ativo
- **accent** `oklch(0.72 0.11 195)` — destaque raro, secundário ao primary

### Neutral
- **bg / surface / elevated** — body, sidebar, cards
- **ink / muted / faint** — texto; body ≥4.5:1 no fundo escuro

### Named Rules
**The One Accent Rule.** Accent ≤10% da tela. Se parecer colorida, corte.

**The No Purple Rule.** Nunca roxo, índigo marketing ou glow neon.

## Typography

**Display / Body:** Outfit (uma família). Escala fixa em rem, não fluid clamp.

### Hierarchy
- **Display** `1.75rem` / 600 — títulos raros (ex.: nome no modo foco)
- **Title** `1.375rem` / 600 — títulos de página
- **Body** `0.875rem` / 400 — dados e listas
- **Label** `0.75–0.8125rem` — status, filtros, meta

### Named Rules
**The One Family Rule.** Só Outfit. Ênfase via weight e tamanho.

## Elevation

Superfícies tonais (bg → surface → elevated) + sombra suave em cards e popovers. Sidebar/header flat; lift leve em cards e modais. Sem glassmorphism decorativo (blur no header sticky é utilitário, não estética).

### Named Rules
**The Soft Lift Rule.** Sombra só para separar do fundo. Sem glow.

## Components

- **AppShell** — sidebar 240px + header 56px + content
- **Button** — primary / secondary / ghost; altura ~38px
- **Card** — surface + border + radius lg; sem cards aninhados
- **StatusBadge / StatusSelect** — estados do pipeline
- **Table** — lista densa de clientes
- **FocusCard** — Modo Prospecção, um lead por vez

Estados obrigatórios em controles interativos: default, hover, focus, active, disabled, loading, error.

## Do's and Don'ts

### Do
- Densidade de app (Linear/Raycast): muita informação, pouco chrome
- Ações de contato no contexto do lead
- Accent só em CTA e estado ativo
- Respeitar `prefers-reduced-motion`

### Don't
- Parecer landing AI roxa com glow
- Dashboard com métricas vazias ou 6+ KPIs competindo
- CRM enterprise / multi-tenant
- Border-left colorida >1px, gradient text, glassmorphism decorativo
- Eyebrow all-caps tracked em toda seção
- Amarrar copy/nav a um nicho (hotéis) quando o produto é CRM de vendas geral
