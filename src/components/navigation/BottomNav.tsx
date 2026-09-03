import React from 'react';
import { NavLink } from 'react-router-dom';
import { ReceiptText, PieChart, Landmark, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface NavItem {
  label: string;
  path: string;
  icon: React.ElementType;
}

export const NAV_ITEMS: NavItem[] = [
  { label: 'Trans.', path: '/trans', icon: ReceiptText },
  { label: 'Stats', path: '/stats', icon: PieChart },
  { label: 'Accounts', path: '/accounts', icon: Landmark },
  { label: 'More', path: '/more', icon: Menu },
];

export const BottomNav: React.FC = () => {
  return (
    <nav
      aria-label="Main Navigation"
      className="fixed bottom-0 left-0 right-0 z-40 mx-auto max-w-[430px] border-t border-border/70 bg-background/95 backdrop-blur-md pb-[env(safe-area-inset-bottom)] shadow-sm select-none"
    >
      <div className="flex h-14 items-center justify-around px-2">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  'flex flex-1 flex-col items-center justify-center py-1 min-h-[44px] rounded-lg transition-colors',
                  isActive
                    ? 'text-primary font-bold'
                    : 'text-muted-foreground hover:text-foreground font-medium'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <div
                    className={cn(
                      'flex size-7 items-center justify-center rounded-full transition-transform',
                      isActive && 'scale-110'
                    )}
                  >
                    <Icon className="size-5" />
                  </div>
                  <span className="text-[10px] tracking-tight mt-0.5">
                    {item.label}
                  </span>
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};
