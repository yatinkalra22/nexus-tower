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
    <main className="relative isolate min-h-screen overflow-hidden bg-slate-950 text-slate-100">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.22),_transparent_38%),radial-gradient(circle_at_top_right,_rgba(15,118,110,0.22),_transparent_32%),linear-gradient(180deg,_rgba(2,6,23,1)_0%,_rgba(2,6,23,0.96)_52%,_rgba(15,23,42,1)_100%)]" />
      <div className="absolute inset-0 -z-10 opacity-30 [background-image:linear-gradient(rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.08)_1px,transparent_1px)] [background-size:56px_56px]" />

      <section className="mx-auto flex min-h-screen w-full max-w-7xl flex-col justify-between px-6 py-10 lg:px-10">
        <header className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-2xl border border-sky-500/30 bg-sky-500/10 shadow-lg shadow-sky-500/10">
              <Ship className="size-5 text-sky-300" />
            </div>
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-slate-400">NexusTower</p>
              <p className="text-sm text-slate-300">Agentic Logistics Control Tower</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/sign-in"
              className={buttonVariants({
                variant: 'ghost',
                className: 'border border-white/10 bg-white/5 text-slate-100 hover:bg-white/10',
              })}
            >
              Sign in
            </Link>
            <Link
              href="/sign-up"
              className={buttonVariants({
                variant: 'default',
                className: 'bg-sky-500 text-slate-950 hover:bg-sky-400',
              })}
            >
              Launch control tower
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </header>

        <div className="grid flex-1 items-center gap-14 py-16 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-sm text-emerald-200">
              <span className="size-2 rounded-full bg-emerald-300 shadow-[0_0_18px_rgba(110,231,183,0.9)]" />
              Live data, human approval, real audit trails
            </div>

            <div className="space-y-5">
              <h1 className="max-w-4xl text-5xl font-semibold tracking-tight text-balance sm:text-6xl lg:text-7xl">
                Detect disruption, propose the fix, and keep the operator in control.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-slate-300 sm:text-xl">
                NexusTower unifies live AIS vessel positions, weather, geopolitical events, tariffs,
                and inventory into one execution-led logistics control tower.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/sign-up"
                className={buttonVariants({
                  variant: 'default',
                  size: 'lg',
                  className: 'bg-sky-500 text-slate-950 hover:bg-sky-400',
                })}
              >
                Start the demo
                <ArrowRight className="size-4" />
              </Link>
              <Link
                href="/dashboard"
                className={buttonVariants({
                  variant: 'outline',
                  size: 'lg',
                  className: 'border-white/10 bg-white/5 text-slate-100 hover:bg-white/10',
                })}
              >
                Open dashboard
              </Link>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {metrics.map((metric) => (
                <div
                  key={metric.label}
                  className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm"
                >
                  <p className="text-sm text-slate-400">{metric.label}</p>
                  <p className="mt-2 text-2xl font-semibold text-white">{metric.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 -z-10 rounded-[2rem] bg-sky-500/10 blur-3xl" />
            <div className="rounded-[2rem] border border-white/10 bg-slate-900/70 p-6 shadow-2xl shadow-slate-950/60 backdrop-blur-xl">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <p className="text-sm uppercase tracking-[0.22em] text-slate-400">
                    Demo pipeline
                  </p>
                  <h2 className="mt-1 text-xl font-semibold text-white">From signal to approval</h2>
                </div>
                <div className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-200">
                  Live
                </div>
              </div>

              <div className="mt-6 space-y-4">
                {pillars.map((pillar) => {
                  const Icon = pillar.icon;

                  return (
                    <div
                      key={pillar.title}
                      className="flex gap-4 rounded-2xl border border-white/10 bg-white/5 p-4"
                    >
                      <div className="flex size-11 items-center justify-center rounded-xl border border-white/10 bg-slate-950/60 text-sky-300">
                        <Icon className="size-5" />
                      </div>
                      <div>
                        <h3 className="font-medium text-white">{pillar.title}</h3>
                        <p className="mt-1 text-sm leading-6 text-slate-300">
                          {pillar.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 rounded-2xl border border-dashed border-sky-400/25 bg-sky-400/5 p-4 text-sm leading-6 text-slate-300">
                A judge can bring in a real vessel MMSI, watch it move on the map, trigger a
                GDELT-driven exception, and approve a reroute that writes a permanent audit record.
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
