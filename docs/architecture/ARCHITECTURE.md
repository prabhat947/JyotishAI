# JyotishAI -- System Architecture

## Overview

JyotishAI is an AI-powered Vedic astrology platform that generates ClickAstro/AstroVision-quality horoscope reports for personal and family use. The system combines high-precision astronomical calculations (via the Swiss Ephemeris) with large language model inference (via OpenRouter) to produce detailed, personalized astrological reports in English and Hindi.

The platform is structured as a multi-service architecture: a Next.js 15 frontend acting as both the user interface and a Backend-for-Frontend (BFF) API layer; a dedicated Python FastAPI microservice (`astro-engine`) for all Vedic astrology calculations; a BullMQ-based asynchronous job system for PDF generation and transit alert processing; Supabase PostgreSQL for persistent storage with Row Level Security; and Redis for queue management and job coordination.

All services are containerized with Docker and orchestrated via `docker-compose`. The platform is designed for private/family deployment on a single VPS (Dokploy on Hostinger) with cloud-managed data stores (Supabase, Upstash Redis).

---

## High-Level Architecture

```mermaid
graph TB
    subgraph Client["Browser Client"]
        UI["Next.js 15 Frontend<br/>(React 19 + TypeScript)"]
    end

    subgraph NextJS["Next.js Application (Port 3000)"]
        BFF["BFF API Routes<br/>/api/v1/*"]
        SSR["Server Components<br/>+ App Router"]
        Middleware["Auth Middleware<br/>(Supabase SSR)"]
    end

    subgraph AstroEngine["astro-engine (Port 8000)"]
        FastAPI["FastAPI Server"]
        SwissEph["Swiss Ephemeris<br/>(pyswisseph)"]
        ReportLab["ReportLab<br/>PDF Generator"]
    end

    subgraph Workers["BullMQ Workers"]
        ReportWorker["Report Worker<br/>(PDF Generation)"]
        AlertWorker["Alert Worker<br/>(Transit Alerts)"]
    end

    subgraph DataStores["Data Stores"]
        Supabase["Supabase PostgreSQL<br/>+ pgvector + Storage"]
        Redis["Redis 7<br/>(Job Queues)"]
    end

    subgraph External["External Services"]
        OpenRouter["OpenRouter API<br/>(LLM + Embeddings)"]
    end

    UI -->|"HTTP/SSE"| BFF
    BFF -->|"HTTP"| FastAPI
    FastAPI --> SwissEph
    FastAPI --> ReportLab
    BFF -->|"Streaming SSE"| OpenRouter
    BFF -->|"Enqueue Jobs"| Redis
    ReportWorker -->|"Poll Jobs"| Redis
    AlertWorker -->|"Poll Jobs"| Redis
    ReportWorker -->|"Generate PDF"| FastAPI
    ReportWorker -->|"Store PDF"| Supabase
    AlertWorker -->|"Fetch Chart Data"| Supabase
    AlertWorker -->|"Current Transits"| FastAPI
    BFF -->|"CRUD + Auth"| Supabase
    BFF -->|"Embeddings"| OpenRouter
    SSR --> Middleware
    Middleware --> Supabase
```

---

## Service Topology

| Service | Technology | Port | Deployment | Purpose |
|---------|-----------|------|------------|---------|
| `web` | Next.js 15 + React 19 + TypeScript | 3000 (prod) / 3001 (dev) | Docker / Dokploy VPS | Frontend UI + BFF API routes |
| `astro-engine` | FastAPI + Python 3.11 | 8000 | Docker / Dokploy VPS | Vedic astrology calculations, PDF generation |
| `worker` | Node.js + BullMQ | N/A (background) | Docker / Dokploy VPS | Async PDF generation and alert processing |
| `redis` | Redis 7 Alpine | 6379 | Docker (local) / Upstash (prod) | Job queue backend, pub/sub |
| Supabase | PostgreSQL 15 + pgvector | 5432 (managed) | Supabase Cloud | Database, auth, storage, RLS |
| OpenRouter | REST API | 443 | Cloud | LLM inference (Claude/Gemini) + embeddings |

---

## Data Flow Diagrams

### Report Generation Flow

