<p align="center">
  <img src="public/nexus-tower-logo.svg" alt="NexusTower" width="80" />
</p>

<h1 align="center">NexusTower</h1>

<p align="center">
  <strong>Agentic Logistics Control Tower</strong><br/>
  <em>Detect disruptions from live data. Reason with AI. Execute with human approval.</em>
</p>

<p align="center">
  <a href="https://nexus-tower.vercel.app">Live Demo</a> &nbsp;&bull;&nbsp;
  <a href="docs/DEMO-SCRIPT.md">Demo Script</a> &nbsp;&bull;&nbsp;
  <a href="docs/PLAN.md">Architecture & Build Log</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black?logo=nextdotjs" alt="Next.js 16" />
  <img src="https://img.shields.io/badge/React-19-blue?logo=react" alt="React 19" />
  <img src="https://img.shields.io/badge/AI_SDK-v6-purple" alt="AI SDK v6" />
  <img src="https://img.shields.io/badge/Bedrock-Claude_3.5-orange?logo=amazonaws" alt="Bedrock" />
  <img src="https://img.shields.io/badge/MCP-enabled-green" alt="MCP" />
  <img src="https://img.shields.io/badge/Data-100%25_Real-brightgreen" alt="Real Data" />
</p>

---

## What is NexusTower?

Supply chain teams drown in dashboards but still scramble when disruptions hit. They can _see_ problems but can't _act_ on them without switching between five tools, three calls, and a spreadsheet.

**NexusTower closes the loop:**

```
  Live AIS         Open-Meteo         GDELT            WITS
  vessels          weather            geopolitics      tariffs
     |                |                  |               |
     v                v                  v               v
  +----------------------------------------------------------+
  |              DETECT  disruption signals               |
  +----------------------------------------------------------+
                          |
                          v
  +----------------------------------------------------------+
  |     REASON  with Claude agent calling real tools          |
  |     (query shipments, check weather, scan GDELT,          |
  |      compute emissions, simulate tariffs)                 |
  +----------------------------------------------------------+
                          |
                          v
  +----------------------------------------------------------+
  |     PROPOSE  a structured fix (reroute, rebook, notify)   |
  +----------------------------------------------------------+
                          |
                          v
  +----------------------------------------------------------+
  |     APPROVE  via Human-in-the-Loop operator sign-off      |
  +----------------------------------------------------------+
                          |
                          v
  +----------------------------------------------------------+
  |     EXECUTE  real DB mutation + immutable audit log        |
  +----------------------------------------------------------+
```

Every data point comes from a real external API. Zero mocks. Zero fake data. Zero seed files.

---

## Three Differentiators

### 1. Live, Real-World Data

