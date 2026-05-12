# Dan Koe Personal Dashboard

Dashboard personal (single-user) que materializa los 10 procesos/sistemas que Dan Koe enseña: Modelo de Una Sola Persona, Ecosistema 2h, Jornada 4h, APAG, COR Notes, Trust Matrix, Ecuación de Valor, Build/Teach/Earn, MVO Pipeline, Ley de Koe.

## Stack

- **Next.js 16** (App Router, Turbopack)
- **React 19** + **TypeScript estricto**
- **Tailwind CSS 4** + **shadcn/ui**
- **Drizzle ORM** + **Postgres**
- **Auth.js v5** con magic-link de **Resend**
- **Zod** para validación de env y forms

## Setup inicial (una sola vez)

### 1. Levantar Postgres local

Requiere Docker Desktop instalado.

```bash
npm run db:up
```

Esto arranca un Postgres 16 en `localhost:5432` con db `dankoe` / user `dankoe` / pass `dankoe`.

### 2. Configurar `.env.local`

El archivo ya existe con valores placeholder. Editá estos dos:

- **`AUTH_SECRET`** — generá uno real con: `openssl rand -base64 32` (en PowerShell: `[Convert]::ToBase64String((1..32 | ForEach-Object {Get-Random -Max 256}))`)
- **`AUTH_RESEND_KEY`** — sacá una API key gratis en [resend.com](https://resend.com). Para testear sin verificar dominio, dejá `AUTH_EMAIL_FROM=onboarding@resend.dev` — sólo podés mandarte a tu propio email.

`ALLOWED_EMAIL` ya está en `germanborrello@gmail.com` — sólo ese email puede loguearse. Cambialo si querés otro.

### 3. Aplicar la migración

```bash
npm run db:migrate
```

Crea las 14 tablas (4 de Auth.js + 10 de frameworks).

### 4. Arrancar el dev server

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000). Te redirige a `/login`. Ingresá tu email autorizado → recibís un magic link por Resend → click → estás dentro.

## Scripts

| Comando | Qué hace |
|---|---|
| `npm run dev` | Dev server con Turbopack |
| `npm run build` | Production build |
| `npm run start` | Production server |
| `npm run lint` | ESLint |
| `npm run db:up` | Levanta Postgres en Docker |
| `npm run db:down` | Apaga el Postgres de Docker |
| `npm run db:generate` | Regenera migración desde el schema |
| `npm run db:migrate` | Aplica migraciones pendientes |
| `npm run db:push` | Push directo del schema (sin migración — sólo dev) |
| `npm run db:studio` | Drizzle Studio (GUI para inspeccionar la db) |

## Estructura

```
app/
  (dashboard)/            # rutas protegidas, layout con sidebar
    page.tsx              # home: grid de los 10 frameworks
    notes/                # COR Notes (Fase 2 — DONE)
    routine/              # Jornada 4h (stub)
    writing/              # APAG (stub)
    content/              # Ecosistema 2h (stub)
    trust/                # Trust Matrix (stub)
    offers/               # Ecuación de Valor (stub)
    mvo/                  # MVO Pipeline (stub)
    skills/               # Build/Teach/Earn (stub)
    koes-law/             # Ley de Koe (stub)
    one-person/           # Modelo Una Sola Persona (stub)
  api/auth/[...nextauth]/ # Auth.js handler
  login/                  # /login + /login/check-email
  layout.tsx              # root layout + Toaster
components/
  ui/                     # shadcn primitives
  nav/sidebar.tsx
  frameworks/
    framework-shell.tsx   # header + "Cómo funciona" + tool slot
    coming-soon.tsx
    cor/                  # COR Notes (form + list)
lib/
  db/
    schema.ts             # 14 tablas Drizzle
    client.ts             # pg pool + drizzle client
  frameworks/
    index.ts              # metadata hardcoded de los 10 frameworks (textos del notebook)
    types.ts
  env.ts                  # validación Zod de env vars
  utils.ts                # cn() de shadcn
auth.ts                   # Auth.js v5 config (whitelist por email)
drizzle.config.ts
drizzle/                  # migraciones generadas
docker-compose.yml        # Postgres local
.env.local                # secrets locales (gitignored)
.env.example              # template
```

## Roadmap

- **Fase 0 (DONE)**: scaffold + deps + shadcn + Drizzle + Docker Postgres
- **Fase 1 (DONE)**: Auth con magic-link, layout con sidebar, 10 rutas accesibles
- **Fase 2**: COR Notes (DONE) · Routine (TODO) · APAG (TODO)
- **Fase 3**: Content Ecosystem kanban · Trust Matrix · Ley de Koe
- **Fase 4**: One Person Vision · Value Equation · MVO Pipeline · Build/Teach/Earn
- **Fase 5**: Home agregada · Cmd+K quick capture · Dark mode

## Notas de diseño

- **Single-user**: la whitelist está en `ALLOWED_EMAIL`. Cualquier otro email que intente loguearse es rechazado por el callback `signIn` en `auth.ts`. No hay multi-user.
- **Contenido hardcoded**: los textos explicativos de cada framework viven en `lib/frameworks/index.ts` como TypeScript. La app **no consulta NotebookLM en runtime**.
- **Convención de framework page**: `FrameworkShell` envuelve header + colapsable "Cómo funciona" + la herramienta interactiva. Todas las páginas siguen este patrón.
