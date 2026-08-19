# CONTEXT — Contexto maestro del portafolio

> **Para qué sirve este archivo.** Reúne todo el contexto del portafolio en un solo lugar para poder **continuar el trabajo desde cualquier equipo**. Si abres una sesión de Claude Code (o cualquier asistente) en otra máquina, pásale este archivo y tendrá el panorama completo.
>
> **Nota importante:** la "memoria" interna de Claude Code es **local a cada equipo** y no se sincroniza. Este documento (versionado en GitHub) es el mecanismo portable. Manténlo actualizado cuando haya cambios grandes.

---

## 0. Arranque rápido en un equipo nuevo

1. **Autenticarse en GitHub** con la cuenta correcta:
   ```bash
   gh auth login          # cuenta jersonvillamizar214
   gh auth status
   ```
2. **Clonar los repos** (cada proyecto es un repo independiente bajo `github.com/jersonvillamizar214`):
   ```bash
   gh repo clone jersonvillamizar214/portfolio          # este repo (índice + meta-docs)
   gh repo clone jersonvillamizar214/northwind-ops
   gh repo clone jersonvillamizar214/rag-chat-assistant
   # …y los demás de la tabla de la sección 3
   ```
3. **Re-crear los secretos** (NO están en git; ver sección 5). Cada proyecto con BD/IA necesita su `.env` local a partir de `.env.example`.
4. **Leer** este archivo + [RESUMEN-PROYECTOS.md](RESUMEN-PROYECTOS.md) (detalle técnico) + [DIAGRAMAS.md](DIAGRAMAS.md) (diagramas visuales).

---

## 1. Quién y para qué

- **Autor:** Jerson Villamizar. Portafolio para **entrevistas internacionales** de desarrollador.
- **Cuenta GitHub activa:** `jersonvillamizar214` (email `jerson.villamizar.214@gmail.com`).
  - ⚠️ NO usar la cuenta secundaria `jersonvillamizar` (archi.javf@…), donde vive un proyecto viejo ajeno a esto.
