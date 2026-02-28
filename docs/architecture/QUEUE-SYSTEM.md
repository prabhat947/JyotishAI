# JyotishAI -- BullMQ Queue System

## Overview

JyotishAI uses BullMQ (backed by Redis) for asynchronous job processing. There are two distinct queues: one for PDF report generation and one for transit alert computation. Both queues share a single Redis connection and are processed by dedicated workers that run as a separate Docker service.

The queue system decouples time-intensive operations (PDF rendering, astronomical computations for alerts) from the user-facing request/response cycle, ensuring the web application remains responsive.

---

## Architecture Overview

```mermaid
graph LR
    subgraph Producers["Job Producers (Next.js API Routes)"]
        P1["POST /api/v1/reports/generate<br/>enqueuePDFGeneration(reportId)"]
        P2["Alert Trigger<br/>enqueueAlertGeneration(profileId)"]
    end

    subgraph Redis["Redis 7"]
        Q1["Queue: report-generation"]
        Q2["Queue: transit-alerts"]
    end

    subgraph Workers["Worker Process (Docker: worker)"]
        W1["Report Worker"]
        W2["Alert Worker"]
    end

    subgraph Sinks["Output Targets"]
        S1["Supabase Storage<br/>(PDF files)"]
        S2["Supabase DB<br/>(transit_alerts table)"]
    end

    P1 --> Q1
    P2 --> Q2
    Q1 --> W1
    Q2 --> W2
    W1 --> S1
    W2 --> S2
```

---

## Queue Definitions

### `report-generation` Queue

**Purpose**: Generates PDF files from completed report content. After an LLM-streamed report finishes writing to the database, the API route enqueues a PDF generation job.

**Source file**: `web/src/lib/workers/queue.ts`

```typescript
export const reportQueue = new Queue("report-generation", {
  connection: redisConnection,
});
```

**Job types**:

| Job Name | Payload | Description |
|----------|---------|-------------|
| `generate-pdf` | `{ reportId: string }` | Generate a PDF from a completed report |

**Enqueue function**:

```typescript
export async function enqueuePDFGeneration(reportId: string) {
  await reportQueue.add("generate-pdf", { reportId }, {
    attempts: 3,
    backoff: { type: "exponential", delay: 2000 },
  });
}
```

### `transit-alerts` Queue

**Purpose**: Computes current transit aspects against a natal chart and creates alert records for significant planetary configurations.

**Source file**: `web/src/lib/workers/queue.ts`

```typescript
export const alertQueue = new Queue("transit-alerts", {
  connection: redisConnection,
});
```

**Job types**:

| Job Name | Payload | Description |
|----------|---------|-------------|
| `generate-alerts` | `{ profileId: string }` | Calculate and store transit alerts for a profile |

**Enqueue function**:

```typescript
export async function enqueueAlertGeneration(profileId: string) {
  await alertQueue.add("generate-alerts", { profileId }, {
    attempts: 2,
    backoff: { type: "fixed", delay: 5000 },
  });
}
```

---

## Redis Connection

A single shared IORedis connection is used by all queues and workers. This avoids connection proliferation and is the recommended BullMQ pattern.

**Source file**: `web/src/lib/workers/queue.ts`

```typescript
const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

export const redisConnection = new IORedis(REDIS_URL, {
  maxRetriesPerRequest: null, // Required for BullMQ
});
```

The `maxRetriesPerRequest: null` setting is mandatory for BullMQ workers -- without it, IORedis will throw errors when blocking for jobs.

---

## Worker Configurations

### Report Worker

**Source file**: `web/src/lib/workers/report-worker.ts`

```mermaid
graph TB
    subgraph ReportWorkerFlow["Report Worker: generate-pdf"]
        A["Receive Job<br/>{reportId}"] --> B["Fetch Report<br/>from Supabase"]
        B --> C{Has content?}
        C -->|No| D["Throw Error<br/>(will retry)"]
        C -->|Yes| E["POST /pdf/report<br/>to astro-engine"]
        E --> F["Receive PDF binary"]
        F --> G["Upload to Supabase Storage<br/>reports/{reportId}.pdf"]
        G --> H["Get public URL"]
        H --> I["UPDATE report record<br/>pdf_url + pdf_generated_at"]
        I --> J["Job Complete"]
    end
```

