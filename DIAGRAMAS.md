# Diagramas del portafolio

Diagramas visuales de **cómo funciona cada proyecto**, pensados para entenderlos de un vistazo. Complemento del documento [RESUMEN-PROYECTOS.md](RESUMEN-PROYECTOS.md).

> **Cómo verlos:** GitHub renderiza estos diagramas (Mermaid) automáticamente. En VS Code necesitas la extensión *"Markdown Preview Mermaid Support"*.

## Leyenda de colores

```mermaid
flowchart LR
  UI["🧑 Interfaz / Cliente"]:::ui
  APP["⚙️ Servidor / Lógica"]:::app
  DB["🗄️ Base de datos"]:::db
  CACHE["⚡ Caché / KV"]:::cache
  EXT["🤖 Servicio externo / IA"]:::ext
  INFRA["📡 Infra / Broker"]:::infra

  classDef ui fill:#dbeafe,stroke:#3b82f6,color:#1e3a5f
  classDef app fill:#ede9fe,stroke:#8b5cf6,color:#3b2a5f
  classDef db fill:#dcfce7,stroke:#16a34a,color:#14532d
  classDef cache fill:#fee2e2,stroke:#ef4444,color:#7f1d1d
  classDef ext fill:#fef9c3,stroke:#eab308,color:#713f12
  classDef infra fill:#f1f5f9,stroke:#94a3b8,color:#334155
```

## Vista de conjunto

Dónde vive cada proyecto y de qué motor de datos o servicio depende.

```mermaid
flowchart TB
  subgraph VERCEL["☁️ Vercel — apps Next.js / Node"]
    direction TB
    NW["⭐ northwind-ops"]:::app
    RAG["rag-chat-assistant"]:::app
    NOS["nosql-catalog"]:::app
    SQLS["sales-system-sql"]:::app
    REST["rest-api-jwt-auth"]:::app
    JWT["jwt-auth-dashboard"]:::app
    IOT["iot-mqtt-monitor"]:::app
    KPI["kpi-dashboard"]:::app
    ALG["algorithms-visualizer"]:::app
    IDX["portfolio-index"]:::app
  end

  subgraph CF["🟠 Cloudflare — edge"]
    URL["serverless-url-shortener"]:::app
  end

  NEON[("🐘 Neon · PostgreSQL")]:::db
  PGV[("🧠 pgvector")]:::db
  ATLAS[("🍃 MongoDB Atlas")]:::db
  UPS[("⚡ Upstash Redis")]:::cache
  KVD1[("⚡ KV + 🗄️ D1")]:::cache
  GROQ["🤖 Groq · Llama 3.3"]:::ext
  GEM["🔢 Gemini embeddings"]:::ext
  HIVE["📡 HiveMQ · MQTT"]:::infra

  NW --> NEON & GROQ
  RAG --> PGV & GEM & GROQ
  NOS --> ATLAS & UPS
  SQLS --> NEON
  REST --> NEON
  JWT --> NEON
  URL --> KVD1
  IOT --> HIVE
  KPI -.->|"datos en memoria"| KPI
  ALG -.->|"100% cliente"| ALG
  IDX -.->|"HTML estático"| IDX

  classDef app fill:#ede9fe,stroke:#8b5cf6,color:#3b2a5f
  classDef db fill:#dcfce7,stroke:#16a34a,color:#14532d
  classDef cache fill:#fee2e2,stroke:#ef4444,color:#7f1d1d
  classDef ext fill:#fef9c3,stroke:#eab308,color:#713f12
  classDef infra fill:#f1f5f9,stroke:#94a3b8,color:#334155
```

---

## 1. ⭐ northwind-ops

**La historia:** un usuario registra una venta y el sistema, en una sola transacción "todo o nada", reserva el stock, crea el pedido y anota el evento. Si no hay stock, nada se guarda.

```mermaid
sequenceDiagram
  actor U as 🧑 Usuario
  participant A as ⚙️ Server Action
  participant S as 🧠 sales.ts
  participant DB as 🗄️ PostgreSQL

  U->>A: Registrar venta (producto, cantidad)
  A->>S: placeOrder()
  rect rgb(220,252,231)
    Note over S,DB: 🔒 prisma.$transaction — todo o nada
    S->>DB: Reservar stock (UPDATE ... WHERE stock >= cantidad)
    alt ✅ Hay stock
      DB-->>S: reservado (1 fila)
      S->>DB: Crear pedido + líneas + evento auditoría
      DB-->>S: commit
      S-->>U: ✅ Venta creada
    else ❌ No hay stock
      DB-->>S: 0 filas
      S-->>U: ❌ Rollback — el stock queda intacto
    end
  end
```