This is the primary workflow -- a user requests a horoscope report and watches it stream in real-time. After streaming completes, the report is chunked, embedded for RAG, and a PDF generation job is queued.

```mermaid
sequenceDiagram
    actor User
    participant Browser
    participant NextAPI as Next.js API<br/>/api/v1/reports/generate
    participant Supabase as Supabase DB
    participant OpenRouter as OpenRouter<br/>(LLM)
    participant Embedder as OpenRouter<br/>(Embeddings)
    participant Redis as Redis Queue
    participant Worker as Report Worker
    participant AstroEngine as astro-engine<br/>/pdf/report
    participant Storage as Supabase Storage

    User->>Browser: Click "Generate Report"
    Browser->>NextAPI: POST /api/v1/reports/generate<br/>{profileId, reportType, language}
    NextAPI->>Supabase: Verify auth + fetch profile
    Supabase-->>NextAPI: Profile with chart_data

    NextAPI->>Supabase: INSERT report (status: generating)
    Supabase-->>NextAPI: Report record created

    NextAPI->>OpenRouter: POST /chat/completions (stream: true)<br/>System: expert astrologer prompt<br/>User: chart-specific report prompt

    loop SSE Streaming
        OpenRouter-->>NextAPI: data: {delta: {content: "..."}}
        NextAPI-->>Browser: SSE: data: {content: "..."}
        Browser->>Browser: Render markdown in real-time
    end

    OpenRouter-->>NextAPI: data: [DONE]

    NextAPI->>Supabase: UPDATE report (content, status: complete)
    NextAPI->>NextAPI: chunkText(content, reportType)
    NextAPI->>Embedder: POST /embeddings<br/>(batch embed all chunks)
    Embedder-->>NextAPI: Embedding vectors (1536-dim)
    NextAPI->>Supabase: INSERT report_chunks<br/>(content + embedding + metadata)

    NextAPI->>Redis: Enqueue "generate-pdf"<br/>{reportId}
    NextAPI-->>Browser: SSE: data: [DONE]

    Worker->>Redis: Poll for jobs
    Redis-->>Worker: Job: generate-pdf
    Worker->>Supabase: Fetch report content
    Supabase-->>Worker: Report data
    Worker->>AstroEngine: POST /pdf/report<br/>{title, content, author}
    AstroEngine-->>Worker: PDF binary (A4, styled)
    Worker->>Storage: Upload reports/{id}.pdf
    Storage-->>Worker: Public URL
    Worker->>Supabase: UPDATE report<br/>(pdf_url, pdf_generated_at)
```

### RAG Chat Flow

Users can ask date-specific questions about their birth chart. The system retrieves relevant report chunks via hybrid search (vector + full-text) and combines them with live chart data for context-aware responses.

```mermaid
sequenceDiagram
    actor User
    participant Browser
    participant ChatAPI as Next.js API<br/>/api/v1/chat
    participant Supabase as Supabase DB
    participant Embedder as OpenRouter<br/>(Embeddings)
    participant SearchFn as search_report_chunks<br/>(PostgreSQL RPC)
    participant OpenRouter as OpenRouter<br/>(LLM)

    User->>Browser: "What does my chart say for Feb 25-28?"
    Browser->>ChatAPI: POST /api/v1/chat<br/>{profileId, sessionId?, message}

    ChatAPI->>Supabase: Verify auth + fetch profile
    Supabase-->>ChatAPI: Profile with chart_data

    alt No sessionId
        ChatAPI->>Supabase: INSERT chat_session
        Supabase-->>ChatAPI: New session ID
    else Existing session
        ChatAPI->>Supabase: Verify session ownership
    end

    ChatAPI->>Supabase: Fetch last 10 messages
    Supabase-->>ChatAPI: Conversation history

    ChatAPI->>ChatAPI: extractDateMentions(query)<br/>["Feb 25-28"]

    ChatAPI->>Embedder: Embed user query
    Embedder-->>ChatAPI: Query vector (1536-dim)

    ChatAPI->>SearchFn: Hybrid search<br/>(vector 70% + FTS 30%)
    SearchFn-->>ChatAPI: Top 5 report chunks<br/>with similarity scores

    ChatAPI->>ChatAPI: Build system prompt<br/>- Birth chart summary<br/>- Retrieved report context<br/>- Date context

    ChatAPI->>OpenRouter: POST /chat/completions (stream: true)

    loop SSE Streaming
        OpenRouter-->>ChatAPI: data: {delta: {content: "..."}}
        ChatAPI-->>Browser: SSE: data: {content: "..."}
    end

    ChatAPI->>Supabase: INSERT chat_messages<br/>(user + assistant messages with sources)
    ChatAPI-->>Browser: SSE: data: {sources, sessionId}<br/>SSE: data: [DONE]
```

