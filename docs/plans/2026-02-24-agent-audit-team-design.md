# JyotishAI Agent Audit Team Design
**Date:** 2026-02-24
**Purpose:** Multi-persona code audit of the JyotishAI codebase from 5 expert angles

---

## Context

The JyotishAI scaffold is substantially built:
- `astro-engine/` — FastAPI Python microservice with pyswisseph, yoga rules, dasha, nakshatra, ashtakavarga, PDF
- `web/` — Next.js 15 App Router with Supabase auth, API routes, RAG lib, UI components (kundli, dasha timeline, yoga cards, transit wheel, 3D solar system, chat)
- `supabase/migrations/` — Full schema with pgvector, RLS, hybrid search function

Goal: audit the existing code from 5 expert perspectives before integration/deployment.

---

## Team Structure

### Round 1 — 4 Specialists in Parallel

| Persona | Domain | Output File |
|---------|--------|-------------|
| Senior UX/UI Designer | `web/src/components/`, `web/src/app/(main)/`, `web/src/app/(auth)/` | `docs/audits/ux-audit.md` |
| Senior Backend Developer | `web/src/app/api/`, `web/src/lib/`, `web/src/lib/workers/`, `astro-engine/routers/`, `astro-engine/main.py` | `docs/audits/backend-audit.md` |
| Staff Technical Architect | Full repo, `docker-compose.yml`, `ARCHITECTURE.md`, data flow | `docs/audits/architecture-audit.md` |
| PostgreSQL/Supabase DB Expert | `web/src/lib/supabase/`, `supabase/migrations/`, `docs/DATABASE.md`, `web/src/lib/rag/` | `docs/audits/database-audit.md` |

### Round 2 — Devil's Advocate

Reads all 4 specialist reports + full codebase. Challenges every assumption, finds contradictions, surfaces hard problems.
Output: `docs/audits/devils-advocate-audit.md`

### Final Synthesis

Consolidates into `docs/audits/AUDIT_SUMMARY.md`:
- Critical blockers
- High-priority improvements
- Cross-specialist disagreements (with devil's advocate verdict)
- Quick wins

---

## Model

All agents: `claude-opus-4-6`

---

## Status

- [ ] Round 1: 4 parallel specialists
- [ ] Round 2: Devil's advocate
- [ ] Final: AUDIT_SUMMARY.md