**El resto de la plataforma** (dashboard, tiempo real y asistente):

```mermaid
flowchart LR
  U["🧑 Navegador"]:::ui

  U -->|"ver métricas"| P["⚙️ Pages (SQL agregado)"]:::app
  U -->|"EventSource"| SSE["⚙️ Stream SSE (cada 2s)"]:::app
  U -->|"preguntar"| AS["⚙️ Asistente"]:::app

  P --> DB[("🗄️ PostgreSQL")]:::db
  SSE --> DB
  AS -->|"datos reales como contexto"| DB
  AS -->|"streaming"| G["🤖 Groq · Llama 3.3"]:::ext

  classDef ui fill:#dbeafe,stroke:#3b82f6,color:#1e3a5f
  classDef app fill:#ede9fe,stroke:#8b5cf6,color:#3b2a5f
  classDef db fill:#dcfce7,stroke:#16a34a,color:#14532d
  classDef ext fill:#fef9c3,stroke:#eab308,color:#713f12
```

---

## 2. rag-chat-assistant

**La historia:** la pregunta se convierte en números (vector), se buscan los fragmentos más parecidos de la documentación, y el modelo responde **solo** con eso. Si no encuentra nada relevante, se niega a inventar.

```mermaid
sequenceDiagram
  actor U as 🧑 Usuario
  participant API as ⚙️ /api/chat
  participant EMB as 🔢 Gemini
  participant PG as 🗄️ pgvector
  participant LLM as 🤖 Groq · Llama 3.3

  U->>API: pregunta
  API->>EMB: convertir a vector (768-d)
  EMB-->>API: vector
  API->>PG: buscar 4 fragmentos más parecidos (coseno)
  PG-->>API: fragmentos + score de similitud
  Note over API: si similitud < 0.25 → se descarta (ruido)
  API->>LLM: contexto + pregunta (prohibido inventar)
  LLM-->>U: 💬 respuesta en streaming + 📚 fuentes citadas
```

**Ingesta (una sola vez, offline):** los documentos se trocean, se convierten en vectores y se guardan.

```mermaid
flowchart LR
  MD["📄 content/*.md"]:::ui --> CH["✂️ trocear por sección<br/>(~700 caracteres)"]:::app
  CH --> E["🔢 Gemini embeddings"]:::ext
  E --> D[("🗄️ documents<br/>+ índice HNSW")]:::db

  classDef ui fill:#dbeafe,stroke:#3b82f6,color:#1e3a5f
  classDef app fill:#ede9fe,stroke:#8b5cf6,color:#3b2a5f
  classDef db fill:#dcfce7,stroke:#16a34a,color:#14532d
  classDef ext fill:#fef9c3,stroke:#eab308,color:#713f12
```

---

## 3. nosql-catalog

**La historia:** la primera consulta va a MongoDB (lenta) y se guarda una copia en Redis; las siguientes salen del caché (rapidísimas) hasta que la copia caduca a los 60 segundos.

```mermaid
flowchart LR
  U["🧑 Usuario<br/>pide las facetas"]:::ui --> Q{"⚡ ¿está en Redis?"}:::cache

  Q -->|"✅ Sí · ~0.6 ms"| FAST["responder del caché"]:::cache
  Q -->|"❌ No (primera vez)"| M["🗄️ MongoDB<br/>agregación en 1 pasada<br/>~20 ms"]:::db
  M --> W["⚡ guardar en Redis<br/>(caduca en 60 s)"]:::cache
  W --> FAST

  classDef ui fill:#dbeafe,stroke:#3b82f6,color:#1e3a5f
  classDef db fill:#dcfce7,stroke:#16a34a,color:#14532d
  classDef cache fill:#fee2e2,stroke:#ef4444,color:#7f1d1d
```

---

## 4. sales-system-sql

**La historia:** cada tabla de la página "SQL Insights" viene de una consulta SQL real (con CTEs y funciones de ventana), y la propia página te muestra el SQL exacto que la produjo.

```mermaid
flowchart LR
  U["🧑 Página SQL Insights"]:::ui --> R["⚙️ analytics.ts<br/>(consulta guardada)"]:::app
  R -->|"ejecuta"| PG[("🗄️ PostgreSQL")]:::db
  R -->|"muestra el SQL literal"| U

  PG --- T["📊 Técnicas:<br/>• SUM() OVER (totales acumulados)<br/>• RANK() / DENSE_RANK()<br/>• ROW_NUMBER() (top-N por grupo)<br/>• LAG() (crecimiento mes a mes)"]:::infra

  classDef ui fill:#dbeafe,stroke:#3b82f6,color:#1e3a5f
  classDef app fill:#ede9fe,stroke:#8b5cf6,color:#3b2a5f
  classDef db fill:#dcfce7,stroke:#16a34a,color:#14532d
  classDef infra fill:#f1f5f9,stroke:#94a3b8,color:#334155
```

