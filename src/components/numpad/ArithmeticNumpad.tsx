import React from 'react';
import { Button } from '@/components/ui/button';
import { parseArithmeticExpression, formatCurrency } from '@/lib/financial-math';
import { Delete, Check, Calculator, RefreshCw } from 'lucide-react';

interface ArithmeticNumpadProps {
  value: string;
  onChange: (nextValue: string) => void;
  onDone: (evaluatedAmount: number) => void;
  currency?: string;
  type?: 'expense' | 'income' | 'transfer';
}

export const ArithmeticNumpad: React.FC<ArithmeticNumpadProps> = ({
  value,
  onChange,
  onDone,
  currency = 'INR',
  type = 'expense',
}) => {
  const { result, isValid, error } = parseArithmeticExpression(value);
  const evaluatedNum = result ? result.toNumber() : 0;

  const handleKeyPress = (key: string) => {
    if (key === 'CLEAR') {
      onChange('');
      return;
    }

    if (key === 'BACKSPACE') {
      onChange(value.slice(0, -1));
      return;
    }

    // Don't allow multiple consecutive operators
    const lastChar = value.slice(-1);
    const isOp = ['+', '-', '*', 'x', 'X', '/', '÷'].includes(key);
    const lastIsOp = ['+', '-', '*', 'x', 'X', '/', '÷'].includes(lastChar);

    if (isOp && lastIsOp) {
      onChange(value.slice(0, -1) + key);
      return;
    }

    // Default append
    onChange((value === '0' && !isOp && key !== '.') ? key : value + key);
  };

  const handleDone = () => {
    onDone(Math.abs(evaluatedNum));
  };

  const getThemeButtonColor = () => {
    if (type === 'income') return 'bg-income hover:bg-income/90 text-income-foreground';
    if (type === 'expense') return 'bg-expense hover:bg-expense/90 text-expense-foreground';
    return 'bg-primary hover:bg-primary/90 text-primary-foreground';
  };

  const keys = [
    ['7', '8', '9', '÷'],
    ['4', '5', '6', '×'],
    ['1', '2', '3', '-'],
    ['0', '.', '⌫', '+'],
  ];

  return (
    <div className="flex flex-col gap-2 p-2 rounded-2xl bg-card border border-border/60 shadow-md select-none">
      {/* Live Equation / Result Strip */}
      <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-muted/40 border border-border/40 text-xs">
        <div className="flex flex-col min-w-0">
          <span className="text-[10px] text-muted-foreground font-mono truncate">
            {value || '0'}
          </span>
          <span className="text-sm font-bold font-mono text-foreground tabular-nums">
            = {formatCurrency(evaluatedNum, { currency })}
          </span>
        </div>
        {error && (
          <span className="text-[9.5px] text-expense font-semibold truncate pl-2">
            {error}
          </span>
        )}
      </div>

      {/* 4x4 Keypad Grid */}
      <div className="grid grid-cols-4 gap-1.5">
        {keys.map((row, rIdx) =>
          row.map((k, cIdx) => {
            const isOperator = ['+', '-', '×', '÷'].includes(k);
            const isBackspace = k === '⌫';

            return (
              <Button
                key={`${rIdx}-${cIdx}`}
                type="button"
                variant={isOperator ? 'secondary' : 'outline'}
                onClick={() => handleKeyPress(isBackspace ? 'BACKSPACE' : k)}
                className={`h-11 text-base font-bold font-mono rounded-xl active:scale-95 transition-transform ${
                  isOperator ? 'text-primary bg-muted/70 font-extrabold text-lg' : 'text-foreground'
                }`}
              >
                {isBackspace ? <Delete className="size-4" /> : k}
              </Button>
            );
          })
        )}
      </div>

      {/* Done Action Button */}
      <Button
        type="button"
        onClick={handleDone}
        className={`h-10 text-xs font-bold gap-1.5 rounded-xl transition-all active:scale-[0.98] ${getThemeButtonColor()}`}
      >
        <Check className="size-4" />
        Done ({formatCurrency(evaluatedNum, { currency })})
      </Button>
    </div>
  );
};
