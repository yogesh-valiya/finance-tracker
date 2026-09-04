import * as React from "react";
import { DesktopSidebar } from "@/components/navigation/desktop-sidebar";
import { MobileNav } from "@/components/navigation/mobile-nav";
import { ConnectivityBanner } from "@/components/connectivity-banner";
import { LockScreen } from "@/components/security/lock-screen";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex bg-background text-foreground">
      {/* Desktop Persistent Left Sidebar */}
      <DesktopSidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 pb-16 md:pb-6">
        <ConnectivityBanner />
        <main className="flex-1 p-4 md:p-6 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Mobile Persistent 4-Tab Bottom Navigation */}
      <MobileNav />

      {/* Global App Lock */}
      <LockScreen />
    </div>
  );
}
