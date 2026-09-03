import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../auth/authStore';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
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
  Clock,
  FileText,
  Sparkles,
  ArrowUpDown,
  Tag,
} from 'lucide-react';
import { toast } from 'sonner';

export const InputSettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { preferences, updatePreferences } = useAuthStore();

  const [isTimeModalOpen, setIsTimeModalOpen] = useState(false);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);

  const timeInputMode = preferences?.time_input_mode || 'manual';
  const showDescription = preferences?.show_description ?? true;
  const autocomplete = preferences?.autocomplete ?? true;
  const inputOrder = preferences?.input_order || 'amount_first';
  const noteButton = preferences?.note_button ?? true;
  const enableSubcategories = preferences?.enable_subcategories ?? true;

  const handleUpdate = async (partial: Record<string, any>, successMsg: string) => {
    try {
      await updatePreferences(partial);
      toast.success(successMsg);
    } catch {
      toast.error('Failed to update preference');
    }
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
              Input Preferences
            </h1>
            <p className="text-[10px] text-muted-foreground">
              Form flow, timestamps, numpad order & autocomplete
            </p>
          </div>
        </div>
      </div>

      {/* Input Flow & Order Group */}
      <div className="flex flex-col gap-1.5">
        <h2 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground px-1">
          Form Sequence & Order
        </h2>

        <div className="flex flex-col rounded-xl border border-border/60 bg-card divide-y divide-border/50 overflow-hidden shadow-2xs">
          {/* Input Order */}
          <div
            onClick={() => setIsOrderModalOpen(true)}
            className="flex items-center justify-between px-3.5 py-3 hover:bg-accent/40 active:bg-accent/60 transition-colors cursor-pointer"
          >
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-foreground">Input Order</span>
              <span className="text-[10px] text-muted-foreground">
                First step when opening Quick Add (+)
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-foreground">
                {inputOrder === 'amount_first' ? 'From Amount (Numpad)' : 'From Category'}
              </span>
              <ChevronRight className="size-4 text-muted-foreground/60" />
            </div>
          </div>

          {/* Time Input Mode */}
          <div
            onClick={() => setIsTimeModalOpen(true)}
            className="flex items-center justify-between px-3.5 py-3 hover:bg-accent/40 active:bg-accent/60 transition-colors cursor-pointer"
          >
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-foreground">Time Input</span>
              <span className="text-[10px] text-muted-foreground">
                How transaction timestamps are captured
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-foreground">
                {timeInputMode === 'auto' ? 'Auto-Stamp Now' : 'Input Only, Desc.'}
              </span>
              <ChevronRight className="size-4 text-muted-foreground/60" />
            </div>
          </div>
        </div>
      </div>

      {/* Fields & Intelligence Group */}
      <div className="flex flex-col gap-1.5">
        <h2 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground px-1">
          Entry Details & Suggestions
        </h2>

        <div className="flex flex-col rounded-xl border border-border/60 bg-card divide-y divide-border/50 overflow-hidden shadow-2xs">
          {/* Show Description Toggle */}
          <div className="flex items-center justify-between px-3.5 py-3">
            <div className="flex flex-col pr-2">
              <span className="text-xs font-semibold text-foreground">Show Description</span>
              <span className="text-[10px] text-muted-foreground">
                Display multiline note field directly in entry drawer
              </span>
            </div>

            <Switch
              checked={showDescription}
              onCheckedChange={(val) =>
                handleUpdate({ show_description: val }, `Description field ${val ? 'enabled' : 'hidden'}`)
              }
              aria-label="Toggle Show Description"
            />
          </div>

          {/* Autocomplete Suggestions */}
          <div className="flex items-center justify-between px-3.5 py-3">
            <div className="flex flex-col pr-2">
              <span className="text-xs font-semibold text-foreground">Autocomplete</span>
              <span className="text-[10px] text-muted-foreground">
                Suggest recent memos & payees as you type
              </span>
            </div>

            <Switch
              checked={autocomplete}
              onCheckedChange={(val) =>
                handleUpdate({ autocomplete: val }, `Autocomplete ${val ? 'enabled' : 'disabled'}`)
              }
              aria-label="Toggle Autocomplete"
            />
          </div>

          {/* Note Button Setting */}
          <div className="flex items-center justify-between px-3.5 py-3">
            <div className="flex flex-col pr-2">
              <span className="text-xs font-semibold text-foreground">Note Button Setting</span>
              <span className="text-[10px] text-muted-foreground">
                Show standalone note shortcut button in bottom bar
              </span>
            </div>

            <Switch
              checked={noteButton}
              onCheckedChange={(val) =>
                handleUpdate({ note_button: val }, `Note button ${val ? 'enabled' : 'disabled'}`)
              }
              aria-label="Toggle Note Button"
            />
          </div>

          {/* Subcategories Global Master Toggle */}
          <div className="flex items-center justify-between px-3.5 py-3">
            <div className="flex flex-col pr-2">
              <span className="text-xs font-semibold text-foreground">Subcategories</span>
              <span className="text-[10px] text-muted-foreground">
                Enable 2-tier Category &gt; Subcategory hierarchy
              </span>
            </div>

            <Switch
              checked={enableSubcategories}
              onCheckedChange={(val) =>
                handleUpdate({ enable_subcategories: val }, `Subcategories ${val ? 'enabled' : 'disabled'}`)
              }
              aria-label="Toggle Subcategories"
            />
          </div>
        </div>
      </div>

      {/* --- MODALS --- */}

      {/* Input Order Modal */}
      <Dialog open={isOrderModalOpen} onOpenChange={setIsOrderModalOpen}>
        <DialogContent className="max-w-xs rounded-2xl p-4 gap-3">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold">Entry Start Step</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-1.5 pt-1">
            {[
              { id: 'amount_first', label: 'From Amount (Calculator numpad opens first)' },
              { id: 'category_first', label: 'From Category (Category selection sheet opens first)' },
            ].map((ord) => (
              <Button
                key={ord.id}
                variant={inputOrder === ord.id ? 'secondary' : 'outline'}
                onClick={async () => {
                  await handleUpdate({ input_order: ord.id }, `Entry order updated`);
                  setIsOrderModalOpen(false);
                }}
                className={`flex items-center justify-between p-3 h-auto rounded-lg text-xs font-semibold text-left w-full whitespace-normal ${
                  inputOrder === ord.id
                    ? 'border-primary/50 text-primary'
                    : 'text-foreground'
                }`}
              >
                <span className="text-left leading-snug">{ord.label}</span>
                {inputOrder === ord.id && <Check className="size-4 shrink-0 ml-2" />}
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Time Input Modal */}
      <Dialog open={isTimeModalOpen} onOpenChange={setIsTimeModalOpen}>
        <DialogContent className="max-w-xs rounded-2xl p-4 gap-3">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold">Time Input Method</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-1.5 pt-1">
            {[
              { id: 'manual', label: 'Input Only, Desc. (Manual time picker on demand)' },
              { id: 'auto', label: 'Auto-Stamp Current Time (Automatically records exact hh:mm:ss)' },
            ].map((tm) => (
              <Button
                key={tm.id}
                variant={timeInputMode === tm.id ? 'secondary' : 'outline'}
                onClick={async () => {
                  await handleUpdate({ time_input_mode: tm.id }, `Time input method updated`);
                  setIsTimeModalOpen(false);
                }}
                className={`flex items-center justify-between p-3 h-auto rounded-lg text-xs font-semibold text-left w-full whitespace-normal ${
                  timeInputMode === tm.id
                    ? 'border-primary/50 text-primary'
                    : 'text-foreground'
                }`}
              >
                <span className="text-left leading-snug">{tm.label}</span>
                {timeInputMode === tm.id && <Check className="size-4 shrink-0 ml-2" />}
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
