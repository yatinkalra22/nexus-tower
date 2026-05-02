# NexusTower API Reference

## Authentication

All API routes (except `/api/_health/*`) require a valid Clerk session. Requests without a session receive a 401 response.

## Endpoints

### Chat & Agent

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/chat` | Send a message to the Bedrock-powered agent. Streams back tool calls and text via AI SDK v6 UIMessage stream. |
| GET/DELETE | `/api/chat-history` | GET retrieves persisted chat history. DELETE clears it. |
| POST | `/api/agent/execute` | Execute a human-approved action (reroute, rebook, notify). Body must include the pending action payload from a tool call. |

### MCP

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/mcp` | Model Context Protocol server endpoint. Accepts MCP JSON-RPC requests. Exposes the same tool registry as `/api/chat`. |

### Real-Time (SSE)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/sse/vessel-positions` | Server-Sent Events stream of live AIS vessel positions. |
| GET | `/api/sse/exceptions` | Server-Sent Events stream of new exceptions/disruptions. |

### Data Ingestion

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/ingest/csv` | Upload a CSV file to bulk-import shipments. |
| POST | `/api/ingest/inventory-csv` | Upload a CSV file to bulk-import inventory items. |

### Digital Product Passport

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/dpp/[shipmentId]` | Returns a GLEC-compliant Digital Product Passport (emissions, route, provenance) for a shipment. |

### Usage & Health

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/usage` | Returns agent token usage stats. |
| GET | `/api/_health/db` | Database connectivity check. |
| POST | `/api/_health/seed` | Seeds demo data for development. |

## Agent Tools

These tools are available to the AI agent via `/api/chat` and to external clients via `/api/mcp`:

### Read-Only Tools

| Tool | Description |
|------|-------------|
| `queryShipments` | List active shipments, optionally filtered by status. |
| `getShipment` | Get full shipment details including waypoints and exceptions. |
| `liveVesselPosition` | Get latest AIS position for a vessel by MMSI. |
| `getWeatherOnRoute` | Get weather conditions at a lat/lon point. |
| `scanGdeltDisruptions` | Scan for geopolitical events near coordinates. |
| `computeGwp` | Calculate CO2e emissions using GLEC Framework v3. |
| `getTariffRate` | Look up tariff/duty rate for an HS code between countries. |
| `checkInventory` | Check inventory status for a SKU. |

### Mutation Tools (Require HITL Approval)

| Tool | Description |
|------|-------------|
| `proposeReroute` | Propose rerouting a shipment to a different port. |
| `rebookCarrier` | Propose rebooking with a different carrier. |
| `notifyClient` | Propose sending a notification to the client. |

Mutation tools return `status: "pending_approval"`. The operator must approve via the UI, which calls `/api/agent/execute` to commit the change and write an audit log entry.
