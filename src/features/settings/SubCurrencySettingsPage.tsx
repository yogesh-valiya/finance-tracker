import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../auth/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Coins, ArrowRightLeft, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency, toDecimal } from '@/lib/financial-math';

const COMMON_FOREIGN = ['USD', 'EUR', 'GBP', 'AED', 'SGD', 'JPY', 'CAD', 'AUD', 'THB'];

export const SubCurrencySettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { preferences, updatePreferences } = useAuthStore();

  const mainCurrency = preferences?.main_currency || 'INR';
  const initialSub = preferences?.sub_currency || '';
  const initialRate = preferences?.sub_currency_rate || 83.5;

  const [isEnabled, setIsEnabled] = useState(!!initialSub);
  const [subCode, setSubCode] = useState(initialSub || 'USD');
  const [rate, setRate] = useState(initialRate.toString());
  const [testAmount, setTestAmount] = useState('100');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const numericRate = parseFloat(rate) || 1;
      await updatePreferences({
        sub_currency: isEnabled ? subCode : '',
        sub_currency_rate: isEnabled ? numericRate : 1,
      });
      toast.success(
        isEnabled
          ? `Sub-currency configured: 1 ${subCode} = ${numericRate} ${mainCurrency}`
          : 'Sub-currency tracking disabled'
      );
      navigate('/more/configuration');
    } catch {
      toast.error('Failed to save sub-currency settings');
    } finally {
      setIsSaving(false);
    }
  };

  const calculatedBase = isEnabled
    ? toDecimal(testAmount || '0').times(toDecimal(rate || '1')).toNumber()
    : 0;

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
              Sub Currency
            </h1>
            <p className="text-[10px] text-muted-foreground">
              Foreign travel, international credit cards & assets
            </p>
          </div>
        </div>
      </div>

      {/* Enable Toggle Card */}
      <Card className="border-border/60 bg-card shadow-2xs">
        <CardContent className="flex items-center justify-between p-3.5">
          <div className="flex flex-col pr-2">
            <span className="text-xs font-semibold text-foreground">
              Enable Secondary Currency
            </span>
            <span className="text-[10px] text-muted-foreground">
              Record transactions in foreign currency with auto-conversion
            </span>
          </div>
          <Switch
            checked={isEnabled}
            onCheckedChange={setIsEnabled}
            aria-label="Toggle Secondary Currency"
          />
        </CardContent>
      </Card>

      {isEnabled && (
        <div className="flex flex-col gap-4">
          {/* Quick Currency Select */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs font-semibold text-foreground">
              Select Foreign Currency
            </Label>
            <div className="grid grid-cols-3 gap-1.5">
              {COMMON_FOREIGN.filter((c) => c !== mainCurrency).map((c) => (
                <Button
                  key={c}
                  type="button"
                  variant={subCode === c ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSubCode(c)}
                  className="h-8 text-xs font-mono font-semibold"
                >
                  {c}
                </Button>
              ))}
            </div>
          </div>

          {/* Exchange Rate Input */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="rateInput" className="text-xs font-semibold text-foreground">
              Exchange Rate (1 {subCode} = ? {mainCurrency})
            </Label>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-muted-foreground shrink-0">
                1 {subCode} =
              </span>
              <Input
                id="rateInput"
                type="number"
                step="any"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                placeholder="e.g. 83.50"
                className="h-9 text-xs font-mono"
              />
              <span className="text-xs font-mono font-bold text-foreground shrink-0">
                {mainCurrency}
              </span>
            </div>
          </div>

          {/* Live Conversion Simulator Card */}
          <Card className="border-border/60 bg-muted/20 shadow-2xs">
            <CardContent className="flex flex-col gap-2.5 p-3.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <ArrowRightLeft className="size-3.5 text-primary" />
                Live Conversion Simulator
              </span>

              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={testAmount}
                  onChange={(e) => setTestAmount(e.target.value)}
                  placeholder="Amount"
                  className="h-8 text-xs font-mono w-28"
                />
                <span className="text-xs font-mono font-semibold text-muted-foreground">
                  {subCode} ≈
                </span>
                <span className="text-xs font-bold font-mono text-primary truncate tabular-nums">
                  {formatCurrency(calculatedBase, { currency: mainCurrency })}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Save Button */}
      <Button
        onClick={handleSave}
        disabled={isSaving}
        className="h-9 text-xs font-semibold mt-2"
      >
        Save Sub-Currency Settings
      </Button>
    </div>
  );
};
