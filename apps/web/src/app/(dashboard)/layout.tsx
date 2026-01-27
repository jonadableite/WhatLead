import Header from "@/components/header";
import { RequireSession } from "@/components/auth/require-session";
import { InstanceGate } from "@/components/instances/instance-gate";
import { Sidebar } from "@/components/sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RequireSession>
      <div className="min-h-screen bg-background dark:bg-background">
        <Sidebar />
        <div className="flex min-h-screen flex-col md:pl-72 transition-all duration-300">
          {/* Desktop Header (Optional, or integrated into pages) */}
          <div className="hidden md:block">
            <Header />
          </div>

          {/* Mobile Header Spacer */}
          <div className="h-16 md:hidden" />

          <main className="flex-1 p-4 md:p-8">
            <InstanceGate>{children}</InstanceGate>
          </main>
        </div>
      </div>
    </RequireSession>
  );
}
