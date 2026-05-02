"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
    <div className="flex flex-col gap-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Key className="size-8 text-primary" />
          MCP Access Control
        </h1>
        <p className="text-muted-foreground">
          Expose NexusTower tools to external agents like Claude Desktop or IDE clients.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create New Token</CardTitle>
          <CardDescription>Give your token a descriptive name to track its usage.</CardDescription>
        </CardHeader>
        <CardContent className="flex gap-4">
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

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Token (Prefix)</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
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
                <TableRow key={t.token}>
                  <TableCell className="font-medium">{t.name}</TableCell>
                  <TableCell className="font-mono text-xs">{t.token.slice(0, 10)}...</TableCell>
                  <TableCell className="text-xs">{t.createdAt?.toLocaleString()}</TableCell>
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

      <Card className="bg-muted/30 border-dashed">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Terminal className="size-4" />
            Claude Desktop Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="p-4 rounded-lg bg-background border text-[10px] overflow-x-auto">
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
          <p className="mt-4 text-xs text-muted-foreground italic">
            Note: For production, we recommend using the MCP HTTP proxy or a dedicated MCP bridge.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
