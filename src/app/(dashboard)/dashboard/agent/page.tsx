'use client';

import { useChat } from '@ai-sdk/react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, Terminal, Bot, Loader2 } from 'lucide-react';
import { ToolCallCard } from '@/components/agent/tool-call-card';
import { ApprovalCard } from '@/components/agent/approval-card';
import { useEffect, useRef, useState } from 'react';

export default function AgentPage() {
  const { messages, sendMessage, status, error } = useChat();
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const isLoading = status === 'submitted' || status === 'streaming';

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    sendMessage({ text: input });
    setInput('');
  };

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)] gap-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-baseline gap-3">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Agent</h1>
        <span className="text-[11px] uppercase tracking-widest text-muted-foreground">
          AI-powered disruption response
        </span>
      </div>

      {/* Chat container */}
      <div className="flex-1 border border-border/50 rounded-xl bg-card overflow-hidden flex flex-col">
        <ScrollArea className="flex-1 p-5" ref={scrollRef}>
          <div className="flex flex-col gap-5">
            {/* Empty state */}
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center py-24 text-center gap-1.5">
                <p className="text-sm text-muted-foreground/60">
                  Ask about shipments at risk, weather disruptions, or propose reroutes.
                </p>
              </div>
            )}

            {/* Messages */}
            {messages.map((msg) => {
              const textParts = msg.parts.filter(p => p.type === 'text');
              const toolParts = msg.parts.filter(p => p.type.startsWith('tool-'));
              const textContent = textParts.map(p => p.type === 'text' ? p.text : '').join('');

              return (
                <div key={msg.id} className="flex flex-col gap-2.5">
                  {textContent && (
                    <div className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`text-sm max-w-[75%] whitespace-pre-wrap leading-relaxed ${
                          msg.role === 'user'
                            ? 'px-4 py-2.5 rounded-2xl rounded-br-md bg-primary/10 border border-primary/20 text-foreground'
                            : 'text-foreground/90'
                        }`}
                      >
                        {textContent}
                      </div>
                    </div>
                  )}

                  {toolParts.map((part, i) => {
                    const p = part as Record<string, unknown>;
                    const toolName = typeof part.type === 'string' && part.type.startsWith('tool-')
                      ? part.type.replace(/^tool-/, '')
                      : 'unknown';
                    const state = p.state as string | undefined;
                    const output = p.output as Record<string, unknown> | undefined;
                    const inputArgs = (p.input ?? {}) as Record<string, unknown>;
                    const hasOutput = state === 'output-available' && output !== undefined;
                    const isApproval = hasOutput && output?.status === 'pending_approval';

                    let cardStatus: 'pending' | 'running' | 'done' | 'error' = 'pending';
                    if (state === 'output-available') cardStatus = 'done';
                    else if (state === 'output-error') cardStatus = 'error';
                    else if (state === 'input-available' || state === 'input-streaming') cardStatus = 'running';

                    return (
                      <div key={`${msg.id}-tool-${i}`}>
                        <ToolCallCard
                          toolName={toolName}
                          args={inputArgs}
                          result={hasOutput ? output : undefined}
                          status={cardStatus}
                        />
                        {isApproval && output && (
                          <div className="mt-2">
                            <ApprovalCard
                              action={output.action as string}
                              payload={output as Record<string, unknown>}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}

            {/* Thinking indicator */}
            {isLoading && (
              <div className="flex items-center gap-1.5 text-muted-foreground/70 text-xs font-mono">
                <span>thinking</span>
                <span className="inline-flex gap-0.5">
                  <span className="animate-bounce [animation-delay:0ms]">.</span>
                  <span className="animate-bounce [animation-delay:150ms]">.</span>
                  <span className="animate-bounce [animation-delay:300ms]">.</span>
                </span>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Error banner */}
        {error && (
          <div className="mx-4 mb-2 px-3 py-2 rounded-lg bg-red-500/5 border border-red-500/15 text-red-400 text-xs font-mono">
            {error.message}
          </div>
        )}

        {/* Input bar */}
        <div className="p-3">
          <form onSubmit={handleSubmit} className="flex items-center gap-2 rounded-xl bg-card border border-border/50 px-3 py-1.5 transition-colors duration-200 focus-within:border-primary/30">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about shipments, risks, or propose actions..."
              disabled={isLoading}
              className="flex-1 border-0 bg-transparent shadow-none focus-visible:ring-0 text-sm placeholder:text-muted-foreground/40"
            />
            <Button
              type="submit"
              size="icon"
              variant="ghost"
              disabled={isLoading || !input.trim()}
              className="size-8 shrink-0 text-muted-foreground hover:text-primary hover:bg-white/[0.03] transition-colors duration-150"
            >
              <Send className="size-3.5" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