- **Ubicación local (en el equipo original):** `C:\Users\Esteban Dev\Documents\Portfolio\` — un repo por proyecto. La carpeta contenedora `Portfolio/` **no** es un repo git; por eso los meta-docs viven en el repo `portfolio` (este).
- **Estado:** **11 proyectos terminados, en GitHub con CI en verde, y desplegados en vivo.**

---

## 2. Reglas fijas (aplican a todo el portafolio)

1. **Marca ficticia "Northwind", nunca "Copower".** Copower es la empresa real del autor (confidencial). Northwind se usa en nombres, UI, prompts de IA, datos de seed y docs. Nunca mezclar la marca real.
2. **Todo gratuito.** Solo capas free (Vercel, Cloudflare, Neon, MongoDB Atlas, Upstash, HiveMQ, Groq). AWS quedó **descartado** (el free tier caduca y hubo problemas de cuenta) → se cubrió serverless con Cloudflare Workers.
3. **Secretos jamás en git.** API keys/tokens solo en `.env` (gitignored) y como *secrets* de GitHub / env vars de Vercel. Verificar antes de cada push.
4. **Tema claro/oscuro + idioma EN/ES en los 11**, con **inglés + modo claro por defecto** (incluida la página índice).
5. **Proyectos nuevos sin página de registro/login** (salvo los dos de auth, que son el tema en sí): se prioriza mostrar el contenido funcional/visual.
6. **Stack estándar:** Next.js (App Router) con el backend dentro (`app/api/`), **Neon (PostgreSQL)** como BD por defecto, **todo desplegado en Vercel** (un repo = un deploy = un dominio). Excepciones justificadas: `rest-api-jwt-auth` (Express puro, envuelto en función serverless) y `serverless-url-shortener` (Cloudflare Workers).

---

## 3. Los 11 proyectos (repos + URLs en vivo + datos)

| # | Repo | En vivo | Motor de datos / servicios |
|---|------|---------|----------------------------|
| 1 ⭐ | `northwind-ops` | [northwind-ops-javf.vercel.app](https://northwind-ops-javf.vercel.app) | Neon **opsdb** + Groq (Llama 3.3) · SSE · transacción ACID |
| 2 | `rag-chat-assistant` | [rag-chat-assistant-javf.vercel.app](https://rag-chat-assistant-javf.vercel.app) | Neon **ragdb** (pgvector) + Gemini embeddings + Groq |
| 3 | `nosql-catalog` | [nosql-catalog-javf.vercel.app](https://nosql-catalog-javf.vercel.app) | MongoDB Atlas + Upstash Redis |
| 4 | `sales-system-sql` | [sales-system-sql-javf.vercel.app](https://sales-system-sql-javf.vercel.app) | Neon **salesdb** |
| 5 | `serverless-url-shortener` | [serverless-url-shortener.jersonvillamizar214.workers.dev](https://serverless-url-shortener.jersonvillamizar214.workers.dev) | Cloudflare KV + D1 |
| 6 | `rest-api-jwt-auth` | [rest-api-jwt-auth-javf.vercel.app](https://rest-api-jwt-auth-javf.vercel.app) | Neon **authdb** (Express serverless) |
| 7 | `jwt-auth-dashboard` | [jwt-auth-dashboard-javf.vercel.app](https://jwt-auth-dashboard-javf.vercel.app) | Neon **authdb** |
| 8 | `iot-mqtt-monitor` | [iot-mqtt-monitor-javf.vercel.app](https://iot-mqtt-monitor-javf.vercel.app) | HiveMQ (MQTT público) · sin BD |
| 9 | `kpi-dashboard` | [kpi-dashboard-javf.vercel.app](https://kpi-dashboard-javf.vercel.app) | sin BD (datos deterministas) |
| 10 | `algorithms-visualizer` | [algorithms-visualizer-javf.vercel.app](https://algorithms-visualizer-javf.vercel.app) | sin BD (todo en cliente) |
| 11 | `portfolio` (este repo) | [portfolio-index-javf.vercel.app](https://portfolio-index-javf.vercel.app) | estático (HTML/CSS/JS) |

> Detalle técnico de cada uno: [RESUMEN-PROYECTOS.md](RESUMEN-PROYECTOS.md). Diagramas: [DIAGRAMAS.md](DIAGRAMAS.md).

---

## 4. Infraestructura y despliegue

- **Vercel:** cuenta `jersonvillamizar214`, scope **"javf"**. Despliegue por CLI:
  ```bash
  npx vercel@latest deploy --prod --yes --token=$VERCEL_TOKEN
  ```
  El dominio de producción de cada proyecto es `<proyecto>-javf.vercel.app` (excepción: `northwind-ops` → `northwind-ops-javf.vercel.app`).
  - La "Deployment Protection" venía activada por defecto (obligaba login); se desactiva por API: `PATCH /v9/projects/{name}` con `{"ssoProtection": null}`. Existía un helper `scratchpad/vercel-setup.mjs` (crea proyecto + desactiva protección + setea env vars).
- **Neon (PostgreSQL):** proyecto **"presentacion"** (id `young-firefly-21541245`), rama production, rol `neondb_owner`. Free tier = 1 proyecto, así que hay 4 bases dentro del mismo: **authdb, salesdb, ragdb, opsdb**. Se usan connection strings **directas** (sin pooling), suficiente para el tráfico del portafolio.
- **Cloudflare (url-shortener):** binding **KV** `LINKS` (id `0bd75b615a6048b8b3ed080dcfe0faa3`) + **D1** `shortener` (id `b28289c1-20c4-424c-8158-a78b7cbdcae3`). Subdominio `jersonvillamizar214.workers.dev`. Deploy:
  ```bash
  export CLOUDFLARE_API_TOKEN=…; export CLOUDFLARE_ACCOUNT_ID=2c8875034fa17b9e204450007fe06a0d
  npx wrangler deploy
  ```
  (wrangler 4.86 con Node 20; `@latest` exige Node 22. El token CF necesita permiso **D1** añadido.)
- **MongoDB Atlas + Upstash (nosql-catalog):** en Atlas hubo que abrir **Network Access `0.0.0.0/0`** para que Vercel conecte.
- **CI:** cada repo tiene `.github/workflows/ci.yml` (lint + build + imagen Docker no-root). Dos van más allá levantando BD real: `sales-system-sql` (Postgres + `scripts/verify-queries.ts`) y `rag-chat-assistant` (pgvector + `scripts/verify-retrieval.ts`). `nosql-catalog` levanta Mongo+Redis reales.

---

## 5. Credenciales (NO están en git — hay que re-proveerlas)

En el equipo original, las keys vivían **solo** en el scratchpad de la sesión y en los `.env` locales (gitignored). **No se suben a GitHub.** Para trabajar en otro equipo hay que volver a tenerlas a mano y recrear los `.env` desde cada `.env.example`:

- **Vercel token** (para desplegar por CLI).
- **Neon:** connection strings de authdb / salesdb / ragdb / opsdb (`DATABASE_URL`).
- **Groq API key** (`GROQ_API_KEY`) — LLM en northwind-ops y rag.
- **Gemini API key** (`GEMINI_API_KEY`) — embeddings en rag.
- **MongoDB Atlas URI** + **Upstash Redis URL** — nosql-catalog.
- **Cloudflare API token** (con permiso Workers + KV + D1) + account id — url-shortener.

> Recomendación de seguridad ya dada: **rotar** las keys que en algún momento se pegaron en un chat (Groq/Gemini). En Vercel/GitHub ya están como env vars/secrets; en local hay que recrearlas.

---

## 6. Gotchas resueltos (para no repetir el tropiezo)

- **rag-chat-assistant:** se cambió `transformers.js` (ONNX nativo, **no corre en Vercel**) por **Google `gemini-embedding-001`** (768-d, `taskType` RETRIEVAL_DOCUMENT/QUERY, normalizado L2). Mejoró el retrieval en español. *(El README aún dice 384-d en un punto; el código real usa 768-d.)*
- **Puertos Docker locales desplazados** para no chocar con servicios nativos del host: sales 5433, rag 5434, northwind 5435, mongo 27018, redis 6380 (el host tiene Postgres nativo en 5432).
- **rest-api-jwt-auth en Vercel:** Express envuelto como función serverless (`api/index.ts` + `vercel.json`); Prisma con `binaryTargets = ["native","rhel-openssl-3.0.x"]` + `postinstall: prisma generate`.
- **Screenshots de verificación:** usar Playwright con `waitUntil: "domcontentloaded"` (NO `networkidle`: SSE/streams dejan la red abierta y nunca "reposa"). Playwright está instalado en el repo `portfolio`.
- **i18n:** `src/lib/i18n.ts` debe **definir** `export type Lang` (no importarla de `ui.tsx`) para evitar import circular.

---

## 7. Patrón de tema + idioma (cómo se implementó en los 11)

Resumen del patrón (detalle en la sección de cada proyecto de RESUMEN-PROYECTOS.md):

- **globals.css:** tokens CSS en `:root` (claro, default) y `:root[data-theme="dark"]`, expuestos como utilidades Tailwind vía `@theme inline` (`--color-bg`, `--color-surface`, `--color-fg`, `--color-muted`, `--color-line`, `--color-accent`…). `@custom-variant dark (&:where([data-theme="dark"], [data-theme="dark"] *));`.
- **components/ui.tsx** (`"use client"`): `Providers` (contexto tema+idioma en localStorage, default light/en), `useUi()`, y `Controls` (pill EN/ES + botón sol/luna).
- **layout.tsx:** `<html lang="en" suppressHydrationWarning>`, script anti-flash inline en `<head>`, `<Providers>` envolviendo todo, `body` con `bg-bg text-fg`.
- **Páginas con datos server** (northwind, sales, nosql, rag): la página server hace fetch y delega la UI traducible a **client "Content components"** (`DashboardContent`, `OrdersContent`, etc.) que consumen `useUi()`. Serializar Date→ISO y Decimal→Number antes de pasar al cliente.
- **Acentos semánticos conservados** por identidad de marca: nosql emerald/rose (Mongo/Redis), rag violet (IA), url-shortener naranja (Cloudflare); northwind usó el azul uniforme.
- **Casos estáticos** (portfolio index, landing de rest-api, dashboard del Worker): patrón `data-i18n`/`data-i18n-html`/`data-i18n-ph` + diccionario JS + `applyLang()`/`applyTheme()`.

---

## 8. Cómo mantener este contexto al día

- Cuando termines algo grande, **actualiza este archivo** (secciones 3–6) y haz `git commit && git push` en el repo `portfolio`.
- Si quieres que Claude Code cargue contexto **automáticamente** al abrir un proyecto concreto, usa el `CLAUDE.md` de ese repo (8 de los 11 ya lo tienen). Este `CONTEXT.md` es el panorama **global**; los `CLAUDE.md` son el contexto **por proyecto**.
- La memoria interna de Claude no viaja entre equipos: este archivo es la fuente de verdad portable.
