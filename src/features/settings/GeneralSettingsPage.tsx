import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../auth/authStore';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  ArrowLeft,
  ChevronRight,
  Check,
  Calendar,
  DollarSign,
  Palette,
  ArrowRightLeft,
  Sliders,
} from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/financial-math';

const CURRENCIES = [
  { code: 'INR', label: 'INR (₹) — Indian Rupee', symbol: '₹' },
  { code: 'USD', label: 'USD ($) — US Dollar', symbol: '$' },
  { code: 'EUR', label: 'EUR (€) — Euro', symbol: '€' },
  { code: 'GBP', label: 'GBP (£) — British Pound', symbol: '£' },
  { code: 'JPY', label: 'JPY (¥) — Japanese Yen', symbol: '¥' },
  { code: 'AUD', label: 'AUD (A$) — Australian Dollar', symbol: 'A$' },
  { code: 'CAD', label: 'CAD (C$) — Canadian Dollar', symbol: 'C$' },
  { code: 'SGD', label: 'SGD (S$) — Singapore Dollar', symbol: 'S$' },
  { code: 'AED', label: 'AED (د.إ) — UAE Dirham', symbol: 'د.إ' },
];

export const GeneralSettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { preferences, updatePreferences } = useAuthStore();

  const [isCurrencyModalOpen, setIsCurrencyModalOpen] = useState(false);
  const [isStartDateModalOpen, setIsStartDateModalOpen] = useState(false);
  const [isStartDayModalOpen, setIsStartDayModalOpen] = useState(false);
  const [isStartScreenModalOpen, setIsStartScreenModalOpen] = useState(false);
  const [isSwipeModalOpen, setIsSwipeModalOpen] = useState(false);

  const mainCurrency = preferences?.main_currency || 'INR';
  const subCurrency = preferences?.sub_currency || '';
  const startScreen = preferences?.start_screen || 'daily';
  const monthlyStartDate = preferences?.monthly_start_date || 1;
  const weeklyStartDay = preferences?.weekly_start_day || 'monday';
  const carryOver = preferences?.carry_over ?? true;
  const swipeAction = preferences?.swipe_action || 'date';
  const colorScheme = preferences?.color_scheme || 'set_a';

  const handleUpdate = async (partial: Record<string, any>, successMsg: string) => {
    try {
      await updatePreferences(partial);
      toast.success(successMsg);
    } catch {
      toast.error('Failed to update preference');
    }
  };

  const getBillingPeriodPreview = (startDay: number) => {
    const today = new Date();
    const curMonth = today.toLocaleString('default', { month: 'short' });
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1).toLocaleString('default', {
      month: 'short',
    });
    if (startDay === 1) return `1 ${curMonth} ~ Month End`;
    return `${startDay} ${curMonth} ~ ${startDay - 1} ${nextMonth}`;
  };

  return (
    <div className="flex flex-col gap-4 p-4 pt-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => navigate('/more/configuration')}
            className="text-muted-foreground hover:text-foreground -ml-2"
          >
            <ArrowLeft className="size-4" />
          </Button>
          <div>
            <h1 className="text-base font-bold text-foreground leading-tight">
              General Preferences
            </h1>
            <p className="text-[10px] text-muted-foreground">
              Currency formatting, billing cycle & UI themes
            </p>
          </div>
        </div>
      </div>

      {/* Group 1: Currencies & Financial Display */}
      <div className="flex flex-col gap-1.5">
        <h2 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground px-1">
          Currency & Math Format
        </h2>

        <div className="flex flex-col rounded-xl border border-border/60 bg-card divide-y divide-border/50 overflow-hidden shadow-2xs">
          {/* Main Currency */}
          <div
            onClick={() => setIsCurrencyModalOpen(true)}
            className="flex items-center justify-between px-3.5 py-3 hover:bg-accent/40 active:bg-accent/60 transition-colors cursor-pointer"
          >
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-foreground">Main Currency</span>
              <span className="text-[10px] text-muted-foreground">
                Base accounting ledger unit ({mainCurrency})
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold font-mono text-primary">
                {mainCurrency}
              </span>
              <ChevronRight className="size-4 text-muted-foreground/60" />
            </div>
          </div>

          {/* Sub Currency */}
          <div
            onClick={() => navigate('/more/configuration/sub-currency')}
            className="flex items-center justify-between px-3.5 py-3 hover:bg-accent/40 active:bg-accent/60 transition-colors cursor-pointer"
          >
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-foreground">Sub Currency</span>
              <span className="text-[10px] text-muted-foreground">
                Secondary foreign currency with manual rate
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-[10px] font-mono">
                {subCurrency || 'Disabled'}
              </Badge>
              <ChevronRight className="size-4 text-muted-foreground/60" />
            </div>
          </div>
        </div>
      </div>

      {/* Group 2: Periods & Dates */}
      <div className="flex flex-col gap-1.5">
        <h2 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground px-1">
          Accounting Periods & Cycles
        </h2>

        <div className="flex flex-col rounded-xl border border-border/60 bg-card divide-y divide-border/50 overflow-hidden shadow-2xs">
          {/* Monthly Start Date */}
          <div
            onClick={() => setIsStartDateModalOpen(true)}
            className="flex items-center justify-between px-3.5 py-3 hover:bg-accent/40 active:bg-accent/60 transition-colors cursor-pointer"
          >
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-foreground">Monthly Start Date</span>
              <span className="text-[10px] text-muted-foreground">
                {getBillingPeriodPreview(monthlyStartDate)}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold font-mono text-foreground">
                Every {monthlyStartDate}th
              </span>
              <ChevronRight className="size-4 text-muted-foreground/60" />
            </div>
          </div>

          {/* Weekly Start Day */}
          <div
            onClick={() => setIsStartDayModalOpen(true)}
            className="flex items-center justify-between px-3.5 py-3 hover:bg-accent/40 active:bg-accent/60 transition-colors cursor-pointer"
          >
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-foreground">Weekly Start Day</span>
              <span className="text-[10px] text-muted-foreground">
                First day of the week in feeds & calendars
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-foreground capitalize">
                {weeklyStartDay}
              </span>
              <ChevronRight className="size-4 text-muted-foreground/60" />
            </div>
          </div>

          {/* Carry-over Toggle */}
          <div className="flex items-center justify-between px-3.5 py-3">
            <div className="flex flex-col pr-2">
              <span className="text-xs font-semibold text-foreground">Carry-over</span>
              <span className="text-[10px] text-muted-foreground">
                Carry over positive/negative ledger balance to next month
              </span>
            </div>

            <Switch
              checked={carryOver}
              onCheckedChange={(val) =>
                handleUpdate({ carry_over: val }, `Carry-over ${val ? 'enabled' : 'disabled'}`)
              }
              aria-label="Toggle Carry-over"
            />
          </div>
        </div>
      </div>

      {/* Group 3: Navigation & Theming */}
      <div className="flex flex-col gap-1.5">
        <h2 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground px-1">
          Navigation & Color Scheme
        </h2>

        <div className="flex flex-col rounded-xl border border-border/60 bg-card divide-y divide-border/50 overflow-hidden shadow-2xs">
          {/* Start Screen */}
          <div
            onClick={() => setIsStartScreenModalOpen(true)}
            className="flex items-center justify-between px-3.5 py-3 hover:bg-accent/40 active:bg-accent/60 transition-colors cursor-pointer"
          >
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-foreground">Start Screen</span>
              <span className="text-[10px] text-muted-foreground">
                Default view when opening the app
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-foreground capitalize">
                {startScreen}
              </span>
              <ChevronRight className="size-4 text-muted-foreground/60" />
            </div>
          </div>

          {/* Swipe Action */}
          <div
            onClick={() => setIsSwipeModalOpen(true)}
            className="flex items-center justify-between px-3.5 py-3 hover:bg-accent/40 active:bg-accent/60 transition-colors cursor-pointer"
          >
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-foreground">Swipe Action</span>
              <span className="text-[10px] text-muted-foreground">
                Horizontal gestures on transaction feeds
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-foreground">
                {swipeAction === 'date' ? 'To Change Date' : 'To Change Tab'}
              </span>
              <ChevronRight className="size-4 text-muted-foreground/60" />
            </div>
          </div>

          {/* Color Scheme Switcher */}
          <div className="flex items-center justify-between px-3.5 py-3">
            <div className="flex flex-col pr-2">
              <span className="text-xs font-semibold text-foreground">
                Color Scheme: {colorScheme === 'set_a' ? 'Set. A' : 'Set. B'}
              </span>
              <span className="text-[10px] text-muted-foreground">
                {colorScheme === 'set_a'
                  ? 'Income: Blue, Expense: Red'
                  : 'Income: Red, Expense: Blue'}
              </span>
            </div>

            <Switch
              checked={colorScheme === 'set_b'}
              onCheckedChange={(val) => {
                const nextScheme = val ? 'set_b' : 'set_a';
                handleUpdate(
                  { color_scheme: nextScheme },
                  `Color scheme set to ${nextScheme === 'set_a' ? 'Set A' : 'Set B'}`
                );
              }}
              aria-label="Toggle Color Scheme"
            />
          </div>
        </div>
      </div>

      {/* --- MODALS --- */}

      {/* Currency Modal */}
      <Dialog open={isCurrencyModalOpen} onOpenChange={setIsCurrencyModalOpen}>
        <DialogContent className="max-w-xs sm:max-w-sm rounded-2xl p-4 gap-3">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold">Select Main Currency</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col divide-y divide-border/40 max-h-72 overflow-y-auto">
            {CURRENCIES.map((curr) => {
              const isSelected = mainCurrency === curr.code;
              return (
                <Button
                  key={curr.code}
                  variant="ghost"
                  onClick={async () => {
                    await handleUpdate({ main_currency: curr.code }, `Base currency set to ${curr.code}`);
                    setIsCurrencyModalOpen(false);
                  }}
                  className="flex items-center justify-between py-3 px-2 h-auto hover:bg-muted/50 rounded-lg text-left w-full font-normal"
                >
                  <div className="flex flex-col text-left">
                    <span className="text-xs font-semibold text-foreground">{curr.label}</span>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      Preview: {formatCurrency(123456.78, { currency: curr.code })}
                    </span>
                  </div>
                  {isSelected && <Check className="size-4 text-primary shrink-0" />}
                </Button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      {/* Monthly Start Date Modal */}
      <Dialog open={isStartDateModalOpen} onOpenChange={setIsStartDateModalOpen}>
        <DialogContent className="max-w-xs rounded-2xl p-4 gap-3">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold">Monthly Start Date</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-5 gap-1.5 max-h-60 overflow-y-auto p-1">
            {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
              <Button
                key={day}
                variant={monthlyStartDate === day ? 'default' : 'outline'}
                size="sm"
                onClick={async () => {
                  await handleUpdate({ monthly_start_date: day }, `Start date set to day ${day}`);
                  setIsStartDateModalOpen(false);
                }}
                className="h-8 text-xs font-mono font-semibold"
              >
                {day}
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Weekly Start Day Modal */}
      <Dialog open={isStartDayModalOpen} onOpenChange={setIsStartDayModalOpen}>
        <DialogContent className="max-w-xs rounded-2xl p-4 gap-3">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold">Weekly Start Day</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-1.5 pt-1">
            {['sunday', 'monday'].map((day) => (
              <Button
                key={day}
                variant={weeklyStartDay === day ? 'secondary' : 'outline'}
                onClick={async () => {
                  await handleUpdate({ weekly_start_day: day }, `Week starts on ${day}`);
                  setIsStartDayModalOpen(false);
                }}
                className={`flex items-center justify-between p-3 h-auto rounded-lg text-xs font-semibold capitalize w-full ${
                  weeklyStartDay === day
                    ? 'border-primary/50 text-primary'
                    : 'text-foreground'
                }`}
              >
                <span>{day}</span>
                {weeklyStartDay === day && <Check className="size-4 shrink-0" />}
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Start Screen Modal */}
      <Dialog open={isStartScreenModalOpen} onOpenChange={setIsStartScreenModalOpen}>
        <DialogContent className="max-w-xs rounded-2xl p-4 gap-3">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold">Default Start Screen</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-1.5 pt-1">
            {[
              { id: 'daily', label: 'Daily Feed (Transactions list by day)' },
              { id: 'calendar', label: 'Calendar View (Month grid with daily totals)' },
            ].map((scr) => (
              <Button
                key={scr.id}
                variant={startScreen === scr.id ? 'secondary' : 'outline'}
                onClick={async () => {
                  await handleUpdate({ start_screen: scr.id }, `Start screen set to ${scr.id}`);
                  setIsStartScreenModalOpen(false);
                }}
                className={`flex items-center justify-between p-3 h-auto rounded-lg text-xs font-semibold text-left w-full whitespace-normal ${
                  startScreen === scr.id
                    ? 'border-primary/50 text-primary'
                    : 'text-foreground'
                }`}
              >
                <span className="text-left leading-snug">{scr.label}</span>
                {startScreen === scr.id && <Check className="size-4 shrink-0 ml-2" />}
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Swipe Action Modal */}
      <Dialog open={isSwipeModalOpen} onOpenChange={setIsSwipeModalOpen}>
        <DialogContent className="max-w-xs rounded-2xl p-4 gap-3">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold">Swipe Gesture Action</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-1.5 pt-1">
            {[
              { id: 'date', label: 'To Change Date (Swipe left/right shifts day/month)' },
              { id: 'tab', label: 'To Change Tab (Swipe left/right switches bottom tabs)' },
            ].map((sw) => (
              <Button
                key={sw.id}
                variant={swipeAction === sw.id ? 'secondary' : 'outline'}
                onClick={async () => {
                  await handleUpdate({ swipe_action: sw.id }, `Swipe action set to ${sw.id}`);
                  setIsSwipeModalOpen(false);
                }}
                className={`flex items-center justify-between p-3 h-auto rounded-lg text-xs font-semibold text-left w-full whitespace-normal ${
                  swipeAction === sw.id
                    ? 'border-primary/50 text-primary'
                    : 'text-foreground'
                }`}
              >
                <span className="text-left leading-snug">{sw.label}</span>
                {swipeAction === sw.id && <Check className="size-4 shrink-0 ml-2" />}
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
