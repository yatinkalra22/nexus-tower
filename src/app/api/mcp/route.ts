import { tools } from '@/lib/agent/tools';
import { validateMcpToken } from '@/server/mcp/tokens';
import { NextRequest } from 'next/server';
import { z } from 'zod';

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
      const toolList = Object.entries(tools).map(([name, t]) => {
        const toolObj = t as { description?: string; inputSchema: unknown; execute: (args: unknown) => Promise<unknown> };
        let jsonSchema = {};
        try {
          jsonSchema = z.toJSONSchema(toolObj.inputSchema as z.ZodType);
        } catch {
          // fallback: empty schema
        }
        return {
          name,
          description: toolObj.description ?? '',
          inputSchema: jsonSchema,
        };
      });
      return Response.json({ tools: toolList });
    }

    if (method === 'call_tool') {
      const { name, arguments: args } = params;
      const toolEntry = tools[name as keyof typeof tools];
      if (!toolEntry) return Response.json({ error: 'Tool not found' }, { status: 404 });

      const toolObj = toolEntry as unknown as { execute: (args: unknown) => Promise<unknown> };
      const result = await toolObj.execute(args);
      return Response.json({ result });
    }

    return Response.json({ error: 'Method not supported' }, { status: 400 });
  } catch (error) {
    console.error('MCP Error:', error);
    return Response.json({ error: 'Internal error' }, { status: 500 });
  }
}