| Feed | Source | What It Provides |
|------|--------|-----------------|
| Vessel Positions | [aisstream.io](https://aisstream.io) WebSocket | Real-time AIS ship tracking globally |
| Weather | [Open-Meteo](https://open-meteo.com) | Marine + standard forecasts along route waypoints |
| Geopolitics | [GDELT 2.0](https://www.gdeltproject.org) | Real-time global events near shipping corridors |
| Tariffs | [WITS](https://wits.worldbank.org) World Bank API | Duty rates by HS-6 code, origin, and destination |
| Routing | [OSRM](https://project-osrm.org) / OpenRouteService | Real road distances; great-circle for sea legs |
| Emissions | GLEC Framework v3 | Well-to-Wheel CO2e factors per transport mode |

Judges can paste any vessel MMSI and watch it move on the map.

### 2. Human-in-the-Loop Shared Autonomy

The agent **never** auto-executes high-stakes actions. Every mutation flows through:

```
Agent proposes action  -->  Operator reviews  -->  Approve / Reject  -->  Audit log entry
                                                                          (who, what, when, outcome)
```

Tools like `rebookCarrier` and `notifyClient` return `{ status: "pending_approval" }` and block until a human signs off. The `events_audit` table records every decision with the operator's Clerk identity.

### 3. MCP Server

The same tool registry powers both the web chat UI and an MCP endpoint at `/api/mcp`. External agents (Claude Desktop, IDE clients, partner ERPs) can drive logistics on the same audited, HITL-gated rails.

```jsonc
// Claude Desktop config — paste and go
{
  "mcpServers": {
    "nexustower": {
      "url": "https://nexus-tower.vercel.app/api/mcp",
      "headers": { "Authorization": "Bearer <your-mcp-token>" }
    }
  }
}
```

One source of truth. Two interfaces. Same audit trail.

---

## Architecture

```
                    +--------------------------------------------+
                    |          External Real-World Feeds          |
                    |  aisstream.io . Open-Meteo . GDELT . WITS  |
                    |  OSRM . OpenFreeMap tiles                   |
                    +-------------------+------------------------+
                                        |  WS / HTTPS
                                        v
        +-----------------+   +---------------------------------+
        |  AIS Ingestor   |-->|         Turso (libSQL)          |<--+
        |  (Node worker / |   |  shipments . vessels . events   |   |
        |   AWS Lambda)   |   |  exceptions . audit . tokens    |   |
        +-----------------+   +---------+-----------------------+   |
                                        |  Drizzle ORM              |
                                        v                           |
   +------------------------ Next.js 16 on Vercel ------------------+--+
   |                                                                   |
   |  /(dashboard) RSC pages   /api/chat (tool-loop)   /api/mcp (MCP) |
   |  /api/sse/events  /api/ingest/csv  /api/agent/execute (HITL)      |
   |                                                                   |
   |  lib/agent/tools/*  -- shared by /api/chat AND /api/mcp           |
   |     queryShipments . liveVesselPosition . checkPortCongestion     |
   |     getWeatherOnRoute . scanGdeltDisruptions . getTariffRate      |
   |     proposeReroute . rebookCarrier (HITL) . notifyClient (HITL)   |
   |     computeGwp . checkInventory                                   |
   +------------------+------------------------------------------------+
                      |  AWS SDK over HTTPS
                      v
          +---------------------------+     +--------------------+
          |  AWS Bedrock -- Claude    |     |   Clerk (Auth)     |
          |  3.5 Sonnet               |     |   Operator login   |
          +---------------------------+     +--------------------+
```

**Single tool registry** at `src/lib/agent/tools/index.ts` -- the same Zod-typed tools serve both `/api/chat` (operator chat) and `/api/mcp` (external MCP clients).

---

## Features

| # | Feature | Description |
|---|---------|-------------|
| F0 | Repo Baseline | shadcn/ui, typed env, Turbopack |
| F1 | Persistence | Turso + Drizzle ORM with full schema |
| F2 | Auth | Clerk with protected dashboard routes |
| F3 | App Shell | Dark-mode industrial UI, sidebar, topbar |
| F4 | Domain CRUD | Shipments, carriers, ports, CSV import, UN/LOCODE |
| F5 | AIS Ingestor | WebSocket stream to Turso + SSE fan-out |
| F6 | Enrichment | OSRM routing, Open-Meteo weather, GDELT events |
| F7 | Command Center | Real KPIs, live exception feed via SSE |
| F8 | Live Map | MapLibre + OpenFreeMap with vessel markers |
| F9 | Anomaly Detection | Rolling z-score on AIS speed, ETA drift |
| F10 | Agent API | Bedrock tool-loop with `streamText` + `stopWhen` |
| F11 | Agent Chat UI | Split-pane with reasoning panel + tool cards |
| F12 | HITL + Audit | Approval flow, immutable `events_audit` table |
| F13 | MCP Server | `/api/mcp` with per-user token management |
| F14 | Sustainability | GLEC GWP calculations + EU DPP JSON export |
| F15 | Tariffs | WITS API rates + landed-cost what-if simulator |
| F16 | Inventory | Safety stock, reorder alerts, CSV ingest |
| F17 | Budget Guard | Per-day token limits + topbar usage meter |
| F18 | Deploy | Vercel + Turso + Clerk + Bedrock + Lambda ingestor |
| F19 | Pitch Polish | Landing page, README, demo script |

All 20 features shipped. All wired to real services.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 16 App Router, React 19, Turbopack, Tailwind CSS v4, shadcn/ui |
| **AI / Agent** | Vercel AI SDK v6, Amazon Bedrock (Claude 3.5 Sonnet), MCP SDK |
| **Database** | Turso (libSQL) + Drizzle ORM -- edge-compatible, sub-ms reads |
| **Auth** | Clerk -- production-grade operator login |
| **Maps** | MapLibre GL JS + OpenFreeMap (no API key, true OSS) |
| **Realtime** | Server-Sent Events for vessel positions + exception feed |
| **Validation** | Zod everywhere -- API inputs, tool args, external responses |
| **Deploy** | Vercel (zero-config) + AWS Lambda (AIS ingestor) |

---

## Quick Start

### Prerequisites

- Node.js 20+
- A [Turso](https://turso.tech) database
- A [Clerk](https://clerk.com) application
- AWS Bedrock access (Claude 3.5 Sonnet enabled in your region)
- An [aisstream.io](https://aisstream.io) API key

### Setup

```bash
# Clone and install
git clone https://github.com/YOUR_USERNAME/nexus-tower.git
cd nexus-tower
npm install

# Configure environment
cp .env.local.example .env.local
# Fill in your keys (see Configuration below)

# Push schema to Turso
npm run db:push

# Start the app
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

For live AIS updates, run the ingestor in a second terminal:

```bash
npm run ingestor:dev
```

### Configuration

| Variable | Source |
|----------|--------|
| `TURSO_DATABASE_URL` | `turso db show nexus-tower` |
| `TURSO_AUTH_TOKEN` | `turso db tokens create nexus-tower` |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk dashboard |
| `CLERK_SECRET_KEY` | Clerk dashboard |
| `AWS_REGION` | AWS console (e.g. `us-east-1`) |
| `AWS_ACCESS_KEY_ID` | IAM user with Bedrock-only policy |
| `AWS_SECRET_ACCESS_KEY` | IAM user with Bedrock-only policy |
| `BEDROCK_MODEL_ID` | e.g. `anthropic.claude-3-5-sonnet-20241022-v2:0` |
| `AISSTREAM_API_KEY` | aisstream.io dashboard |
| `OPENROUTESERVICE_API_KEY` | _(optional)_ OpenRouteService fallback |
| `WITS_USER_NAME` | _(optional)_ WITS API for higher quota |

---

## Project Structure

```
nexus-tower/
  apps/
    ingestor/              # AIS WebSocket worker + Lambda adapter
  docs/
    PLAN.md                # Master plan with all 20 feature specs
    DEMO-SCRIPT.md         # 90-second demo walkthrough
    DEVPOST.md             # Devpost submission text
    NexusTower-Pitch.pptx  # Pitch deck
  src/
    app/
      (dashboard)/         # All authenticated pages
        dashboard/         # Command Center
        agent/             # AI chat with reasoning panel
        map/               # Live vessel map
        shipments/         # CRUD + detail views
        risk/              # ETA drift + anomaly charts
        sustainability/    # GLEC GWP + DPP export
        tariffs/           # WITS rates + what-if simulator
        inventory/         # Safety stock + reorder alerts
        audit/             # Immutable action log
        settings/mcp/      # MCP token management
      api/
        chat/              # Agent tool-loop (streamText)
        mcp/               # MCP server endpoint
        agent/             # HITL approve/reject routes
        sse/               # SSE streams (vessels, exceptions)
        ingest/            # CSV upload endpoints
        cron/              # Enrichment pipeline trigger
        dpp/               # EU Digital Product Passport JSON
    components/            # UI primitives + dashboard widgets
    db/
      schema.ts            # Drizzle schema (12 tables)
      index.ts             # Turso client singleton
    lib/
      agent/tools/         # Single tool registry (shared by chat + MCP)
      agent/budget.ts      # Token budget guardrails
      analytics/           # GWP calculations, anomaly detection
    server/
      enrich/              # OSRM, Open-Meteo, GDELT pipelines
      tariffs/             # WITS API integration
      mcp/                 # Token issuance + validation
```

---

## Agent Tools

All tools are Zod-typed and shared between `/api/chat` and `/api/mcp`:

| Tool | Type | Description |
|------|------|-------------|
| `queryShipments` | Read | List shipments filtered by status |
| `getShipment` | Read | Full shipment detail with waypoints and exceptions |
| `liveVesselPosition` | Read | Latest AIS position for a vessel MMSI |
| `checkPortCongestion` | Read | Vessel density analysis around a port |
| `getWeatherOnRoute` | Read | Open-Meteo forecast for a route coordinate |
| `scanGdeltDisruptions` | Read | GDELT events near shipping corridors |
| `getTariffRate` | Read | WITS duty rate by HS code + trade lane |
| `computeGwp` | Read | GLEC v3 CO2e calculation for a shipment |
| `checkInventory` | Read | Safety stock status for SKUs |
| `proposeReroute` | Read | Generate alternative route plan |
| `rebookCarrier` | **HITL** | Rebook a shipment (requires approval) |
| `notifyClient` | **HITL** | Send client notification (requires approval) |

HITL tools return `{ status: "pending_approval" }` and never mutate the database directly.

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Next.js in dev mode (Turbopack) |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | ESLint |
| `npm run db:generate` | Generate Drizzle migrations |
| `npm run db:push` | Push schema to Turso |
| `npm run ingestor:dev` | Run AIS ingestor locally |

---

## Deployment

1. Connect the repo to [Vercel](https://vercel.com)
2. Set all environment variables in Vercel project settings
3. Deploy -- Vercel handles build, cron (`/api/cron/enrich`), and runtime
4. Deploy the AIS ingestor as an AWS Lambda with EventBridge schedule, or run it as a persistent process

---

## Documentation

| Doc | Description |
|-----|-------------|
| [Architecture & Build Log](docs/PLAN.md) | Full plan with 20 feature specs and build history |
| [Demo Script](docs/DEMO-SCRIPT.md) | 90-second walkthrough for the pitch |
| [Pitch Deck](docs/NexusTower-Pitch.pptx) | 10-slide presentation |

---

## Built For

**Synapse Innovation Hack 2026** -- [synapse-innovation-hack.devpost.com](https://synapse-innovation-hack.devpost.com/)

---

<p align="center"><em>From visibility to execution.</em></p>