### Daily Transit Alert Flow

A scheduled job (or on-demand trigger) calculates current planetary transits, compares them against each family member's natal chart, and creates alert records for significant aspects.

```mermaid
sequenceDiagram
    participant Scheduler as Scheduled Trigger<br/>(or API call)
    participant Redis as Redis Queue
    participant AlertWorker as Alert Worker
    participant Supabase as Supabase DB
    participant AstroEngine as astro-engine

    Scheduler->>Redis: Enqueue "generate-alerts"<br/>{profileId}

    AlertWorker->>Redis: Poll for jobs
    Redis-->>AlertWorker: Job: generate-alerts

    AlertWorker->>Supabase: Fetch profile + chart_data
    Supabase-->>AlertWorker: Profile data

    alt No chart_data
        AlertWorker->>AlertWorker: Skip (log + return)
    end

    AlertWorker->>AstroEngine: GET /chart/transits
    AstroEngine->>AstroEngine: calc_planetary_positions(now)
    AstroEngine-->>AlertWorker: Current transit positions

    AlertWorker->>AstroEngine: POST /chart/transits/natal<br/>{natal_chart}
    AstroEngine->>AstroEngine: Calculate aspects<br/>(conjunction, opposition,<br/>trine, square, sextile)
    AstroEngine-->>AlertWorker: Aspect list with orbs

    AlertWorker->>AlertWorker: Filter: orb <= 2.0 degrees

    loop Each Significant Aspect
        AlertWorker->>Supabase: INSERT transit_alert<br/>{profile_id, type, title,<br/>content, planet, orb, trigger_date}
    end

    AlertWorker->>AlertWorker: Log: "Generated N alerts"
```

### Chart Calculation Flow

When a user creates a profile and calculates their birth chart, the Next.js BFF calls the astro-engine which runs the full Vedic calculation pipeline.

```mermaid
sequenceDiagram
    actor User
    participant Browser
    participant CalcAPI as Next.js API<br/>/api/v1/calculate
    participant Supabase as Supabase DB
    participant AstroEngine as astro-engine<br/>/chart

    User->>Browser: Enter birth details + click Calculate
    Browser->>CalcAPI: POST /api/v1/calculate<br/>{profileId, birthData}

    CalcAPI->>Supabase: Verify auth + profile ownership
    Supabase-->>CalcAPI: Profile confirmed

    CalcAPI->>AstroEngine: POST /chart<br/>{birth_date, birth_time,<br/>latitude, longitude, timezone}

    AstroEngine->>AstroEngine: calc_julian_day(birth_datetime, utc_offset)
    AstroEngine->>AstroEngine: get_ayanamsha(jd) -- Lahiri
    AstroEngine->>AstroEngine: calc_planetary_positions(jd)<br/>9 planets via pyswisseph
    AstroEngine->>AstroEngine: calc_lagna(jd, lat, lon)<br/>Ascendant calculation
    AstroEngine->>AstroEngine: calc_houses(lagna_degree)<br/>Whole Sign houses
    AstroEngine->>AstroEngine: get_nakshatra(longitude)<br/>27 nakshatras + pada
    AstroEngine->>AstroEngine: calc_dasha_balance(moon_long, birth_dt)<br/>Vimshottari dasha
    AstroEngine->>AstroEngine: get_dasha_sequence(birth_dt, balance)
    AstroEngine->>AstroEngine: detect_yogas(chart_data)<br/>25+ classical yogas
    AstroEngine->>AstroEngine: calc_ashtakavarga(chart_data)<br/>7 planets + Sarvashtakavarga

    AstroEngine-->>CalcAPI: Complete ChartData<br/>(planets, houses, dashas,<br/>yogas, ashtakavarga)

    CalcAPI->>Supabase: UPDATE profile<br/>(chart_data, chart_calculated_at)
    CalcAPI-->>Browser: {success: true, chartData}
```

