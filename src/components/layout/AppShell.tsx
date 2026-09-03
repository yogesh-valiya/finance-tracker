import React from 'react';
import { Outlet } from 'react-router-dom';
import { BottomNav } from '../navigation/BottomNav';

export const AppShell: React.FC = () => {
  return (
    <div className="min-h-screen w-full bg-zinc-100/60 flex justify-center selection:bg-primary/10">
      {/* Mobile viewport constraint (360px - 430px max width on desktop) */}
      <div className="relative w-full max-w-[430px] min-h-screen bg-background shadow-lg flex flex-col overflow-x-hidden border-x border-border/80">
        {/* Main Routed Content Area */}
        <main className="flex-1 flex flex-col pb-16">
          <Outlet />
        </main>

        {/* Persistent Bottom Navigation */}
        <BottomNav />
      </div>
    </div>
  );
};
