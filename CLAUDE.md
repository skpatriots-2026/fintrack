# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

FinTrack is a single-file React personal finance dashboard (`fintrack_dashboard.tsx`) designed to run in Claude's preview environment. There is no build step, package.json, or separate dev server — the file is rendered directly by the preview runtime.

## Architecture

Everything lives in one file with these major sections:

- **Constants / metadata** (lines 1–56): `EXPENSE_CATS`, `INCOME_CATS`, `CAT_META` (colors + icons per category), `THEMES` (8 themes with CSS variable values)
- **Utility components** (lines 58–145): `CreditGauge` (SVG arc), `Ring` (SVG circle progress), `StatCard`, `Card`, `STitle`, `PBar`, `ThemePicker`
- **`App` root** (line 150): owns all state (`txns`, `budgets`, `scores`, `goals`, `themeKey`), persists to `window.storage`, applies CSS custom properties as inline vars, routes between 6 tabs
- **Tab components**: `Overview`, `Transactions`, `Budget`, `CreditTab`, `SavingsTab`, `AIAdvisor` — each receives props from `App` and manages its own local form state

### Data flow

All state lives in `App`. Tab components receive data and setters as props (spread via the `p` object at line 218). Persistence uses `window.storage.get/set` (a runtime-provided API, not `localStorage`). Theme CSS custom properties are injected as inline `style` on the root `<div>`.

### Theming

Themes are defined in `THEMES` (lines 19–29) as objects with CSS variable values. `themeVars()` returns an inline style object applied to the root element. The "system" theme delegates to dark/light based on `prefers-color-scheme`. Components reference theme values exclusively through CSS custom properties (`var(--color-background-primary)`, etc.).

### AI Advisor

Calls `https://api.anthropic.com/v1/messages` directly from the browser (model: `claude-sonnet-4-20250514`). The system prompt is built inline at call time from current app state (income, expenses, transactions, budgets, goals, credit score).

## Key Conventions

- Inline styles throughout — no CSS files, no CSS modules, no Tailwind
- Short variable names (`fmt`, `fmtK`, `cc`, `ci`, `INP`) are shared helpers at module scope
- The `INP` constant (line 116) is a shared inline style object reused across all form inputs
- Category colors/icons are always accessed via `cc(category)` and `ci(category)` helpers
- Credit utilization is computed from transactions with `category === "Credit Card Payment"` against a hardcoded $5,000 limit (line 203)