---

## Component Architecture

### Next.js Application

The Next.js application serves as both the frontend and the BFF (Backend-for-Frontend) API layer.

```mermaid
graph TB
    subgraph AppRouter["App Router (src/app/)"]
        AuthGroup["(auth)/<br/>login, signup"]
        MainGroup["(main)/<br/>dashboard, profile/[id],<br/>reports/[id], transits,<br/>settings"]
        APIRoutes["api/v1/<br/>profiles, calculate,<br/>reports/generate, chat,<br/>transits, alerts,<br/>auth/login, auth/signup"]
    end

    subgraph Components["Components (src/components/)"]
        UI["ui/<br/>shadcn/ui primitives"]
        Kundli["kundli/<br/>KundliChart, PlanetInfoPanel"]
        Solar["solar-system/<br/>SolarSystem3D (R3F)"]
        Dasha["dasha/<br/>DashaTimeline (D3)"]
        Yoga["yoga/<br/>YogaCard, YogaGrid"]
        Transit["transit/<br/>TransitWheel"]
        Reports["reports/<br/>ReportViewer"]
        Chat["chat/<br/>ChatInterface"]
        Layout["layout/<br/>Header, Sidebar,<br/>ThemeProvider"]
        Dashboard["dashboard/<br/>ProfileGrid, ProfileCard"]
        Notif["notifications/<br/>AlertBell"]
    end

    subgraph Lib["Library (src/lib/)"]
        AstroClient["astro-client.ts<br/>HTTP client to astro-engine"]
        ReportGen["report-generator.ts<br/>OpenRouter streaming"]
        PromptTemplates["report-prompts/<br/>9 report type templates"]
        RAG["rag/<br/>chat.ts, retriever.ts,<br/>chunker.ts, embedder.ts"]
        WorkerLib["workers/<br/>queue.ts, report-worker.ts,<br/>alert-worker.ts, index.ts"]
        SupabaseLib["supabase/<br/>client.ts, server.ts, types.ts"]
    end

    AppRouter --> Components
    AppRouter --> Lib
    APIRoutes --> AstroClient
    APIRoutes --> ReportGen
    APIRoutes --> RAG
    APIRoutes --> WorkerLib
    APIRoutes --> SupabaseLib
    ReportGen --> PromptTemplates
    RAG --> SupabaseLib
    WorkerLib --> AstroClient
```

### astro-engine (Python Domain Microservice)

The astro-engine is a stateless FastAPI microservice dedicated to astronomical calculations and PDF generation.

```mermaid
graph TB
    subgraph Routers["FastAPI Routers"]
        ChartRouter["chart.py<br/>POST /chart<br/>GET /chart/transits<br/>POST /chart/transits/natal"]
        DashaRouter["dasha.py<br/>POST /dasha<br/>POST /dasha/current<br/>GET /dasha/antardasha/{planet}<br/>GET /dasha/pratyantardasha/{maha}/{antar}"]
        YogaRouter["yogas.py<br/>POST /yogas<br/>POST /yogas/filter/{type}<br/>POST /yogas/benefic<br/>POST /yogas/malefic<br/>POST /yogas/strong"]
        PDFRouter["pdf.py<br/>POST /pdf/report<br/>POST /pdf/report/preview"]
    end

    subgraph Core["Core Calculators"]
        Calculator["calculator.py<br/>Julian Day, planetary positions,<br/>lagna, houses, dignity"]
        Nakshatra["nakshatra.py<br/>27 nakshatras, padas,<br/>dasha lords"]
        DashaCore["dasha.py<br/>Vimshottari: Maha, Antar,<br/>Pratyantardasha, current"]
        YogaRules["yoga_rules.py<br/>25+ classical yoga<br/>detection rules"]
        Ashtakavarga["ashtakavarga.py<br/>7 planets +<br/>Sarvashtakavarga"]
    end

    subgraph External["External Libraries"]
        SwissEph["pyswisseph<br/>(Swiss Ephemeris)"]
        ReportLabLib["ReportLab<br/>(PDF rendering)"]
    end

    subgraph Schemas["Pydantic Schemas"]
        BirthData["BirthData"]
        ChartData["ChartData"]
        Planet["Planet"]
        House["House"]
        DashaPeriod["DashaPeriod"]
        Yoga["Yoga"]
        Ashtakavarga_s["Ashtakavarga"]
        TransitData["TransitData"]
    end

    ChartRouter --> Calculator
    ChartRouter --> Nakshatra
    ChartRouter --> DashaCore
    ChartRouter --> YogaRules
    ChartRouter --> Ashtakavarga
    DashaRouter --> DashaCore
    DashaRouter --> Calculator
    YogaRouter --> YogaRules
    PDFRouter --> ReportLabLib
    Calculator --> SwissEph
    DashaCore --> Nakshatra
    Routers --> Schemas
```

