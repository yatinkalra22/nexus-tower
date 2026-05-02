import { auth } from '@clerk/nextjs/server';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowRight, ShieldCheck, Radar, Workflow, Ship } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';

const pillars = [
  {
    title: 'Live operations',
    description: 'AIS, weather, GDELT, and tariff data flow into a single control plane.',
    icon: Radar,
  },
  {
    title: 'Human approval',
    description: 'The agent proposes. The operator approves. The audit trail stays immutable.',
    icon: ShieldCheck,
  },
  {
    title: 'External agent access',
    description: 'MCP exposes the same tool registry to Claude Desktop and partner systems.',
    icon: Workflow,
  },
];

const metrics = [
  { label: 'Live AIS feed', value: '1 stream' },
  { label: 'Operational rails', value: '1 audit log' },
  { label: 'Approval latency', value: 'Human-paced' },
];

export default async function RootPage() {
  const { userId } = await auth();

  if (userId) {
    redirect('/dashboard');
  }

  return (
    <main className="relative isolate min-h-screen overflow-hidden bg-background text-foreground">
      {/* Subtle grid pattern */}
      <div className="absolute inset-0 -z-10 [background-image:linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] [background-size:64px_64px]" />
      {/* Faint top glow — geometric, not blobby */}
      <div className="absolute -top-48 left-1/2 -z-10 h-96 w-[80rem] -translate-x-1/2 bg-[radial-gradient(ellipse_at_center,_rgba(56,189,248,0.08),_transparent_70%)]" />

      <section className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-10 lg:px-10">
        {/* ── Header ── */}
        <header className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg border border-border bg-secondary">
              <Ship className="size-4 text-primary" />
            </div>
            <span className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
              NexusTower
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/sign-in"
              className={buttonVariants({
                variant: 'ghost',
                size: 'sm',
                className: 'border border-border text-muted-foreground hover:text-foreground',
              })}
            >
              Sign in
            </Link>
            <Link
              href="/sign-up"
              className={buttonVariants({
                variant: 'default',
                size: 'sm',
                className: 'bg-primary text-primary-foreground hover:bg-primary/90',
              })}
            >
              Launch tower
              <ArrowRight className="ml-1.5 size-3.5" />
            </Link>
          </div>
        </header>

        {/* ── Hero ── */}
        <div className="flex flex-1 flex-col items-center justify-center py-20 text-center">
          <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl">
            Detect disruption.{' '}
            <span className="text-gradient-cyan">Propose the fix.</span>{' '}
            Keep the operator in control.
          </h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
            NexusTower unifies live AIS vessel positions, weather, geopolitical events,
            tariffs, and inventory into one execution-led logistics control tower.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/sign-up"
              className={buttonVariants({
                variant: 'default',
                size: 'lg',
                className: 'bg-primary text-primary-foreground hover:bg-primary/90',
              })}
            >
              Start the demo
              <ArrowRight className="ml-1.5 size-4" />
            </Link>
            <Link
              href="/dashboard"
              className={buttonVariants({
                variant: 'outline',
                size: 'lg',
                className: 'border-border text-muted-foreground hover:text-foreground',
              })}
            >
              Open dashboard
            </Link>
          </div>

          {/* ── Metrics ── */}
          <div className="mt-16 grid w-full max-w-lg gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-3">
            {metrics.map((metric) => (
              <div key={metric.label} className="flex flex-col gap-1 bg-background px-5 py-4">
                <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                  {metric.label}
                </span>
                <span className="font-mono text-lg font-semibold text-foreground">
                  {metric.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Feature pillars ── */}
        <div className="mx-auto grid w-full max-w-4xl gap-6 pb-20 sm:grid-cols-3">
          {pillars.map((pillar) => {
            const Icon = pillar.icon;
            return (
              <div
                key={pillar.title}
                className="group flex flex-col gap-3 rounded-xl border border-border/50 bg-card/50 p-5 transition-colors hover:border-border"
              >
                <div className="flex size-9 items-center justify-center rounded-lg border border-border bg-secondary text-primary">
                  <Icon className="size-4" />
                </div>
                <h3 className="text-sm font-medium text-foreground">{pillar.title}</h3>
                <p className="text-[13px] leading-relaxed text-muted-foreground">
                  {pillar.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}
