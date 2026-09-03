import React, { useState } from 'react';
import { useTransactionStore } from '../transactionStore';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Repeat, Check, X } from 'lucide-react';
import { toast } from 'sonner';

const REPEAT_FREQUENCIES = [
  { id: 'none', label: 'Nothing' },
  { id: 'daily', label: 'Every Day' },
  { id: 'weekdays', label: 'Weekdays' },
  { id: 'weekend', label: 'Weekend' },
  { id: 'weekly', label: 'Every Week' },
  { id: 'biweekly', label: 'Every 2 weeks' },
  { id: 'four_weeks', label: 'Every 4 weeks' },
  { id: 'monthly', label: 'Every Month' },
  { id: 'end_of_month', label: 'The end of the month' },
  { id: 'every_2_month', label: 'Every 2 Month' },
  { id: 'every_3_month', label: 'Every 3 Month' },
  { id: 'every_4_month', label: 'Every 4 Month' },
  { id: 'every_6_month', label: 'Every 6 Month' },
  { id: 'annually', label: 'Annually' },
];

interface RepeatModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultData?: {
    type: 'expense' | 'income' | 'transfer';
    amount: number;
    category?: string;
    subcategory?: string;
    from_account?: string;
    to_account?: string;
    note?: string;
  };
}

export const RepeatModal: React.FC<RepeatModalProps> = ({
  open,
  onOpenChange,
  defaultData,
}) => {
  const { createRecurringRule } = useTransactionStore();

  const [frequency, setFrequency] = useState('monthly');
  const [advanceDays, setAdvanceDays] = useState('0');

  const handleSave = async () => {
    if (frequency === 'none') {
      toast.info('Repeat disabled for this entry');
      onOpenChange(false);
      return;
    }

    if (!defaultData || defaultData.amount <= 0) {
      toast.error('Please specify a valid transaction amount first');
      return;
    }

    try {
      await createRecurringRule({
        name: defaultData.note || 'Recurring Transaction',
        type: defaultData.type,
        amount: defaultData.amount,
        category: defaultData.category,
        subcategory: defaultData.subcategory,
        from_account: defaultData.from_account,
        to_account: defaultData.to_account,
        note: defaultData.note,
        frequency,
        advance_days: Number(advanceDays) || 0,
        start_date: new Date().toISOString(),
        next_run_date: new Date().toISOString(),
        end_type: 'never',
        is_active: true,
      });

      toast.success('Recurring schedule configured');
      onOpenChange(false);
    } catch {
      toast.error('Failed to create recurring rule');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xs sm:max-w-sm rounded-3xl p-0 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Top Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/60 bg-card">
          <div className="flex items-center gap-2">
            <Repeat className="size-4 text-primary" />
            <span className="text-sm font-bold text-foreground">Repeat Setting</span>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            onClick={() => onOpenChange(false)}
            className="text-muted-foreground hover:text-foreground h-7 w-7 rounded-full"
          >
            <X className="size-4" />
          </Button>
        </div>

        {/* Frequency List (14 Standard Recurrence Options) */}
        <div className="flex flex-col divide-y divide-border/30 overflow-y-auto flex-1 px-1">
          {REPEAT_FREQUENCIES.map((item) => {
            const isSelected = frequency === item.id;

            return (
              <div
                key={item.id}
                onClick={() => setFrequency(item.id)}
                className={`flex items-center justify-between px-4 py-2.5 cursor-pointer transition-colors ${
                  isSelected ? 'bg-primary/10 font-bold text-primary' : 'hover:bg-muted/40 text-foreground'
                }`}
              >
                <span className="text-xs">{item.label}</span>
                {isSelected && <Check className="size-4 text-primary shrink-0" />}
              </div>
            );
          })}
        </div>

        {/* Advance Reflection Timing Row */}
        {frequency !== 'none' && (
          <div className="flex items-center justify-between px-4 py-2.5 border-t border-border/60 bg-muted/20 text-xs">
            <span className="font-semibold text-muted-foreground">Reflection Timing:</span>
            <Select value={advanceDays} onValueChange={setAdvanceDays}>
              <SelectTrigger className="h-7 text-xs w-36">
                <SelectValue placeholder="Timing" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0" className="text-xs">On the date</SelectItem>
                <SelectItem value="1" className="text-xs">1 day in advance</SelectItem>
                <SelectItem value="2" className="text-xs">2 days in advance</SelectItem>
                <SelectItem value="3" className="text-xs">3 days in advance</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center gap-2 p-3 border-t border-border/60 bg-card">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="h-9 text-xs font-semibold flex-1"
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleSave}
            className="h-9 text-xs font-bold flex-1 bg-primary text-primary-foreground"
          >
            Save Setting
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