### BullMQ Job System

```mermaid
graph TB
    subgraph Producers["Job Producers"]
        ReportAPI["POST /api/v1/reports/generate<br/>(after SSE stream completes)"]
        AlertTrigger["Alert trigger<br/>(scheduled or manual)"]
    end

    subgraph Queues["Redis Queues"]
        ReportQueue["report-generation<br/>Job: generate-pdf"]
        AlertQueue["transit-alerts<br/>Job: generate-alerts"]
    end

    subgraph Workers["BullMQ Workers"]
        RW["Report Worker<br/>Concurrency: 1<br/>Attempts: 3<br/>Backoff: exponential (2s)"]
        AW["Alert Worker<br/>Concurrency: 1<br/>Attempts: 2<br/>Backoff: fixed (5s)"]
    end

    subgraph Outputs["Worker Outputs"]
        PDF["PDF uploaded to<br/>Supabase Storage"]
        Alerts["Transit alerts<br/>inserted into DB"]
    end

    ReportAPI -->|"enqueuePDFGeneration(reportId)"| ReportQueue
    AlertTrigger -->|"enqueueAlertGeneration(profileId)"| AlertQueue
    ReportQueue --> RW
    AlertQueue --> AW
    RW --> PDF
    AW --> Alerts
```

---

## Database Schema (ERD)

```mermaid
erDiagram
    auth_users {
        uuid id PK
        text email
        text encrypted_password
        timestamptz created_at
    }

    profiles {
        uuid id PK
        uuid user_id FK
        text name
        date birth_date
        time birth_time
        text birth_place
        float latitude
        float longitude
        text timezone
        text relation
        text avatar_url
        jsonb chart_data
        timestamptz chart_calculated_at
        boolean is_active
        timestamptz created_at
        timestamptz updated_at
    }

    reports {
        uuid id PK
        uuid profile_id FK
        text report_type
        text language
        text content
        text summary
        text model_used
        text generation_status
        integer year
        boolean is_favorite
        text pdf_url
        timestamptz pdf_generated_at
        timestamptz created_at
    }

    report_chunks {
        uuid id PK
        uuid report_id FK
        uuid profile_id FK
        integer chunk_index
        text content
        vector_1536 embedding
        jsonb metadata
        timestamptz created_at
    }

    chat_sessions {
        uuid id PK
        uuid profile_id FK
        text title
        timestamptz created_at
        timestamptz updated_at
    }

    chat_messages {
        uuid id PK
        uuid session_id FK
        text role
        text content
        jsonb sources
        text model_used
        timestamptz created_at
    }

    user_preferences {
        uuid id PK
        uuid user_id FK
        text ayanamsha
        text house_system
        text dasha_system
        text chart_style
        text default_language
        text preferred_model
        boolean alert_enabled
        float alert_orb
        boolean whatsapp_digest_enabled
        text whatsapp_number
        text whatsapp_digest_time
        boolean email_digest_enabled
        text email_digest_day
        timestamptz created_at
        timestamptz updated_at
    }

    transit_alerts {
        uuid id PK
        uuid profile_id FK
        text alert_type
        text title
        text content
        text planet
        text natal_planet
        float orb
        date trigger_date
        boolean is_read
        boolean dispatched_whatsapp
        boolean dispatched_email
        timestamptz created_at
    }

    auth_users ||--o{ profiles : "has many"
    auth_users ||--o| user_preferences : "has one"
    profiles ||--o{ reports : "has many"
    profiles ||--o{ chat_sessions : "has many"
    profiles ||--o{ transit_alerts : "has many"
    profiles ||--o{ report_chunks : "has many"
    reports ||--o{ report_chunks : "has many"
    chat_sessions ||--o{ chat_messages : "has many"
```

