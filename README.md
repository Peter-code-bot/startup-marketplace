# VICINO — Tu mercado de confianza

Marketplace multi-vendor para Mexico. Conecta compradores con vendedores de productos y servicios.

## Stack
- **Framework:** Next.js 16 (App Router) + TypeScript
- **UI:** Tailwind CSS + shadcn/ui
- **Backend:** Supabase (Auth, PostgreSQL, Storage, Realtime)
- **Monorepo:** Turborepo + pnpm
- **Deploy:** Vercel (pendiente)

## Setup local

### Requisitos
- Node.js 18+
- pnpm 9+ (`npm install -g pnpm`)

### Instalacion
```bash
git clone https://github.com/Peter-code-bot/startup-marketplace.git
cd startup-marketplace
pnpm install
```

### Variables de entorno
Crea `apps/web/.env.local` copiando el ejemplo:
```bash
cp apps/web/.env.example apps/web/.env.local
```
Pedir las credenciales reales de Supabase a Pedro.

### Desarrollo
```bash
pnpm dev
# Abre http://localhost:3000
```

### Build
```bash
pnpm turbo build
```

## Estructura del proyecto
```
startup-marketplace/
├── apps/web/              # Next.js app
│   ├── app/               # Paginas (App Router)
│   │   ├── (auth)/        # Login, Register
│   │   ├── (marketplace)/ # Home, Buscar, Producto, Perfil
│   │   ├── (account)/     # Historial
│   │   ├── seller/        # Dashboard vendedor
│   │   └── admin/         # Panel admin
│   ├── components/        # Componentes UI
│   │   ├── layout/        # Header, BottomNav, Footer, Sidebars
│   │   ├── product/       # ProductCard
│   │   └── shared/        # SellerBadge, RatingStars, PriceDisplay
│   └── lib/               # Supabase clients, utils
├── packages/shared/       # Tipos, validadores, constantes
└── supabase/              # Migraciones y Edge Functions
```

## Rutas de la app (29)
| Ruta | Descripcion |
|------|-------------|
| `/` | Home — categorias + productos recientes |
| `/login` | Login email + Google OAuth |
| `/register` | Registro |
| `/buscar` | Busqueda full-text + filtros |
| `/[categoria]/[slug]` | Detalle producto (SEO) |
| `/vender` | Publicar producto |
| `/chat` | Lista de conversaciones |
| `/chat/[id]` | Chat real-time + confirmacion de venta |
| `/historial` | Ventas/compras con tabs |
| `/perfil` | Editar perfil + activar vendedor |
| `/seller` | Dashboard vendedor |
| `/seller/listings` | Gestion de listings |
| `/seller/ventas` | Historial ventas |
| `/seller/reviews` | Reviews recibidas/dejadas |
| `/seller/analytics` | Graficas Recharts |
| `/seller/verificacion` | Upload documentos INE |
| `/seller/cupones` | CRUD cupones informativos |
| `/admin` | Dashboard admin |
| `/admin/users` | Gestion usuarios + roles |
| `/admin/verifications` | Aprobar/rechazar verificaciones |
| `/admin/disputes` | Resolver disputas |
| `/admin/moderation` | Reviews reportadas |
| `/terminos` | Terminos y condiciones |
| `/privacidad` | Aviso de privacidad |

## Flujo de trabajo (colaboracion)

### Pedro (backend/logica) → rama `master`
- Supabase, migraciones, Server Actions, logica de negocio
- Archivos: `lib/`, `actions.ts`, `supabase/`, `hooks/`, `stores/`

### Socio (diseno/UI) → rama `design`
- Componentes visuales, estilos, animaciones, UX
- Archivos: `components/`, `styles/`, assets
- Cuando tenga algo listo: Pull Request `design` → `master`

### Regla de oro
- **Socio:** toca `components/` y `styles/`
- **Pedro:** toca `lib/`, `actions.ts`, `supabase/`
- **Ambos:** si necesitan tocar archivos del otro, comunicar primero

## Modelo de negocio
- **Sin pagos en la plataforma** — VICINO solo conecta, no intermedia dinero
- **Confirmacion mutua de venta** — comprador y vendedor confirman en el chat
- **Reviews bidireccionales** — comprador evalua vendedor Y vendedor evalua comprador
- **Trust levels (5):** Nuevo → Verificado → Confiable → Estrella → Elite
- **Monetizacion futura:** planes premium, featured listings, publicidad

## Base de datos (Supabase)
### Tablas principales
profiles, products_services, product_variants, media_assets, sale_confirmations, reviews, chats, messages, favorites, coupons, notifications, disputes, seller_verification, trust_level_verification, user_roles, categories, bookings, service_availability

### Trust Levels
| Nivel | Nombre | Puntos | Color |
|-------|--------|--------|-------|
| 0 | Nuevo | 0-49 | Gris |
| 1 | Verificado | 50-199 | Azul |
| 2 | Confiable | 200-499 | Verde |
| 3 | Estrella | 500-999 | Morado |
| 4 | Elite | 1000+ | Dorado |
