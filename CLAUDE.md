# VICINO — Claude Code Context

## Proyecto

VICINO es un marketplace de startups. Monorepo con:
- **Framework:** Next.js (App Router) + TypeScript
- **Base de datos:** Supabase (PostgreSQL + Auth + Storage)
- **Mobile:** Capacitor (Android)
- **Package manager:** pnpm + Turborepo
- **Estructura:** `apps/web` (frontend Next.js), `packages/` (código compartido), `supabase/` (migraciones)

## Comandos

```bash
pnpm dev          # Desarrollo
pnpm build        # Build
pnpm lint         # Linting
pnpm type-check   # TypeScript check
```

## Áreas Críticas

Las siguientes áreas requieren especial atención en code review:
- `apps/web/app/api/` — API routes de Next.js
- `supabase/migrations/` — Migraciones de base de datos
- `apps/web/lib/supabase/` — Cliente y helpers de Supabase
- Lógica de autenticación y Row Level Security (RLS) en Supabase
- Cualquier lógica de pagos o transacciones

---

## REGLA DE CALIDAD — Codex Review Loop (Obligatorio Pre-Push)

Antes de hacer `git push` a cualquier branch, ejecutar el loop de revisión adversarial:

1. Decir: **"ejecuta el loop de revisión"** (activa la skill `codex-review-loop`)
2. Esperar resultado completo del loop
3. Solo hacer push si el estado final es **"LISTO PARA PUSH"**
4. Si hay issues pendientes → esperar aprobación explícita de Pedro

El adversarial review de Codex busca lo que Claude Code no ve en su propio código:
- Bugs de lógica y failure modes
- Edge cases no cubiertos
- Problemas de diseño y trade-offs
- Data loss bugs y problemas de rollback en migraciones
- Security holes (SQL injection, auth bypass, RLS gaps, etc.)

**Esta regla aplica especialmente a cambios en:**
- API routes y Server Actions de Next.js
- Migraciones de Supabase (`supabase/migrations/`)
- Políticas de Row Level Security (RLS)
- Autenticación y sesiones de usuario
- Lógica de marketplace (listings, transacciones, mensajes)
- Código Capacitor que accede a datos nativos (cámara, geolocalización)

**Comando rápido:** `/codex:adversarial-review`
**Skill completa:** Ver `codex-review-loop` en SORV-System
