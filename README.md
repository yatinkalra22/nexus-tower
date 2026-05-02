# NexusTower

NexusTower is an agentic logistics control tower for the Synapse Innovation Hack 2026. It combines live AIS vessel tracking, weather enrichment, geopolitical events, tariff data, inventory checks, and a Bedrock-powered agent loop with human approval and auditability.

## Overview

- Live dashboard, map, agent UI, audit log, sustainability, tariffs, and inventory pages.
- Turso + Drizzle persistence.
- Clerk authentication.
- Bedrock tool-loop API.
- MCP server and token management UI.
- Vercel cron support and an AIS ingestor Lambda adapter.

## Prerequisites

- Node.js 20+
- npm
- A Turso database
- A Clerk application
- AWS Bedrock access in the selected region
- An aisstream.io API key

## Install

```bash
npm install
```

## Local Development

```bash
npm run dev
```

Open the app at `http://localhost:3000`.

## Available Scripts

- `npm run dev` - start the Next.js app in development mode.
- `npm run build` - build the production app.
- `npm run start` - start the production server.
- `npm run lint` - run ESLint.
- `npm run db:generate` - generate Drizzle migrations.
- `npm run db:push` - push the schema to Turso.
- `npm run ingestor:dev` - run the AIS ingestor locally with `tsx`.

## Environment Variables

Set these in your local shell, your deployment platform, or your secret manager.

| Variable                            | Required | Source                                         | Used for                       |
| ----------------------------------- | -------- | ---------------------------------------------- | ------------------------------ |
| `TURSO_DATABASE_URL`                | Yes      | Turso dashboard or `turso db show nexus-tower` | Database connection string     |
| `TURSO_AUTH_TOKEN`                  | Yes      | `turso db tokens create nexus-tower`           | Database auth token            |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Yes      | Clerk dashboard                                | Client auth integration        |
| `CLERK_SECRET_KEY`                  | Yes      | Clerk dashboard                                | Server auth integration        |
| `AWS_REGION`                        | Yes      | AWS console                                    | Bedrock runtime region         |
| `AWS_ACCESS_KEY_ID`                 | Yes      | AWS IAM user or role credentials               | Bedrock API access             |
| `AWS_SECRET_ACCESS_KEY`             | Yes      | AWS IAM user or role credentials               | Bedrock API access             |
| `BEDROCK_MODEL_ID`                  | Yes      | AWS Bedrock model access settings              | Claude model selection         |
| `AISSTREAM_API_KEY`                 | Yes      | aisstream.io account dashboard                 | Live AIS WebSocket access      |
| `OPENROUTESERVICE_API_KEY`          | No       | OpenRouteService account                       | Optional routing support       |
| `WITS_USER_NAME`                    | No       | World Bank WITS account, if used               | Optional tariff lookups        |
| `CRON_SECRET`                       | Yes      | Any secure random value you choose             | Protects cron enrichment calls |

## Setup Notes

1. Create the Turso database and apply the schema with `npm run db:push`.
2. Create a Clerk app and copy the publishable and secret keys.
3. Enable the Bedrock model in AWS and use IAM credentials with Bedrock access.
4. Generate the aisstream.io key for live vessel tracking.
5. Add optional routing or tariff credentials only if you use those features.

## Deployment

1. Connect the repository to Vercel.
2. Set the environment variables above in the Vercel project settings.
3. Confirm `vercel.json` is deployed so `/api/cron/enrich` runs on schedule.
4. Deploy the web app.
5. Run the AIS ingestor as a separate long-lived process locally, or package `apps/ingestor/lambda.ts` for a scheduled Lambda window.

## Demo Assets

- [docs/DEMO-SCRIPT.md](docs/DEMO-SCRIPT.md)
- [docs/DEVPOST.md](docs/DEVPOST.md)

## Tech Stack

- Next.js 16 App Router
- React 19
- Tailwind CSS v4 + shadcn/ui primitives
- Vercel AI SDK + Amazon Bedrock
- Turso (libSQL) + Drizzle ORM
- Clerk
