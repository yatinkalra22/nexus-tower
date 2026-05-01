import { UserButton } from "@clerk/nextjs";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { TokenMeter } from "@/components/dashboard/token-meter";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between gap-2 border-b bg-background px-4">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="h-6 gap-1 bg-green-500/10 text-green-500 hover:bg-green-500/10">
                <div className="size-2 rounded-full bg-green-500" />
                System Health: Optimal
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <TokenMeter />
            <UserButton afterSignOutUrl="/sign-in" />
          </div>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
