import React from 'react';
import { useAuthStore } from '../auth/authStore';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Menu,
  Sliders,
  Landmark,
  Lock,
  Calculator,
  Laptop,
  CloudUpload,
  MessageSquare,
  HelpCircle,
  Share2,
  LogOut,
  Palette,
} from 'lucide-react';
import { toast } from 'sonner';

export const MorePage: React.FC = () => {
  const { preferences, updatePreferences, logout } = useAuthStore();

  const isSetB = preferences?.color_scheme === 'set_b';

  const handleToggleColorScheme = async () => {
    const nextScheme = isSetB ? 'set_a' : 'set_b';
    await updatePreferences({ color_scheme: nextScheme });
    toast.success(`Color scheme switched to ${nextScheme === 'set_a' ? 'Set A (Blue/Red)' : 'Set B (Red/Blue)'}`);
  };

  const TILES = [
    { title: 'Configuration', icon: Sliders, desc: 'Categories, billing dates, currencies' },
    { title: 'Accounts', icon: Landmark, desc: 'Account groups & ordering' },
    { title: 'Passcode', icon: Lock, desc: 'PIN & biometrics unlock' },
    { title: 'CalcBox', icon: Calculator, desc: 'Financial calculations' },
    { title: 'PC Manager', icon: Laptop, desc: 'Web link sync' },
    { title: 'Backup', icon: CloudUpload, desc: 'JSON backup & Excel export' },
    { title: 'Feedback', icon: MessageSquare, desc: 'Contact support' },
    { title: 'Help', icon: HelpCircle, desc: 'User guide' },
    { title: 'Recommend', icon: Share2, desc: 'Share app' },
  ];

  return (
    <div className="flex flex-col gap-4 p-4 pt-6">
      <div className="flex items-center justify-between">
        <h1 className="text-base font-bold text-foreground">Settings & More</h1>
        <Badge variant="outline" className="text-[10px]">Phase 2 Hub</Badge>
      </div>

      {/* 3x3 Settings Hub Grid */}
      <div className="grid grid-cols-3 gap-2.5">
        {TILES.map((tile) => {
          const Icon = tile.icon;
          return (
            <Button
              key={tile.title}
              variant="outline"
              onClick={() => toast.info(`${tile.title} will be configured in Phase 2`)}
              className="flex flex-col items-center justify-center p-3 h-auto rounded-xl border-border/60 bg-card hover:bg-accent/40 active:scale-95 transition-all text-center gap-1.5 shadow-2xs font-normal"
            >
              <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Icon className="size-4.5" />
              </div>
              <span className="text-xs font-semibold text-foreground line-clamp-1">
                {tile.title}
              </span>
            </Button>
          );
        })}
      </div>

      {/* Preferences Preview Card */}
      <Card className="border-border/60 shadow-2xs mt-2">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <Palette className="size-3.5 text-primary" />
            Quick Theme Switcher
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 text-xs">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-semibold text-foreground block">
                Color Scheme: {isSetB ? 'Set B' : 'Set A'}
              </span>
              <span className="text-[10px] text-muted-foreground">
                {isSetB ? 'Income: Red, Expense: Blue' : 'Income: Blue, Expense: Red'}
              </span>
            </div>
            <Switch
              checked={isSetB}
              onCheckedChange={handleToggleColorScheme}
              aria-label="Toggle Color Scheme"
            />
          </div>

          <div className="pt-2 border-t border-border/40">
            <Button
              variant="destructive"
              className="w-full h-9 gap-2 text-xs font-semibold"
              onClick={() => logout()}
            >
              <LogOut className="size-3.5" />
              Sign Out
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