---

## 5. serverless-url-shortener

**La historia:** al visitar un enlace corto, el Worker responde con la redirección **al instante** (leyendo de KV) y guarda la estadística del clic **después**, sin hacer esperar al visitante.

```mermaid
sequenceDiagram
  actor V as 🧑 Visitante
  participant W as ⚡ Worker (edge)
  participant KV as 🔑 KV (destinos)
  participant D1 as 🗄️ D1 (analítica)

  V->>W: GET /abc123
  W->>KV: ¿a dónde apunta abc123?
  KV-->>W: https://destino-real.com
  W-->>V: 302 redirect (inmediato)
  Note over W,D1: ya respondió al usuario…
  W->>D1: guardar clic (ctx.waitUntil)
```

**Al crear un enlace** se valida el destino (anti-phishing/SSRF) y se limita el ritmo por IP:

```mermaid
flowchart LR
  C["🧑 Cliente"]:::ui -->|"POST /api/links"| W["⚡ Worker"]:::cache
  W --> RL{"⏱️ ¿más de 20/min<br/>desde esta IP?"}:::cache
  RL -->|"sí"| E429["🚫 429 Too Many Requests"]:::infra
  RL -->|"no"| V{"🛡️ destino válido?<br/>(solo http/https,<br/>sin IPs privadas)"}:::app
  V -->|"no"| E400["⚠️ 400 rechazado"]:::infra
  V -->|"sí"| S["🔑 generar slug Base58<br/>y guardar en KV"]:::cache

  classDef ui fill:#dbeafe,stroke:#3b82f6,color:#1e3a5f
  classDef app fill:#ede9fe,stroke:#8b5cf6,color:#3b2a5f
  classDef cache fill:#fee2e2,stroke:#ef4444,color:#7f1d1d
  classDef infra fill:#f1f5f9,stroke:#94a3b8,color:#334155
```

---

## 6. rest-api-jwt-auth

**La historia:** cada petición pasa por capas limpias (ruta → controlador → servicio). Y al renovar la sesión, el token viejo se borra y se emite uno nuevo (rotación real, no solo "sigue válido").

```mermaid
flowchart LR
  C["🧑 Cliente"]:::ui --> RT["🛣️ Ruta"]:::app --> CT["🎛️ Controlador"]:::app --> SV["🧠 Servicio"]:::app
  SV --> PR[("🗄️ PostgreSQL")]:::db
  RT -. "authenticate / authorize(rol)" .-> MW["🛡️ Middlewares"]:::infra

  classDef ui fill:#dbeafe,stroke:#3b82f6,color:#1e3a5f
  classDef app fill:#ede9fe,stroke:#8b5cf6,color:#3b2a5f
  classDef db fill:#dcfce7,stroke:#16a34a,color:#14532d
  classDef infra fill:#f1f5f9,stroke:#94a3b8,color:#334155
```

**Rotación de refresh token** (lo que hace que el logout sea real):

```mermaid
sequenceDiagram
  actor C as 🧑 Cliente
  participant API as ⚙️ /auth/refresh
  participant DB as 🗄️ refresh_tokens

  C->>API: mi refresh token (por vencer)
  API->>DB: ¿existe y es válido?
  DB-->>API: sí
  API->>DB: 🗑️ borrar el token viejo (revocar)
  API-->>C: 🎫 nuevo access + nuevo refresh
```

---

## 7. jwt-auth-dashboard

**La historia:** al hacer login, el servidor guarda los tokens en cookies que el JavaScript del navegador no puede leer (httpOnly). Las páginas protegidas verifican esa cookie antes de mostrar nada.

```mermaid
sequenceDiagram
  actor B as 🧑 Navegador
  participant RH as ⚙️ /api/auth/login
  participant DB as 🗄️ PostgreSQL
  participant SC as 🛡️ Server Component

  B->>RH: email + contraseña
  RH->>DB: verificar (bcrypt)
  DB-->>RH: ok
  RH-->>B: 🍪 cookies httpOnly (access + refresh)
  Note over B,SC: al entrar al dashboard
  B->>SC: petición con la cookie
  SC->>SC: verificar JWT + rol
  SC-->>B: ADMIN → ve todos los usuarios<br/>USER → ve su perfil
```

