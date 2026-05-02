# NexusTower

**Agentic logistics control tower for the Synapse Innovation Hack 2026.**

NexusTower combines live AIS vessel tracking, weather enrichment, geopolitical events, tariff data, inventory checks, and a Bedrock-powered agent loop with human approval and auditability.

## What It Does

1. Detects live supply-chain disruption from AIS, weather, and geopolitics.
2. Lets the agent propose a fix instead of auto-executing it.
3. Keeps the operator in control through approval steps and audit logs.
4. Exposes the same tool registry through the web app and MCP.

## Features

- Live dashboard, map, agent UI, audit log, sustainability, tariffs, and inventory pages.
- Turso + Drizzle persistence.
- Clerk authentication.
- Bedrock tool-loop API.
- MCP server and token management UI.
- Vercel cron support and an AIS ingestor Lambda adapter.

## Tech Stack

| Layer        | Technology                                                             |
| ------------ | ---------------------------------------------------------------------- |
| Frontend     | Next.js 16 App Router, React 19, Tailwind CSS v4, shadcn/ui primitives |
| AI           | Vercel AI SDK, Amazon Bedrock                                          |
| Database     | Turso (libSQL), Drizzle ORM                                            |
| Auth         | Clerk                                                                  |
| Realtime     | Server-Sent Events, aisstream.io                                       |
| Maps         | MapLibre GL JS                                                         |
| Integrations | Open-Meteo, OSRM, GDELT, WITS                                          |

## Repo Structure

```text
nexus-tower/
	apps/
		ingestor/        # AIS WebSocket worker and Lambda adapter
	docs/              # Plan, demo script, Devpost draft
	public/            # Static assets
	src/
		app/             # Next.js routes, layouts, and API routes
		components/      # UI and dashboard components
		db/              # Drizzle schema and client
		lib/             # Auth, env, agent, analytics helpers
		server/          # Enrichment, tariffs, inventory, MCP logic
```

## Prerequisites

- Node.js 20+
- npm
- A Turso database
- A Clerk application
- AWS Bedrock access in the selected region
- An aisstream.io API key

## Quick Start

```bash
# Install all workspace dependencies
npm install

# Create your local env file from the template
cp .env.local.example .env.local

# Push the schema to Turso before the first run
npm run db:push

# Start the web app
npm run dev
```

Open the app at `http://localhost:3000`.

If you want live AIS updates while developing, run the ingestor in a second terminal:

```bash
# AIS ingestor
npm run ingestor:dev
```

## Configuration

Use the values in [`.env.local.example`](.env.local.example) as the template for local development and deployment.

| Variable                            | Source                                         |
| ----------------------------------- | ---------------------------------------------- |
| `TURSO_DATABASE_URL`                | Turso dashboard or `turso db show nexus-tower` |
| `TURSO_AUTH_TOKEN`                  | `turso db tokens create nexus-tower`           |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk dashboard                                |
| `CLERK_SECRET_KEY`                  | Clerk dashboard                                |
| `AWS_REGION`                        | AWS console                                    |
| `AWS_ACCESS_KEY_ID`                 | AWS IAM credentials with Bedrock access        |
| `AWS_SECRET_ACCESS_KEY`             | AWS IAM credentials with Bedrock access        |
| `BEDROCK_MODEL_ID`                  | Bedrock model access settings                  |
| `AISSTREAM_API_KEY`                 | aisstream.io account dashboard                 |
| `OPENROUTESERVICE_API_KEY`          | OpenRouteService account                       |
| `WITS_USER_NAME`                    | World Bank WITS account, if used               |

## Available Scripts

- `npm run dev` - start the Next.js app in development mode.
- `npm run build` - build the production app.
- `npm run start` - start the production server.
- `npm run lint` - run ESLint.
- `npm run db:generate` - generate Drizzle migrations.
- `npm run db:push` - push the schema to Turso.
- `npm run ingestor:dev` - run the AIS ingestor locally with `tsx`.

## Local Setup

1. Create the Turso database and apply the schema with `npm run db:push`.
2. Create a Clerk app and copy the publishable and secret keys.
3. Enable the Bedrock model in AWS and use IAM credentials with Bedrock access.
4. Generate the aisstream.io key for live vessel tracking.
5. Add optional routing or tariff credentials only if you use those features.

## Deployment

1. Connect the repository to Vercel.
2. Set the environment variables above in the Vercel project settings.
3. Deploy the web app.
4. Run the AIS ingestor as a separate long-lived process locally, or package `apps/ingestor/lambda.ts` for a scheduled Lambda window.

## Documentation

- [Architecture & Build Log](docs/PLAN.md)
- [API Reference](docs/API.md)
- [MCP Integration Guide](docs/MCP.md)
- [Key Setup Guide](docs/KEYS-SETUP.md)
- [Demo Script](docs/DEMO-SCRIPT.md)

## License

MIT