---

## API Reference

### Next.js API Routes (BFF Layer)

All routes are prefixed with `/api/v1/`. Authentication is enforced via Supabase Auth (`supabase.auth.getUser()`). Input validation uses Zod schemas.

| Method | Path | Auth | Description | Request Body | Response |
|--------|------|------|-------------|-------------|----------|
| `POST` | `/api/v1/auth/signup` | No | Create new user account | `{email, password}` | `{user}` |
| `POST` | `/api/v1/auth/login` | No | Sign in with email/password | `{email, password}` | `{user}` |
| `GET` | `/api/v1/profiles` | Yes | List all user profiles | -- | `Profile[]` |
| `POST` | `/api/v1/profiles` | Yes | Create family profile | `{name, birth_date, birth_time, birth_place, latitude, longitude, timezone, relation?, avatar_url?}` | `Profile` |
| `GET` | `/api/v1/profiles/:id` | Yes | Get single profile | -- | `Profile` |
| `PATCH` | `/api/v1/profiles/:id` | Yes | Update profile fields | Partial `Profile` fields | `Profile` |
| `DELETE` | `/api/v1/profiles/:id` | Yes | Delete profile (cascades) | -- | `{success: true}` |
| `POST` | `/api/v1/calculate` | Yes | Calculate birth chart | `{profileId, birthData}` | `{success, chartData}` |
| `POST` | `/api/v1/reports/generate` | Yes | Generate streaming report | `{profileId, reportType, language?, model?}` | SSE stream |
| `POST` | `/api/v1/chat` | Yes | RAG chat with birth chart | `{profileId, sessionId?, message, model?}` | SSE stream |
| `GET` | `/api/v1/transits` | Yes | Current planetary transits | -- | `TransitData` |
| `GET` | `/api/v1/alerts` | Yes | List transit alerts | `?profileId=` (query param) | `TransitAlert[]` |
| `PATCH` | `/api/v1/alerts` | Yes | Mark alert read/unread | `{alertId, is_read}` | `TransitAlert` |

### astro-engine Endpoints

All endpoints are served from the FastAPI application on port 8000. No authentication is required (internal service communication only).

| Method | Path | Description | Request Body | Response |
|--------|------|-------------|-------------|----------|
| `GET` | `/` | API info and endpoint listing | -- | `{name, version, endpoints}` |
| `GET` | `/health` | Health check | -- | `{status: "healthy"}` |
| `POST` | `/chart` | Calculate complete birth chart | `BirthData` | `ChartData` (planets, houses, dashas, yogas, ashtakavarga) |
| `GET` | `/chart/transits` | Current planetary positions | -- | `TransitData` |
| `POST` | `/chart/transits/natal` | Transit aspects vs natal chart | `ChartData` (natal) | `TransitVsNatalData` (aspects, significant transits) |
| `POST` | `/dasha` | Full 120-year dasha sequence | `BirthData` | `DashaSequence` |
| `POST` | `/dasha/current` | Current mahadasha/antardasha/pratyantardasha | `BirthData`, `?date=` | `{mahadasha, antardasha, pratyantardasha}` |
| `GET` | `/dasha/antardasha/:planet` | Antardasha periods for a mahadasha | `?start_date=&end_date=` | `{antardashas[]}` |
| `GET` | `/dasha/pratyantardasha/:maha/:antar` | Pratyantardasha periods | `?start_date=&end_date=` | `{pratyantardashas[]}` |
| `POST` | `/yogas` | Detect all yogas from chart | `ChartData` | `Yoga[]` |
| `POST` | `/yogas/filter/:type` | Filter yogas by type | `ChartData` | `Yoga[]` |
| `POST` | `/yogas/benefic` | Benefic yogas only | `ChartData` | `Yoga[]` |
| `POST` | `/yogas/malefic` | Malefic yogas only | `ChartData` | `Yoga[]` |
| `POST` | `/yogas/strong` | Strong/exceptional yogas only | `ChartData` | `Yoga[]` |
| `POST` | `/pdf/report` | Generate PDF (download) | `{title, content, author?, subject?}` | PDF binary stream |
| `POST` | `/pdf/report/preview` | Generate PDF (inline preview) | `{title, content, author?, subject?}` | PDF binary stream |

