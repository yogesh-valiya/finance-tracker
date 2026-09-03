import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../auth/authStore';
import { useLockStore } from '../lock/lockStore';
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
  Lock,
  Fingerprint,
  ShieldCheck,
  KeyRound,
  Delete,
} from 'lucide-react';
import { toast } from 'sonner';

export const PasscodeSettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { preferences, updatePreferences } = useAuthStore();
  const { setPasscode, disablePasscode, setBiometrics } = useLockStore();

  const isPasscodeSet = Boolean(preferences?.is_passcode_enabled && preferences?.passcode);
  const isBiometricsEnabled = Boolean(preferences?.is_biometrics_enabled);

  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [pinStep, setPinStep] = useState<'enter' | 'confirm'>('enter');
  const [enteredPin, setEnteredPin] = useState('');
  const [firstPin, setFirstPin] = useState('');

  const handleTogglePasscode = async (enabled: boolean) => {
    if (enabled) {
      setPinStep('enter');
      setEnteredPin('');
      setFirstPin('');
      setIsPinModalOpen(true);
    } else {
      try {
        await updatePreferences({ is_passcode_enabled: false });
        disablePasscode();
        toast.info('Passcode protection disabled');
      } catch {
        toast.error('Failed to update passcode settings');
      }
    }
  };

  const handleKeypadPress = (digit: string) => {
    if (enteredPin.length >= 4) return;
    const next = enteredPin + digit;
    setEnteredPin(next);

    if (next.length === 4) {
      if (pinStep === 'enter') {
        setTimeout(() => {
          setFirstPin(next);
          setEnteredPin('');
          setPinStep('confirm');
        }, 150);
      } else {
        // Confirm step
        setTimeout(async () => {
          if (next === firstPin) {
            try {
              await updatePreferences({
                is_passcode_enabled: true,
                passcode: next,
              });
              setPasscode(next);
              toast.success('Passcode PIN successfully saved!');
              setIsPinModalOpen(false);
            } catch {
              toast.error('Failed to save passcode');
            }
          } else {
            toast.error('PINs do not match. Please try again.');
            setEnteredPin('');
            setPinStep('enter');
            setFirstPin('');
          }
        }, 150);
      }
    }
  };

  const handleKeypadDelete = () => {
    setEnteredPin((prev) => prev.slice(0, -1));
  };

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
              Passcode & Security
            </h1>
            <p className="text-[10px] text-muted-foreground">
              Protect your personal financial data
            </p>
          </div>
        </div>
      </div>

      {/* Security Options */}
      <div className="flex flex-col gap-1.5">
        <h2 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground px-1">
          Lock & Authentication
        </h2>

        <div className="flex flex-col rounded-xl border border-border/60 bg-card divide-y divide-border/50 overflow-hidden shadow-2xs">
          {/* Enable Passcode */}
          <div className="flex items-center justify-between px-3.5 py-3">
            <div className="flex flex-col pr-2">
              <span className="text-xs font-semibold text-foreground">
                4-Digit Passcode
              </span>
              <span className="text-[10px] text-muted-foreground">
                Require numeric PIN when opening the app
              </span>
            </div>

            <Switch
              checked={isPasscodeSet}
              onCheckedChange={handleTogglePasscode}
              aria-label="Toggle 4-Digit Passcode"
            />
          </div>

          {/* Change Passcode */}
          {isPasscodeSet && (
            <div
              onClick={() => {
                setPinStep('enter');
                setEnteredPin('');
                setFirstPin('');
                setIsPinModalOpen(true);
              }}
              className="flex items-center justify-between px-3.5 py-3 hover:bg-accent/40 active:bg-accent/60 transition-colors cursor-pointer"
            >
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-foreground">
                  Change Passcode PIN
                </span>
                <span className="text-[10px] text-muted-foreground">
                  Update your existing 4-digit code
                </span>
              </div>

              <KeyRound className="size-4 text-primary" />
            </div>
          )}

          {/* Biometrics */}
          <div className="flex items-center justify-between px-3.5 py-3">
            <div className="flex flex-col pr-2">
              <span className="text-xs font-semibold text-foreground">
                Biometric Unlock
              </span>
              <span className="text-[10px] text-muted-foreground">
                Use FaceID or Fingerprint sensor
              </span>
            </div>

            <Switch
              checked={isBiometricsEnabled}
              disabled={!isPasscodeSet}
              onCheckedChange={async (val) => {
                try {
                  await updatePreferences({ is_biometrics_enabled: val });
                  setBiometrics(val);
                  toast.success(`Biometrics ${val ? 'enabled' : 'disabled'}`);
                } catch {
                  toast.error('Failed to update biometrics preference');
                }
              }}
              aria-label="Toggle Biometric Unlock"
            />
          </div>
        </div>
      </div>

      {/* PIN Keypad Modal */}
      <Dialog open={isPinModalOpen} onOpenChange={setIsPinModalOpen}>
        <DialogContent className="max-w-xs rounded-2xl p-6 flex flex-col items-center gap-4">
          <DialogHeader className="text-center">
            <div className="size-10 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-1">
              <Lock className="size-5" />
            </div>
            <DialogTitle className="text-sm font-bold">
              {pinStep === 'enter' ? 'Enter New 4-Digit PIN' : 'Re-enter PIN to Confirm'}
            </DialogTitle>
          </DialogHeader>

          {/* 4-Dot Indicators */}
          <div className="flex items-center justify-center gap-3 my-2">
            {[0, 1, 2, 3].map((index) => (
              <div
                key={index}
                className={`size-3.5 rounded-full transition-all duration-150 ${
                  index < enteredPin.length
                    ? 'bg-primary scale-110'
                    : 'border-2 border-muted-foreground/40'
                }`}
              />
            ))}
          </div>

          {/* Numeric Keypad Grid */}
          <div className="grid grid-cols-3 gap-2.5 w-full max-w-[220px]">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
              <Button
                key={digit}
                type="button"
                variant="outline"
                onClick={() => handleKeypadPress(digit)}
                className="h-11 rounded-xl text-base font-bold font-mono active:scale-95 shadow-2xs"
              >
                {digit}
              </Button>
            ))}
            <div />
            <Button
              type="button"
              variant="outline"
              onClick={() => handleKeypadPress('0')}
              className="h-11 rounded-xl text-base font-bold font-mono active:scale-95 shadow-2xs"
            >
              0
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={handleKeypadDelete}
              className="h-11 rounded-xl text-muted-foreground hover:text-foreground active:scale-95"
            >
              <Delete className="size-4.5" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
