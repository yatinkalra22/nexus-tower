import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { tools } from '@/lib/agent/tools';
import { validateMcpToken } from '@/server/mcp/tokens';
import { NextRequest } from 'next/server';

// Note: MCP over HTTP is technically a set of JSON-RPC over POST/SSE.
// The SDK's McpServer usually expects a transport.
// For a Next.js route, we adapt the tool registry to a JSON-RPC handler.

interface McpTool {
  description: string;
  parameters: any;
  execute: (args: any) => Promise<any>;
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response('Unauthorized', { status: 401 });
  }

  const token = authHeader.split(' ')[1];
  const userId = await validateMcpToken(token);
  if (!userId) {
    return new Response('Invalid Token', { status: 401 });
  }

  try {
    const body = await req.json();
    const { method, params } = body;

    if (method === 'list_tools') {
      const toolList = Object.entries(tools).map(([name, t]) => ({
        name,
        description: (t as unknown as McpTool).description,
        inputSchema: (t as unknown as McpTool).parameters, // zod schema
      }));
      return Response.json({ tools: toolList });
    }

    if (method === 'call_tool') {
      const { name, arguments: args } = params;
      const tool = (tools as any as Record<string, McpTool>)[name];
      if (!tool) return Response.json({ error: 'Tool not found' }, { status: 404 });

      const result = await tool.execute(args);
      return Response.json({ result });
    }

    return Response.json({ error: 'Method not supported' }, { status: 400 });
  } catch (error) {
    console.error('MCP Error:', error);
    return Response.json({ error: 'Internal error' }, { status: 500 });
  }
}