---

## Deployment Architecture

```mermaid
graph TB
    subgraph Internet["Internet"]
        User["User Browser"]
    end

    subgraph Dokploy["Dokploy VPS (Hostinger)<br/>adaptivesmartsystems.cc"]
        subgraph DockerCompose["Docker Compose"]
            Web["web<br/>Next.js 15<br/>:3000"]
            Worker["worker<br/>BullMQ Workers"]
            Engine["astro-engine<br/>FastAPI + pyswisseph<br/>:8000"]
            LocalRedis["redis<br/>Redis 7 Alpine<br/>:6379"]
        end
    end

    subgraph Supabase["Supabase Cloud"]
        PG["PostgreSQL 15<br/>+ pgvector extension"]
        Auth["Supabase Auth<br/>(Email + Google OAuth)"]
        Storage["Supabase Storage<br/>(PDF files)"]
    end

    subgraph CloudServices["Cloud Services"]
        OpenRouter["OpenRouter API<br/>Claude Sonnet 4.5 /<br/>Gemini 2.0 Flash"]
        Upstash["Upstash Redis<br/>(production queue)"]
    end

    User -->|"HTTPS"| Web
    Web -->|"Internal HTTP"| Engine
    Web -->|"Jobs"| LocalRedis
    Worker -->|"Process Jobs"| LocalRedis
    Worker -->|"PDF Gen"| Engine
    Web -->|"Auth + CRUD"| PG
    Web -->|"Auth"| Auth
    Worker -->|"Upload PDF"| Storage
    Web -->|"LLM + Embeddings"| OpenRouter
    Worker -->|"Read/Write"| PG
```

---

## Environment Variables Reference

| Variable | Service | Required | Description |
|----------|---------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | web, worker | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | web | Yes | Supabase anonymous/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | web, worker | Yes | Supabase service role key (server-only) |
| `OPENROUTER_API_KEY` | web, worker | Yes | OpenRouter API key for LLM + embeddings |
| `ASTRO_ENGINE_URL` | web, worker | Yes | URL to astro-engine (default: `http://localhost:8000`) |
| `REDIS_URL` | web, worker | Yes | Redis connection URL (default: `redis://localhost:6379`) |
| `NEXT_PUBLIC_APP_URL` | web | Yes | Public app URL (default: `http://localhost:3000`) |
| `NEXT_PUBLIC_APP_NAME` | web | No | App display name (default: `JyotishAI`) |
| `ENVIRONMENT` | astro-engine | No | `development` or `production` (controls docs endpoint) |
| `ALLOWED_ORIGINS` | astro-engine | No | Comma-separated CORS origins |
| `WHATSAPP_GATEWAY_URL` | web | No | WhatsApp notification gateway URL |
| `WHATSAPP_API_KEY` | web | No | WhatsApp gateway API key |

---

## Technology Stack

### Frontend

| Technology | Version | Purpose |
|-----------|---------|---------|
| Next.js | 16.x | App Router, SSR, API routes |
| React | 19.x | UI framework |
| TypeScript | 5.7 | Type safety |
| Tailwind CSS | 3.4 | Utility-first styling |
| shadcn/ui | latest | Component primitives |
| Framer Motion | 11.x | Animations (yoga cards, transitions) |
| D3.js | 7.9 | SVG chart rendering (kundli, dasha timeline) |
| React Three Fiber | 8.16 | 3D solar system visualization |
| @react-three/drei | 9.105 | R3F helpers |
| Three.js | 0.165 | 3D engine |
| Zustand | 5.0 | Client state management |
| react-hook-form | 7.54 | Form handling |
| react-markdown | 9.0 | Report content rendering |
| Lucide React | 0.460 | Icons |
| Zod | 3.24 | Runtime schema validation |

### Backend (astro-engine)

