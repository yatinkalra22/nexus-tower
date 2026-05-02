# MCP Integration Guide

NexusTower exposes its logistics tools via [Model Context Protocol](https://modelcontextprotocol.io/) at `/api/mcp`. Any MCP-compatible client (Claude Desktop, IDE extensions, partner systems) can connect and use the same audited tools as the web UI.

## Connecting Claude Desktop

1. Sign in to NexusTower and navigate to **Settings > MCP**.
2. Generate an API token.
3. Add the following to your Claude Desktop MCP config (`~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "nexus-tower": {
      "url": "https://your-deployment.vercel.app/api/mcp",
      "headers": {
        "Authorization": "Bearer YOUR_TOKEN_HERE"
      }
    }
  }
}
```

4. Restart Claude Desktop. The NexusTower tools will appear in the tools panel.

## Available Tools

Once connected, the MCP client can call:

- `queryShipments` — list shipments by status
- `getShipment` — get shipment details with waypoints and exceptions
- `liveVesselPosition` — get real-time AIS position by MMSI
- `getWeatherOnRoute` — weather at a coordinate
- `scanGdeltDisruptions` — geopolitical events near a location
- `computeGwp` — GLEC emissions calculation
- `getTariffRate` — tariff lookup by HS code and lane
- `checkInventory` — inventory status for a SKU
- `proposeReroute` — propose a shipment reroute (requires approval)
- `rebookCarrier` — propose a carrier change (requires approval)
- `notifyClient` — propose a client notification (requires approval)

## HITL Approval

Mutation tools (`proposeReroute`, `rebookCarrier`, `notifyClient`) return a pending approval payload. The action is **not executed** until a human operator approves it in the NexusTower web UI. This ensures external agents cannot make unilateral changes to logistics operations.

## Token Management

- Tokens are scoped per user and can be revoked from the MCP settings page.
- Each MCP request is authenticated and logged in the audit trail.
- Rate limits follow your deployment's Vercel Function limits.

## Local Development

When running locally, point your MCP client to:

```
http://localhost:3000/api/mcp
```

Use the same bearer token generated from the settings page.