| Setting | Value | Rationale |
|---------|-------|-----------|
| Queue name | `report-generation` | Matches producer queue |
| Concurrency | 1 (default) | PDF generation is CPU-intensive |
| Max attempts | 3 | Network/service failures are transient |
| Backoff type | Exponential | 2s, 4s, 8s -- avoids overwhelming astro-engine |
| Backoff delay | 2000ms | Base delay |

**Failure scenarios**:

| Failure | Behavior |
|---------|----------|
| Report not found in DB | Throws error, job retries |
| Report has no content yet | Throws error, job retries (content may still be streaming) |
| astro-engine PDF endpoint fails | Throws error with HTTP status, job retries |
| Supabase Storage upload fails | Throws error, job retries |

### Alert Worker

**Source file**: `web/src/lib/workers/alert-worker.ts`

```mermaid
graph TB
    subgraph AlertWorkerFlow["Alert Worker: generate-alerts"]
        A["Receive Job<br/>{profileId}"] --> B["Fetch Profile<br/>from Supabase"]
        B --> C{Has chart_data?}
        C -->|No| D["Skip: return success<br/>(alertCount: 0, skipped: true)"]
        C -->|Yes| E["GET /chart/transits<br/>from astro-engine"]
        E --> F["POST /chart/transits/natal<br/>Calculate aspects"]
        F --> G["Filter: orb <= 2.0 degrees"]
        G --> H{Significant aspects?}
        H -->|No| I["Return success<br/>(alertCount: 0)"]
        H -->|Yes| J["INSERT transit_alert<br/>for each aspect"]
        J --> K["Return success<br/>(alertCount: N)"]
    end
```

| Setting | Value | Rationale |
|---------|-------|-----------|
| Queue name | `transit-alerts` | Matches producer queue |
| Concurrency | 1 (default) | Computational work, sequential processing |
| Max attempts | 2 | Alert generation is less critical than PDF |
| Backoff type | Fixed | 5s flat delay between retries |
| Backoff delay | 5000ms | Fixed delay |
| Alert orb threshold | 2.0 degrees | Only tight aspects trigger alerts |

**Failure scenarios**:

| Failure | Behavior |
|---------|----------|
| Profile not found | Throws error, job retries |
| No chart_data on profile | Returns success with `skipped: true` (not an error) |
| astro-engine transit endpoint fails | Throws error, job retries |
| Supabase INSERT fails | Throws error, job retries |

---

## Worker Process Lifecycle

Both workers are started together from a single entry point.

**Source file**: `web/src/lib/workers/index.ts`

```mermaid
sequenceDiagram
    participant OS as Operating System
    participant Index as workers/index.ts
    participant RW as Report Worker
    participant AW as Alert Worker
    participant Redis

    OS->>Index: Process starts
    Index->>RW: import './report-worker'
    RW->>Redis: Connect + start polling
    Index->>AW: import './alert-worker'
    AW->>Redis: Connect + start polling

    Note over RW,AW: Workers now polling<br/>for jobs continuously

    loop Job Processing
        Redis-->>RW: Job available
        RW->>RW: Process generate-pdf
        RW-->>Redis: Job complete/failed
    end

    OS->>Index: SIGTERM
    Index->>Index: process.exit(0)

    OS->>Index: SIGINT
    Index->>Index: process.exit(0)
```

**NPM scripts for running workers**:

| Script | Command | Usage |
|--------|---------|-------|
| `npm run worker` | `tsx watch src/lib/workers/report-worker.ts` | Dev: report worker with hot reload |
| `npm run alert-worker` | `tsx watch src/lib/workers/alert-worker.ts` | Dev: alert worker with hot reload |

