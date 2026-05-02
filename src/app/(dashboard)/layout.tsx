import { UserButton } from '@clerk/nextjs';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { Separator } from '@/components/ui/separator';
import { TokenMeter } from '@/components/dashboard/token-meter';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center justify-between gap-2 border-b border-border/50 bg-background/80 backdrop-blur-xl px-4">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1 text-muted-foreground hover:text-foreground transition-colors" />
            <Separator orientation="vertical" className="mr-2 h-4 bg-border/50" />
            <div className="flex items-center gap-1.5">
              <div className="size-1.5 rounded-full bg-emerald-400 animate-pulse-status" />
              <span className="hidden sm:inline text-[11px] font-medium tracking-wide uppercase text-muted-foreground">
                Operational
              </span>
            </div>
          </div>
          <div className="flex items-center gap-5">
            <div className="hidden md:block">
              <TokenMeter />
            </div>
            <UserButton />
          </div>
        </header>
        <main className="flex flex-1 flex-col gap-6 p-3 md:p-6 animate-fade-in">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
