"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2, Key, Terminal } from "lucide-react";
import { toast } from "sonner";
import { createMcpToken, getMcpTokens, revokeMcpToken } from "@/server/mcp/tokens";

interface McpToken {
  token: string;
  userId: string;
  name: string;
  createdAt: Date | null;
}

export default function McpSettingsPage() {
  const [tokens, setTokens] = useState<McpToken[]>([]);
  const [newTokenName, setNewTokenName] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchTokens = useCallback(async () => {
    const data = await getMcpTokens();
    setTokens(data as McpToken[]);
  }, []);

  useEffect(() => {
    fetchTokens();
  }, [fetchTokens]);

  const handleCreate = async () => {
    if (!newTokenName) return;
    setLoading(true);
    try {
      await createMcpToken(newTokenName);
      toast.success("Token created. Copy it now, it won't be shown again.");
      setNewTokenName("");
      fetchTokens();
    } catch (err) {
      toast.error("Failed to create token");
    } finally {
      setLoading(false);
    }
  };

  const handleRevoke = async (token: string) => {
    await revokeMcpToken(token);
    toast.info("Token revoked");
    fetchTokens();
  };

  return (
    <div className="flex flex-col gap-8 max-w-4xl mx-auto animate-fade-in">
      <div>
        <div className="flex items-center gap-2">
          <Key className="size-5 text-sky-400" />
          <h1 className="text-2xl font-semibold tracking-tight">MCP Access Control</h1>
        </div>
        <p className="text-sm text-muted-foreground mt-0.5">
          Expose NexusTower tools to external agents like Claude Desktop or IDE clients.
        </p>
      </div>

      <Card className="rounded-xl border border-border/50 bg-card">
        <CardHeader className="px-4 pt-4 pb-2">
          <p className="text-[11px] font-medium tracking-widest uppercase text-muted-foreground">Create New Token</p>
          <CardDescription className="text-xs">Give your token a descriptive name to track its usage.</CardDescription>
        </CardHeader>
        <CardContent className="flex gap-4 px-4 pb-4">
          <Input
            placeholder="e.g. Claude Desktop"
            value={newTokenName}
            onChange={(e) => setNewTokenName(e.target.value)}
          />
          <Button onClick={handleCreate} disabled={loading || !newTokenName}>
            Generate Token
          </Button>
        </CardContent>
      </Card>

      <div className="rounded-xl border border-border/50 bg-card">
        <div className="overflow-x-auto">
        <Table className="min-w-[600px]">
          <TableHeader>
            <TableRow>
              <TableHead className="text-[11px] font-medium tracking-widest uppercase text-muted-foreground">Name</TableHead>
              <TableHead className="text-[11px] font-medium tracking-widest uppercase text-muted-foreground">Token (Prefix)</TableHead>
              <TableHead className="text-[11px] font-medium tracking-widest uppercase text-muted-foreground">Created</TableHead>
              <TableHead className="text-[11px] font-medium tracking-widest uppercase text-muted-foreground text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tokens.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                  No MCP tokens found.
                </TableCell>
              </TableRow>
            ) : (
              tokens.map((t) => (
                <TableRow key={t.token} className="hover:bg-white/[0.03] transition-colors">
                  <TableCell className="font-medium">{t.name}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{t.token.slice(0, 10)}...</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{t.createdAt?.toLocaleString()}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleRevoke(t.token)}>
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        </div>
      </div>

      <Card className="rounded-xl border border-dashed border-border/50 bg-card">
        <CardHeader className="px-4 pt-4 pb-2">
          <div className="flex items-center gap-2">
            <Terminal className="size-4 text-muted-foreground" />
            <p className="text-[11px] font-medium tracking-widest uppercase text-muted-foreground">Claude Desktop Configuration</p>
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <pre className="p-4 rounded-lg bg-background border border-border/50 text-[10px] font-mono overflow-x-auto">
{`{
  "mcpServers": {
    "nexus-tower": {
      "command": "curl",
      "args": [
        "-X", "POST",
        "-H", "Authorization: Bearer YOUR_TOKEN_HERE",
        "-H", "Content-Type: application/json",
        "-d", "{\\"method\\": \\"call_tool\\", \\"params\\": {}}",
        "https://nexus-tower.vercel.app/api/mcp"
      ]
    }
  }
}`}
          </pre>
          <p className="mt-4 text-xs text-muted-foreground">
            Note: For production, we recommend using the MCP HTTP proxy or a dedicated MCP bridge.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
