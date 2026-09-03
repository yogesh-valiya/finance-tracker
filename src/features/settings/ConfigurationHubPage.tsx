import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../auth/authStore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  ChevronRight,
  SlidersHorizontal,
  Edit3,
  Layers,
  Coins,
  Repeat,
} from 'lucide-react';

export const ConfigurationHubPage: React.FC = () => {
  const navigate = useNavigate();
  const { preferences } = useAuthStore();

  const currency = preferences?.main_currency || 'INR';
  const colorScheme = preferences?.color_scheme === 'set_b' ? 'Set B' : 'Set A';
  const startDay = preferences?.monthly_start_date || 1;

  const CONFIG_SECTIONS = [
    {
      group: 'Core Preferences',
      items: [
        {
          title: 'General',
          desc: `Currency (${currency}), Start Date (${startDay}th), ${colorScheme}`,
          icon: SlidersHorizontal,
          path: '/more/configuration/general',
          badge: `${currency} • Day ${startDay}`,
        },
        {
          title: 'Input Preferences',
          desc: 'Time stamp, note field, autocomplete & numpad order',
          icon: Edit3,
          path: '/more/configuration/input',
        },
        {
          title: 'Categories & Subcategories',
          desc: 'Income & Expense classification tree',
          icon: Layers,
          path: '/more/categories',
        },
      ],
    },
    {
      group: 'Multi-Currency & Automation',
      items: [
        {
          title: 'Sub Currency',
          desc: preferences?.sub_currency
            ? `Active: ${preferences.sub_currency} (Rate: ${preferences.sub_currency_rate || 1})`
            : 'Track foreign currencies with custom conversion rates',
          icon: Coins,
          path: '/more/configuration/sub-currency',
          badge: preferences?.sub_currency || 'Disabled',
        },
        {
          title: 'Repeat Setting',
          desc: 'Automated recurring ledger schedules (Daily/Weekly/Monthly)',
          icon: Repeat,
          path: '/trans', // Or Phase 6 recurring manager
          badge: 'Automations',
        },
      ],
    },
  ];

  return (
    <div className="flex flex-col gap-4 p-4 pt-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => navigate('/more')}
            className="text-muted-foreground hover:text-foreground -ml-2"
          >
            <ArrowLeft className="size-4" />
          </Button>
          <div>
            <h1 className="text-base font-bold text-foreground leading-tight">
              Configuration
            </h1>
            <p className="text-[10px] text-muted-foreground">
              Personalize bookkeeping, inputs & ledger options
            </p>
          </div>
        </div>
      </div>

      {/* Sections */}
      <div className="flex flex-col gap-4">
        {CONFIG_SECTIONS.map((sec) => (
          <div key={sec.group} className="flex flex-col gap-1.5">
            <h2 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground px-1">
              {sec.group}
            </h2>

            <div className="flex flex-col rounded-xl border border-border/60 bg-card divide-y divide-border/50 overflow-hidden shadow-2xs">
              {sec.items.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.title}
                    onClick={() => navigate(item.path)}
                    className="flex items-center justify-between px-3.5 py-3 hover:bg-accent/40 active:bg-accent/60 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0 pr-2">
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Icon className="size-4" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-semibold text-foreground truncate">
                          {item.title}
                        </span>
                        <span className="text-[10px] text-muted-foreground truncate">
                          {item.desc}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {item.badge && (
                        <Badge variant="secondary" className="text-[9.5px] font-mono px-1.5 py-0">
                          {item.badge}
                        </Badge>
                      )}
                      <ChevronRight className="size-4 text-muted-foreground/60" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