In Docker, the worker container runs both workers together via the entry point that imports both modules.

---

## Scheduled / Repeatable Job Patterns

Currently, alert generation is triggered on-demand (via API call or manual trigger). For production use, BullMQ's repeatable job feature can be used to schedule daily alert generation:

```mermaid
graph TB
    subgraph FutureScheduler["Planned: Repeatable Jobs"]
        Repeat["alertQueue.add('generate-alerts',<br/>{profileId},<br/>{repeat: {pattern: '0 6 * * *'}})<br/>-- Every day at 6 AM"]
    end

    subgraph FutureDigest["Planned: Digest Jobs"]
        WhatsApp["Daily WhatsApp digest<br/>7:00 AM IST"]
        Email["Weekly email digest<br/>Monday morning"]
    end

    FutureScheduler --> WhatsApp
    FutureScheduler --> Email
```

The `user_preferences` table already stores `whatsapp_digest_time` and `email_digest_day` fields to support per-user scheduling.

---

## Error Handling and Dead Letter Queue Strategy

### Retry Flow

```mermaid
graph TB
    A["Job Created"] --> B["Worker Picks Up Job"]
    B --> C{Processing}
    C -->|Success| D["Job Completed<br/>(removed from queue)"]
    C -->|Error| E{Attempts remaining?}
    E -->|Yes| F["Wait (backoff)"]
    F --> B
    E -->|No| G["Job Failed<br/>(max attempts exceeded)"]
    G --> H["Event: worker.on('failed')"]
    H --> I["Log error to console"]
```

### Current Error Handling

Both workers attach event listeners for completed and failed jobs:

```typescript
worker.on("completed", (job) => {
  console.log(`Job ${job.id} completed`);
});

worker.on("failed", (job, err) => {
  console.error(`Job ${job?.id} failed:`, err.message);
});
```

### Planned: Dead Letter Queue

For production reliability, a dead letter queue (DLQ) pattern can be added:

```mermaid
graph LR
    subgraph Processing["Normal Processing"]
        MainQueue["report-generation"] --> Worker["Report Worker"]
    end

    subgraph DLQ["Dead Letter Queue"]
        Worker -->|"Max retries exceeded"| DLQQueue["report-generation-dlq"]
        DLQQueue --> Monitor["Manual review<br/>or retry logic"]
    end
```

This would involve adding a `failedHandler` that moves exhausted jobs to a separate DLQ for manual inspection or delayed reprocessing.

---

## Monitoring and Observability

### Current State

Observability is console-based:

- Worker start/stop messages logged to stdout
- Per-job completion and failure logged with job ID
- Alert counts logged per profile

### Recommended Enhancements

| Area | Tool | Purpose |
|------|------|---------|
| Queue metrics | BullMQ Dashboard (Bull Board) | Visual queue inspection |
| Job latency | Custom Redis metrics | Track processing times |
| Error alerting | Structured logging + Sentry | Alert on repeated failures |
| Redis health | Upstash dashboard / redis-cli | Monitor memory, connections |

### Key Metrics to Track

| Metric | Description |
|--------|-------------|
| `report_queue.waiting` | Jobs waiting to be processed |
| `report_queue.active` | Jobs currently being processed |
| `report_queue.completed` | Total completed jobs |
| `report_queue.failed` | Total failed jobs |
| `alert_queue.waiting` | Alert jobs waiting |
| `job.duration.report_pdf` | Time to generate a PDF |
| `job.duration.alert_gen` | Time to generate alerts |

---

## Queue System File Map

| File | Purpose |
|------|---------|
| `web/src/lib/workers/queue.ts` | Redis connection, queue definitions, enqueue functions |
| `web/src/lib/workers/report-worker.ts` | Report PDF generation worker |
| `web/src/lib/workers/alert-worker.ts` | Transit alert generation worker |
| `web/src/lib/workers/index.ts` | Worker entry point (imports both workers, handles signals) |
| `docker-compose.yml` (worker service) | Docker configuration for worker container |
