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
    <div className="flex flex-col h-[calc(100vh-10rem)] gap-4">
      <div className="flex items-center gap-2">
        <Terminal className="size-6 text-primary" />
        <h1 className="text-3xl font-bold">Disruptor Fixer</h1>
      </div>

      <div className="flex-1 border rounded-xl bg-card overflow-hidden flex flex-col">
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          <div className="flex flex-col gap-4">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-center gap-2">
                <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Bot className="size-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg">NexusTower Agent Ready</h3>
                <p className="text-muted-foreground text-sm max-w-xs">
                  Ask me about shipments at risk, weather disruptions, or propose reroutes using
                  real-time data.
                </p>
              </div>
            )}
            {messages.map((msg) => {
              const textParts = msg.parts.filter(p => p.type === 'text');
              const toolParts = msg.parts.filter(p => p.type.startsWith('tool-'));
              const textContent = textParts.map(p => p.type === 'text' ? p.text : '').join('');

              return (
                <div key={msg.id} className="flex flex-col gap-2">
                  {textContent && (
                    <div className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                      <div
                        className={`size-8 rounded-full flex items-center justify-center shrink-0 ${
                          msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted border'
                        }`}
                      >
                        {msg.role === 'user' ? 'U' : 'A'}
                      </div>
                      <div
                        className={`p-3 rounded-lg text-sm max-w-[80%] whitespace-pre-wrap ${
                          msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted/50'
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
                      <div key={`${msg.id}-tool-${i}`} className="ml-11">
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
            {isLoading && (
              <div className="flex items-center gap-2 text-muted-foreground text-sm ml-11">
                <Loader2 className="size-4 animate-spin" />
                Agent is thinking...
              </div>
            )}
          </div>
        </ScrollArea>

        {error && (
          <div className="mx-4 mb-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
            {error.message}
          </div>
        )}

        <div className="border-t p-4">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about shipments, risks, or propose actions..."
              disabled={isLoading}
            />
            <Button type="submit" disabled={isLoading || !input.trim()}>
              <Send className="size-4" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
