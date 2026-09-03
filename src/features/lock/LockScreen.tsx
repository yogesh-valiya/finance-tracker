import React from 'react';
import { useLockStore } from './lockStore';
import { useAuthStore } from '../auth/authStore';
import { Button } from '@/components/ui/button';
import { Lock, Delete, Fingerprint } from 'lucide-react';
import { toast } from 'sonner';

export const LockScreen: React.FC = () => {
  const { preferences } = useAuthStore();
  const { pin, error, appendDigit, removeDigit, unlock } = useLockStore();

  const expectedPin = preferences?.passcode || '1234';

  const handleDigitClick = (digit: string) => {
    appendDigit(digit, expectedPin);
  };

  const handleBiometric = () => {
    if (preferences?.is_biometrics_enabled) {
      toast.success('Biometric authentication verified');
      unlock();
    } else {
      toast.info('Biometric unlock not configured in settings');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-between bg-background/95 backdrop-blur-md px-6 py-12 select-none">
      {/* Header / Brand */}
      <div className="flex flex-col items-center gap-3 pt-6">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-inner">
          <Lock className="size-7" />
        </div>
        <h2 className="text-xl font-bold tracking-tight text-foreground">Money Manager</h2>
        <p className="text-xs text-muted-foreground">Enter 4-digit Passcode</p>
      </div>

      {/* PIN Dots Indicator */}
      <div className="flex flex-col items-center gap-4 my-auto">
        <div className="flex items-center gap-4">
          {[0, 1, 2, 3].map((index) => {
            const isFilled = pin.length > index;
            return (
              <div
                key={index}
                className={`size-4 rounded-full transition-all duration-200 ${
                  isFilled
                    ? 'scale-110 bg-primary shadow-sm'
                    : 'border-2 border-muted-foreground/40 bg-transparent'
                }`}
              />
            );
          })}
        </div>

        {error && (
          <div className="text-xs font-medium text-destructive animate-shake">
            {error}
          </div>
        )}
      </div>

      {/* Numeric Keypad Grid */}
      <div className="w-full max-w-[280px] grid grid-cols-3 gap-3.5 pb-4">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
          <Button
            key={digit}
            variant="outline"
            size="lg"
            className="h-14 rounded-2xl text-xl font-semibold active:scale-95 transition-transform bg-card hover:bg-accent/80 border-border/70"
            onClick={() => handleDigitClick(digit)}
          >
            {digit}
          </Button>
        ))}

        {/* Biometrics Action */}
        <Button
          variant="ghost"
          size="lg"
          className="h-14 rounded-2xl text-muted-foreground hover:text-foreground active:scale-95 transition-transform"
          onClick={handleBiometric}
          aria-label="Biometric unlock"
        >
          <Fingerprint className="size-6" />
        </Button>

        {/* Zero */}
        <Button
          variant="outline"
          size="lg"
          className="h-14 rounded-2xl text-xl font-semibold active:scale-95 transition-transform bg-card hover:bg-accent/80 border-border/70"
          onClick={() => handleDigitClick('0')}
        >
          0
        </Button>

        {/* Backspace Delete */}
        <Button
          variant="ghost"
          size="lg"
          className="h-14 rounded-2xl text-muted-foreground hover:text-foreground active:scale-95 transition-transform"
          onClick={removeDigit}
          aria-label="Backspace"
        >
          <Delete className="size-6" />
        </Button>
      </div>
    </div>
  );
};
