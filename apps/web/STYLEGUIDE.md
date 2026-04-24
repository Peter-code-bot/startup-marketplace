# VICINO — Style Guide

## Tokens semánticos (los únicos válidos)

| Token Tailwind | Uso |
|---|---|
| `bg-background` | Fondo raíz de página |
| `bg-card` | Cards destacadas, contenedores principales |
| `bg-muted` | Sub-contenedores, inputs, chips, hovers |
| `bg-popover` | Modales, dropdowns, tooltips |
| `bg-primary` | CTAs primarios y elementos de marca (#FF3B30) |
| `bg-foreground` | CTAs secundarios invertidos |
| `text-foreground` | Texto principal |
| `text-muted-foreground` | Texto secundario |
| `border-border` | Bordes estándar |

## Prohibido

- `bg-white`, `bg-neutral-50/100/200`, `bg-gray-50/100/200`
- `bg-slate-*`, `bg-zinc-50/100/200`, `bg-stone-50/100/200`
- Hex hardcoded: `bg-[#fff]`, `bg-[#fafafa]`
- Tokens removidos: `bg-bone`, `bg-cream`, `bg-warm`, `bg-terracota`

## Antes de merge

- `bash scripts/check-no-white-bg.sh` debe pasar
- `npx next build` debe pasar
- Recorrer la pantalla nueva en dark + light mode
