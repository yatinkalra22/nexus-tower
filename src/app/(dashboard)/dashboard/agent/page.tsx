"use client";

import { useChat } from "ai/react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, Terminal, User, Bot, Loader2 } from "lucide-react";
import { ToolCallCard } from "@/components/agent/tool-call-card";
import { ApprovalCard } from "@/components/agent/approval-card";
import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";

export default function AgentPage() {
  const searchParams = useSearchParams();
  const shipmentId = searchParams.get("shipment");
  
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: "/api/chat",
    initialMessages: shipmentId ? [
      { id: '1', role: 'user', content: `Analyze risks for shipment ${shipmentId} and suggest any necessary reroutes.` }
    ] : [],
  });

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)] gap-4">
      {/* ... header ... */}
      <div className="flex items-center gap-2">
        <Terminal className="size-6 text-primary" />
        <h1 className="text-3xl font-bold">Disruptor Fixer</h1>
      </div>

      <div className="grid flex-1 grid-cols-1 lg:grid-cols-3 gap-6 overflow-hidden">
        {/* Chat Interface */}
        <div className="lg:col-span-2 flex flex-col border rounded-xl bg-card overflow-hidden">
          <ScrollArea ref={scrollRef} className="flex-1 p-4">
            <div className="flex flex-col gap-4">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-center gap-2">
                  <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Bot className="size-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg">NexusTower Agent Ready</h3>
                  <p className="text-muted-foreground text-sm max-w-xs">
                    Ask me about shipments at risk, weather disruptions, or propose reroutes using real-time data.
                  </p>
                </div>
              )}
              {messages.map((m) => (
                <div key={m.id} className="flex flex-col gap-4">
                  <div className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
                    <div className={`size-8 rounded-full flex items-center justify-center shrink-0 ${
                      m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted border"
                    }`}>
                      {m.role === "user" ? <User className="size-4" /> : <Bot className="size-4" />}
                    </div>
                    <div className={`flex flex-col gap-2 max-w-[80%] ${m.role === "user" ? "items-end" : ""}`}>
                      <div className={`p-3 rounded-lg text-sm ${
                        m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted/50"
                      }`}>
                        {m.content}
                      </div>
                    </div>
                  </div>
                  
                  {/* Tool Call Approval Logic */}
                  {m.toolInvocations?.map((ti) => {
                    if ('result' in ti && ti.result?.status === "pending_approval") {
                      return (
                        <div key={ti.toolCallId} className="ml-11 max-w-[500px]">
                          <ApprovalCard 
                            action={ti.result.action} 
                            payload={ti.result} 
                          />
                        </div>
                      );
                    }
                    return null;
                  })}
                </div>
              ))}
              {isLoading && messages[messages.length - 1]?.role === "user" && (
                <div className="flex gap-3">
                  <div className="size-8 rounded-full bg-muted border flex items-center justify-center">
                    <Loader2 className="size-4 animate-spin text-primary" />
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50 text-sm italic text-muted-foreground">
                    Agent is reasoning...
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          <form onSubmit={handleSubmit} className="p-4 border-t flex gap-2 bg-background">
            <Input
              value={input}
              onChange={handleInputChange}
              placeholder="Ask the agent about shipments or disruptions..."
              className="flex-1"
            />
            <Button type="submit" disabled={isLoading || !input.trim()}>
              <Send className="size-4" />
            </Button>
          </form>
        </div>

        {/* Reasoning Panel */}
        <div className="flex flex-col gap-4 border rounded-xl bg-card p-4 overflow-hidden">
          <div className="flex items-center justify-between border-b pb-2">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <Terminal className="size-4" />
              Agent Reasoning
            </h3>
            {isLoading && <Loader2 className="size-3 animate-spin" />}
          </div>
          
          <ScrollArea className="flex-1">
            <div className="flex flex-col gap-3">
              {messages.flatMap(m => m.toolInvocations || []).length === 0 ? (
                <div className="text-[10px] text-muted-foreground uppercase tracking-widest text-center py-20">
                  No tool calls recorded
                </div>
              ) : (
                messages.flatMap(m => m.toolInvocations || []).map((ti) => (
                  <ToolCallCard
                    key={ti.toolCallId}
                    toolName={ti.toolName}
                    args={ti.args}
                    result={'result' in ti ? ti.result : undefined}
                    status={'result' in ti ? 'done' : 'running'}
                  />
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}