---

## 8. iot-mqtt-monitor

**La historia:** las máquinas (o el simulador) **publican** telemetría a un broker; el dashboard del navegador está **suscrito** y la recibe en vivo. Ninguno conoce al otro: solo comparten el broker.

```mermaid
flowchart LR
  SIM["🏭 Máquinas / Simulador"]:::infra -->|"publish"| BR["📡 HiveMQ (broker)"]:::infra
  BR -->|"wss (WebSocket)"| DASH["🖥️ Dashboard"]:::ui
  DASH -->|"subscribe plant-1/+/telemetry"| BR
  DASH --> SP["📈 Sparklines en vivo"]:::app
  DASH --> AL["🚨 Alarmas warn/crit"]:::app

  classDef ui fill:#dbeafe,stroke:#3b82f6,color:#1e3a5f
  classDef app fill:#ede9fe,stroke:#8b5cf6,color:#3b2a5f
  classDef infra fill:#f1f5f9,stroke:#94a3b8,color:#334155
```

---

## 9. kpi-dashboard

**La historia:** un generador determinista fabrica 24 meses de pedidos (siempre los mismos), se agregan como lo haría SQL, y se dibujan con gráficos SVG hechos a mano.

```mermaid
flowchart LR
  DATA["🎲 Generador determinista<br/>(24 meses de pedidos)"]:::app --> MET["🧮 Agregación<br/>(GROUP BY / SUM)"]:::app
  URL["🔗 Período 6/12 meses<br/>(desde la URL)"]:::ui --> MET
  MET --> KPI["🔢 KPIs + variación %"]:::app
  MET --> CH["📊 Gráficos SVG<br/>(área / barras / dona)"]:::app
  KPI --> UI["🖥️ Dashboard"]:::ui
  CH --> UI

  classDef ui fill:#dbeafe,stroke:#3b82f6,color:#1e3a5f
  classDef app fill:#ede9fe,stroke:#8b5cf6,color:#3b2a5f
```

---

## 10. algorithms-visualizer

**La historia (la idea clave):** cada algoritmo de ordenamiento es un *generador* que va "narrando" sus operaciones. Ese mismo código alimenta a la vez la **animación** y el **contador** que dibuja la curva de Big O — no hay dos versiones que se contradigan.

```mermaid
flowchart LR
  GEN["🌱 sorting.ts<br/>generador que 'narra'<br/>comparar / intercambiar"]:::app
  GEN --> VIS["🎬 Visualizador<br/>(anima paso a paso)"]:::ui
  GEN --> BEN["🧮 Benchmark<br/>(cuenta operaciones)"]:::app
  BEN --> CC["📈 Curva medida<br/>vs. n, n·log n, n²"]:::ui

  STR["🧱 Estructuras desde cero<br/>Stack · Queue · BST · Heap · HashMap"]:::app
  PF["🗺️ Pathfinding<br/>BFS · Dijkstra · A*"]:::app
  PF -. "usa el MinHeap" .-> STR
  TST["✅ Vitest (54 pruebas<br/>que verifican el Big O)"]:::infra -.-> GEN

  classDef ui fill:#dbeafe,stroke:#3b82f6,color:#1e3a5f
  classDef app fill:#ede9fe,stroke:#8b5cf6,color:#3b2a5f
  classDef infra fill:#f1f5f9,stroke:#94a3b8,color:#334155
```

---

## 11. portfolio-index

**La historia:** una sola página HTML, sin build. Un array de proyectos en JavaScript se dibuja como tarjetas, con filtros, idioma y tema — todo en el navegador.

```mermaid
flowchart TD
  H["📄 index.html<br/>(una sola página)"]:::ui --> ARR["🗂️ array de proyectos (JS)"]:::app
  ARR --> CARDS["🃏 Tarjetas<br/>(Demo en vivo + Código)"]:::ui
  FIL["🔎 Filtros por categoría"]:::app --> CARDS
  LANG["🌐 Idioma EN/ES"]:::app --> H
  THEME["🌗 Tema claro/oscuro"]:::app --> H
  LS[("💾 localStorage<br/>recuerda idioma y tema")]:::infra -.-> H

  classDef ui fill:#dbeafe,stroke:#3b82f6,color:#1e3a5f
  classDef app fill:#ede9fe,stroke:#8b5cf6,color:#3b2a5f
  classDef infra fill:#f1f5f9,stroke:#94a3b8,color:#334155
```