| Technology | Version | Purpose |
|-----------|---------|---------|
| Python | 3.11 | Runtime |
| FastAPI | 0.115+ | HTTP framework |
| Uvicorn | 0.30+ | ASGI server |
| pyswisseph | 2.10+ | Swiss Ephemeris bindings |
| Pydantic | 2.8+ | Data validation and serialization |
| ReportLab | 4.2+ | PDF generation |
| httpx | 0.27+ | HTTP client |

### Data and Infrastructure

| Technology | Version | Purpose |
|-----------|---------|---------|
| Supabase | Cloud | PostgreSQL + Auth + Storage |
| pgvector | Extension | Vector similarity search (RAG) |
| Redis | 7.x | Job queue backend |
| BullMQ | 5.22+ | Job queue library |
| IORedis | 5.4+ | Redis client for Node.js |
| Docker | Compose 3.9 | Container orchestration |

### AI/LLM

| Technology | Purpose |
|-----------|---------|
| OpenRouter API | LLM gateway |
| Claude Sonnet 4.5 | Primary report generation model |
| Gemini 2.0 Flash | Alternative model (user-togglable) |
| text-embedding-3-small | Embedding model (OpenAI via OpenRouter) |

---

## Security Model

### Authentication

```mermaid
sequenceDiagram
    actor User
    participant Browser
    participant NextAPI as Next.js API
    participant SupaAuth as Supabase Auth

    User->>Browser: Enter email + password
    Browser->>NextAPI: POST /api/v1/auth/login
    NextAPI->>SupaAuth: signInWithPassword(email, password)
    SupaAuth-->>NextAPI: {user, session}
    NextAPI-->>Browser: Set session cookie

    Note over Browser,NextAPI: Subsequent requests include<br/>session cookie automatically

    Browser->>NextAPI: GET /api/v1/profiles
    NextAPI->>NextAPI: createServerClient()
    NextAPI->>SupaAuth: getUser() -- validates session
    SupaAuth-->>NextAPI: {user}
    NextAPI->>NextAPI: Proceed with user.id scope
```

### Row Level Security (RLS)

All database tables have RLS enabled. Policies enforce that:

- **profiles**: Users can only CRUD their own profiles (`auth.uid() = user_id`)
- **reports**: Users can only access reports belonging to their profiles
- **report_chunks**: Scoped to profile ownership
- **chat_sessions**: Scoped to profile ownership
- **chat_messages**: Access via session ownership chain (messages -> sessions -> profiles -> user)
- **user_preferences**: Users can only access their own preferences (`auth.uid() = user_id`)
- **transit_alerts**: Scoped to profile ownership

### Defense-in-Depth

In addition to RLS policies, every API route performs an explicit auth check and scopes queries to `user_id`:

```
// Double-check: RLS + explicit user_id filter
const { data: profile } = await supabase
  .from("profiles")
  .select("*")
  .eq("id", profileId)
  .eq("user_id", user.id)  // Defense-in-depth
  .single();
```

### Input Validation

All API routes use Zod schemas for request body validation, preventing injection and mass-assignment attacks.

### CORS

The astro-engine uses CORS middleware configured via the `ALLOWED_ORIGINS` environment variable. In production, Swagger docs (`/docs`, `/redoc`) are disabled.

---

## Scaling Strategy

### Current Design (Personal/Family Use)

The system is designed for a single-user or small-family deployment:

- Single VPS with all Docker containers
- Supabase free tier for database and storage
- Upstash free tier for Redis
- Single worker process handling both report and alert queues

### Future Multi-User Scaling

If the platform were to scale to multiple users, the following changes would apply:

| Component | Current | Scaled |
|-----------|---------|--------|
| Web server | Single container | Horizontal scaling behind load balancer |
| astro-engine | Single container | Multiple replicas (stateless, easy to scale) |
| Workers | Single process, both queues | Separate worker pools per queue type |
| Redis | Local container or Upstash free | Managed Redis cluster (Upstash Pro, ElastiCache) |
| Database | Supabase free tier | Supabase Pro or self-hosted PostgreSQL with read replicas |
| Storage | Supabase Storage | CDN-fronted storage (CloudFront + S3) |
| LLM | OpenRouter pay-per-use | Rate limiting, request pooling, model fallback chain |
| Embeddings | Batch on report save | Background embedding pipeline with queue |
| Alerts | On-demand trigger | Cron-based scheduler (BullMQ repeatable jobs) |
