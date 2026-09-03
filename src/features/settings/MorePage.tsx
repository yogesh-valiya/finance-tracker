import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../auth/authStore';
import { useLockStore } from '../lock/lockStore';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
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
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';

export const MorePage: React.FC = () => {
  const navigate = useNavigate();
  const { preferences, updatePreferences, logout } = useAuthStore();
  const { isPasscodeSet } = useLockStore();

  const isSetB = preferences?.color_scheme === 'set_b';
  const currency = preferences?.main_currency || 'INR';

  const handleToggleColorScheme = async () => {
    const nextScheme = isSetB ? 'set_a' : 'set_b';
    await updatePreferences({ color_scheme: nextScheme });
    toast.success(
      `Color scheme switched to ${nextScheme === 'set_a' ? 'Set A (Blue/Red)' : 'Set B (Red/Blue)'}`
    );
  };

  const TILES = [
    {
      title: 'Configuration',
      icon: Sliders,
      desc: 'Categories & Preferences',
      path: '/more/configuration',
      badge: `${currency} • ${preferences?.monthly_start_date || 1}st`,
    },
    {
      title: 'Accounts',
      icon: Landmark,
      desc: 'Group classification',
      path: '/accounts',
    },
    {
      title: 'Passcode',
      icon: Lock,
      desc: 'PIN & Biometrics',
      path: '/more/passcode',
      badge: isPasscodeSet ? 'Active' : undefined,
    },
    {
      title: 'CalcBox',
      icon: Calculator,
      desc: 'EMI & Investment math',
      path: '/more/calcbox',
    },
    {
      title: 'PC Manager',
      icon: Laptop,
      desc: 'Desktop web link',
      path: '/more/pc-manager',
    },
    {
      title: 'Backup',
      icon: CloudUpload,
      desc: 'Sync & JSON/CSV',
      path: '/more/backup',
    },
    {
      title: 'Feedback',
      icon: MessageSquare,
      desc: 'Contact support',
      path: '/more/feedback',
    },
    {
      title: 'Help',
      icon: HelpCircle,
      desc: 'User guide & FAQ',
      path: '/more/help',
    },
    {
      title: 'Recommend',
      icon: Share2,
      desc: 'Share application',
      path: '/more/recommend',
    },
  ];

  return (
    <div className="flex flex-col gap-4 p-4 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-base font-bold text-foreground">Settings & More</h1>
        <Badge variant="outline" className="text-[10px] font-semibold">
          Phase 2 Complete
        </Badge>
      </div>

      {/* 3x3 Settings Hub Grid */}
      <div className="grid grid-cols-3 gap-2.5">
        {TILES.map((tile) => {
          const Icon = tile.icon;
          return (
            <Button
              key={tile.title}
              variant="outline"
              onClick={() => navigate(tile.path)}
              className="relative flex flex-col items-center justify-center p-3 h-auto rounded-xl border-border/60 bg-card hover:bg-accent/40 active:scale-95 transition-all text-center gap-1.5 shadow-2xs font-normal"
            >
              <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Icon className="size-4.5" />
              </div>
              <span className="text-xs font-semibold text-foreground line-clamp-1">
                {tile.title}
              </span>
              {tile.badge && (
                <span className="text-[8.5px] font-mono text-muted-foreground font-semibold line-clamp-1 -mt-0.5">
                  {tile.badge}
                </span>
              )}
            </Button>
          );
        })}
      </div>

      {/* Quick Theme Switcher Card */}
      <Card className="border-border/60 shadow-2xs mt-1">
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
              onClick={() => {
                logout();
                toast.info('Signed out successfully');
              }}
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
