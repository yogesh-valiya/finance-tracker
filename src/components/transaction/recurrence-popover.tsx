"use client";

import * as React from "react";
import { RecurringFrequency, RecurringTiming } from "@prisma/client";
import { RECURRING_FREQUENCY_LABELS } from "@/lib/services/recurring-engine";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Repeat, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface RecurrenceSettings {
  enabled: boolean;
  frequency: RecurringFrequency;
  timing: RecurringTiming;
  advanceDays: number;
}

interface RecurrencePopoverProps {
  value: RecurrenceSettings;
  onChange: (settings: RecurrenceSettings) => void;
}

export function RecurrencePopover({ value, onChange }: RecurrencePopoverProps) {
  const [open, setOpen] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<"repeat" | "installment">("repeat");
  const [frequency, setFrequency] = React.useState<RecurringFrequency>(value.frequency || "MONTHLY");
  const [timing, setTiming] = React.useState<RecurringTiming>(value.timing || "ON_DATE");
  const [advanceDays, setAdvanceDays] = React.useState<number>(value.advanceDays || 1);

  React.useEffect(() => {
    setFrequency(value.frequency || "MONTHLY");
    setTiming(value.timing || "ON_DATE");
    setAdvanceDays(value.advanceDays || 1);
  }, [value, open]);

  const handleApply = () => {
    onChange({
      enabled: true,
      frequency,
      timing,
      advanceDays: timing === "IN_ADVANCE" ? advanceDays : 0,
    });
    setOpen(false);
  };

  const handleClear = () => {
    onChange({
      enabled: false,
      frequency: "MONTHLY",
      timing: "ON_DATE",
      advanceDays: 0,
    });
    setOpen(false);
  };

  const frequencies = Object.keys(RECURRING_FREQUENCY_LABELS) as RecurringFrequency[];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        type="button"
        className={cn(
          "h-8 text-xs gap-1.5 font-medium px-2.5 inline-flex items-center justify-center rounded-md border transition-colors shadow-xs",
          value.enabled
            ? "bg-primary text-primary-foreground hover:bg-primary/90"
            : "border-input bg-background hover:bg-accent hover:text-accent-foreground"
        )}
      >
        <Repeat className="size-3.5" />
        {value.enabled ? (
          <span>{RECURRING_FREQUENCY_LABELS[value.frequency]}</span>
        ) : (
          <span>Rep/Inst.</span>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4" align="start">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <h4 className="text-sm font-semibold">Recurring Settings</h4>
            {value.enabled && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                Active
              </Badge>
            )}
          </div>

          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
            <TabsList className="grid grid-cols-2 w-full h-8">
              <TabsTrigger value="repeat" className="text-xs">
                Repeat
              </TabsTrigger>
              <TabsTrigger value="installment" disabled className="text-xs opacity-50">
                Installment
              </TabsTrigger>
            </TabsList>

            <TabsContent value="repeat" className="mt-3 space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Frequency</Label>
                <Select
                  value={frequency}
                  onValueChange={(val) => setFrequency(val as RecurringFrequency)}
                >
                  <SelectTrigger className="w-full h-9 text-xs">
                    <SelectValue placeholder="Select Frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    {frequencies.map((f) => (
                      <SelectItem key={f} value={f}>
                        {RECURRING_FREQUENCY_LABELS[f]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Execution Timing</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant={timing === "ON_DATE" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTiming("ON_DATE")}
                    className="h-8 text-xs font-medium"
                  >
                    On the date
                  </Button>
                  <Button
                    type="button"
                    variant={timing === "IN_ADVANCE" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTiming("IN_ADVANCE")}
                    className="h-8 text-xs font-medium"
                  >
                    In advance
                  </Button>
                </div>
              </div>

              {timing === "IN_ADVANCE" && (
                <div className="space-y-1.5 animate-in fade-in-50">
                  <Label className="text-xs text-muted-foreground">Advance Days (1–3)</Label>
                  <Input
                    type="number"
                    min={1}
                    max={3}
                    value={advanceDays}
                    onChange={(e) =>
                      setAdvanceDays(Math.max(1, Math.min(3, parseInt(e.target.value || "1", 10))))
                    }
                    className="h-8 text-xs"
                  />
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-border gap-2">
                {value.enabled ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleClear}
                    className="h-7 text-xs text-destructive hover:text-destructive"
                  >
                    <X className="size-3 mr-1" />
                    Remove
                  </Button>
                ) : (
                  <div />
                )}
                <Button
                  type="button"
                  size="sm"
                  onClick={handleApply}
                  className="h-7 text-xs gap-1 ml-auto"
                >
                  <Check className="size-3" />
                  Save
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </PopoverContent>
    </Popover>
  );
}
