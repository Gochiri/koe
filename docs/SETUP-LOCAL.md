# Pasar de Claude Code on the web a local

Cómo trabajar este repo desde tu máquina y seguir teniendo lo mismo que en el navegador: los conectores MCP (Eden, ClickUp, Notion, Figma, Canva, Drive, GitHub), tus skills, y hasta la conversación misma.

**La conclusión corta:** casi todo viene solo por estar logueado con la misma cuenta de Claude. No hay nada de MCP que copiar a este repo, porque los servidores no están configurados en archivos: son conectores de tu cuenta.

---

## 1 · Clonar el repo

```bash
git clone https://github.com/Gochiri/koe.git
cd koe
git checkout claude/en-que-estabamos-sryri6
```

## 2 · Instalar Claude Code y loguearte con la cuenta, no con API key

```bash
npm install -g @anthropic-ai/claude-code
claude
```

Dentro de la sesión: `/login` y elegí la suscripción de claude.ai.

**Esto es la parte que importa y es fácil de arruinar.** Los conectores MCP aparecen automáticamente **solo si tu autenticación principal es la suscripción de claude.ai**. Si tenés `ANTHROPIC_API_KEY` o `ANTHROPIC_AUTH_TOKEN` en las variables de entorno, Claude Code las usa y **los conectores no aparecen**. Si ya las tenés puestas para otra cosa, sacalas del entorno de esta terminal antes de arrancar.

Para verificar que Eden y el resto están: `/mcp`. Deberías ver la lista.
Si alguno aparece sin autenticar: `claude mcp login eden`.

## 3 · Bajar tus skills (un solo comando, una sola vez)

Las skills **no** se sincronizan solas al loguearte. Hay que pedirlo explícitamente:

```bash
CLAUDE_CODE_SYNC_SKILLS=1 claude -p "listá las skills disponibles"
```

Eso descarga a `~/.claude/skills/synced/` las skills que tengas habilitadas en claude.ai — las 46, incluidas las tuyas: `ghl-onboarding-mapper`, `ghl-cotizador`, `ghl-playwright-builder`, `ghl-utm-tracking`, `ghl-clickup-task-builder`, `ghl-html-wide`, `copywriting-latam`, `landing-vende`, `n8n-workflow-builder`, `auditor-seo`, `title-generator`, `espia-tendencias`, `scraping-competencia`, `dashboard-negocio`, `emails-venta`, `calendario-contenido`, `diseno-canva-lote`.

Después las ves con `/skills`, agrupadas bajo *claude.ai sync*.

**Cada vez que agregues o cambies una skill en claude.ai, volvé a correr ese comando.** No se actualizan solas.

## 4 · Traer esta conversación a tu terminal

Existe para esto:

```bash
claude --teleport session_01TFize5k2cdeyxnRcBcNpq1
```

O sin argumento (`claude --teleport`) para elegir de una lista.

Trae el historial completo de la sesión web, se pone en la rama correspondiente y sigue desde donde quedó. Requisitos: misma cuenta, repo git, la rama **pusheada** (ya está), y árbol de trabajo limpio — si tenés cambios sin commitear los stashea.

**Ojo:** crea una **copia** de la sesión. Lo que hagas en local no vuelve a la del navegador. Son dos hilos desde ese punto.

Si no teleportás, las sesiones son independientes y lo único que viaja es el repo: `CLAUDE.md`, los archivos, y `docs/plan-marca-personal.md`. Que es bastante — el `CLAUDE.md` está escrito justamente para que una sesión nueva arranque con el contexto.

## 5 · Levantar la app (opcional)

Ver `README.md`. Resumen: Docker corriendo, `npm install`, `npm run db:up`, crear `.env.local`, `npm run db:migrate`, `npm run dev`.

Dos variables que importan para lo nuestro:

- **`OBSIDIAN_VAULT_PATH`** — apuntala a la carpeta `vault/` de este repo, con ruta absoluta. Ahí está el kit de venta en markdown, así que la app te lo muestra sin importar nada.
- **`ANTHROPIC_API_KEY`** — la usa el chat de la app. **Ponela en `.env.local`, nunca como variable de entorno de la terminal**, o rompés lo del punto 2.

---

## Qué se commitea y qué no

| Archivo | ¿Al repo? | Por qué |
| --- | --- | --- |
| `.mcp.json` | sí, si existe | Es configuración del proyecto. Hoy no hace falta: los servidores son conectores de cuenta. |
| `~/.claude/.credentials.json` | **nunca** | Tokens OAuth. Vive en tu máquina, con permisos 0600. |
| `.claude/settings.json` | sí | Config compartida del proyecto: permisos, hooks. |
| `.claude/settings.local.json` | **no** | Tus preferencias en esta máquina. Ya está ignorado globalmente. |
| `.env.local` | **nunca** | `.gitignore` ya cubre `.env*`. |
| `~/.claude/plans/` | no | Son locales. Lo que valga la pena queda en `docs/`. |

Precedencia de settings, de mayor a menor: managed (organización) → línea de comandos → `.claude/settings.local.json` → `.claude/settings.json` → `~/.claude/settings.json`.

Precedencia de MCP: `.mcp.json` del proyecto → config del usuario → conectores de claude.ai.

---

## Si algo no aparece

| Síntoma | Causa más probable |
| --- | --- |
| `/mcp` vacío o sin Eden | Estás autenticado por API key en vez de suscripción. Sacá `ANTHROPIC_API_KEY` del entorno y volvé a `/login`. |
| Eden listado pero sin autenticar | `claude mcp login eden` |
| No aparecen tus skills | Falta correr el comando del punto 3. Y se corre de nuevo cada vez que las cambies en claude.ai. |
| `--teleport` no existe | Versión vieja del CLI. `npm install -g @anthropic-ai/claude-code@latest`. Al momento de escribir esto, la del entorno remoto era 2.1.259. |
| `--teleport` falla | Árbol de trabajo sucio, o la rama no está en el remoto. |

---

*Verificado contra la documentación oficial de Claude Code en septiembre de 2026. Lo único que quedó sin confirmar es si hay alcances de MCP más allá de `oauth.scopes` — no aplica mientras uses conectores de cuenta.*
