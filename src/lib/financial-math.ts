import Decimal from 'decimal.js';

// Configure Decimal.js for high-precision currency operations
Decimal.set({
  precision: 28,
  rounding: Decimal.ROUND_HALF_UP,
  toExpNeg: -12,
  toExpPos: 28,
});

export { Decimal };

export type NumericValue = number | string | Decimal | bigint;

/**
 * Safely converts any numeric input to a Decimal instance.
 */
export function toDecimal(value: NumericValue | null | undefined): Decimal {
  if (value === null || value === undefined || value === '') {
    return new Decimal(0);
  }
  if (value instanceof Decimal) {
    return value;
  }
  if (typeof value === 'bigint') {
    return new Decimal(value.toString());
  }
  try {
    const cleanStr = typeof value === 'string' ? value.replace(/,/g, '').trim() : value;
    return new Decimal(cleanStr);
  } catch {
    return new Decimal(0);
  }
}

/**
 * Converts standard currency amount into integer minor units (e.g. cents/paisa).
 */
export function toMinorUnits(amount: NumericValue, decimals = 2): bigint {
  const dec = toDecimal(amount);
  const factor = new Decimal(10).pow(decimals);
  const rounded = dec.times(factor).round();
  return BigInt(rounded.toFixed(0));
}

/**
 * Converts integer minor units back into Decimal.
 */
export function fromMinorUnits(minor: bigint | number | string, decimals = 2): Decimal {
  const dec = new Decimal(minor.toString());
  const factor = new Decimal(10).pow(decimals);
  return dec.dividedBy(factor);
}

export interface FormatCurrencyOptions {
  currency?: string;
  locale?: string;
  decimals?: number;
  showSymbol?: boolean;
  showSign?: boolean;
}

/**
 * Formats a currency value respecting Indian or International numbering conventions.
 * Example for INR: ₹ 18,38,737.80 or ₹ -5,47,000.00
 */
export function formatCurrency(
  amount: NumericValue,
  options: FormatCurrencyOptions = {}
): string {
  const {
    currency = 'INR',
    locale = 'en-IN',
    decimals = 2,
    showSymbol = true,
    showSign = false,
  } = options;

  const dec = toDecimal(amount);
  const isNegative = dec.isNegative();
  const absDec = dec.abs();
  const numValue = absDec.toNumber();

  const symbolMap: Record<string, string> = {
    INR: '₹',
    USD: '$',
    EUR: '€',
    GBP: '£',
    JPY: '¥',
    AUD: 'A$',
    CAD: 'C$',
    SGD: 'S$',
    AED: 'AED',
  };

  const symbol = symbolMap[currency] || currency;

  const formattedNum = new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(numValue);

  const signStr = isNegative ? '-' : showSign && dec.isPositive() ? '+' : '';

  if (!showSymbol) {
    return `${signStr}${formattedNum}`;
  }

  if (isNegative) {
    return `${symbol} -${formattedNum}`;
  }
  if (showSign && dec.isPositive() && !dec.isZero()) {
    return `+${symbol} ${formattedNum}`;
  }
  return `${symbol} ${formattedNum}`;
}

/**
 * Double-Entry Balance Invariant:
 * Current Balance = Initial Balance + Income - Expense + TransferIn - TransferOut
 */
export function calculateAccountBalance(
  initialBalance: NumericValue,
  totalIncome: NumericValue = 0,
  totalExpense: NumericValue = 0,
  totalTransferIn: NumericValue = 0,
  totalTransferOut: NumericValue = 0
): Decimal {
  const initial = toDecimal(initialBalance);
  const income = toDecimal(totalIncome);
  const expense = toDecimal(totalExpense);
  const transferIn = toDecimal(totalTransferIn);
  const transferOut = toDecimal(totalTransferOut);

  return initial.plus(income).minus(expense).plus(transferIn).minus(transferOut);
}

export interface NetWorthItem {
  balance: NumericValue;
  includeInTotals?: boolean;
}

/**
 * Net Worth Computation:
 * Total Assets = Sum of asset balances (where includeInTotals is true)
 * Total Liabilities = Sum of absolute liability balances (where includeInTotals is true)
 * Net Worth = Total Assets - Total Liabilities
 */
export function calculateNetWorth(
  assets: NetWorthItem[],
  liabilities: NetWorthItem[]
): {
  totalAssets: Decimal;
  totalLiabilities: Decimal;
  netWorth: Decimal;
} {
  let totalAssets = new Decimal(0);
  let totalLiabilities = new Decimal(0);

  for (const asset of assets) {
    if (asset.includeInTotals !== false) {
      const b = toDecimal(asset.balance);
      totalAssets = totalAssets.plus(b);
    }
  }

  for (const liability of liabilities) {
    if (liability.includeInTotals !== false) {
      const b = toDecimal(liability.balance).abs();
      totalLiabilities = totalLiabilities.plus(b);
    }
  }

  const netWorth = totalAssets.minus(totalLiabilities);

  return {
    totalAssets,
    totalLiabilities,
    netWorth,
  };
}

/**
 * Token types for the arithmetic expression parser
 */
type TokenType = 'NUMBER' | 'OP' | 'LPAREN' | 'RPAREN';
interface Token {
  type: TokenType;
  value: string;
}

/**
 * Tokenizes an arithmetic expression string.
 */
function tokenize(expr: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  const clean = expr.trim();

  while (i < clean.length) {
    const char = clean[i];

    if (/\s/.test(char)) {
      i++;
      continue;
    }

    if (/[0-9.]/.test(char)) {
      let numStr = '';
      let dotCount = 0;
      while (i < clean.length && /[0-9.]/.test(clean[i])) {
        if (clean[i] === '.') {
          dotCount++;
          if (dotCount > 1) break;
        }
        numStr += clean[i];
        i++;
      }
      tokens.push({ type: 'NUMBER', value: numStr });
      continue;
    }

    if (char === '(') {
      tokens.push({ type: 'LPAREN', value: '(' });
      i++;
      continue;
    }

    if (char === ')') {
      tokens.push({ type: 'RPAREN', value: ')' });
      i++;
      continue;
    }

    if (['+', '-', '*', 'x', 'X', '/', '÷'].includes(char)) {
      let op = char;
      if (op === 'x' || op === 'X') op = '*';
      if (op === '÷') op = '/';
      tokens.push({ type: 'OP', value: op });
      i++;
      continue;
    }

    // Invalid character encountered
    throw new Error(`Unexpected character '${char}' in arithmetic expression`);
  }

  return tokens;
}

/**
 * Evaluates an arithmetic expression deterministically without eval().
 * Uses the Shunting-Yard algorithm combined with RPN evaluation.
 * Supports +, -, *, /, parentheses, unary minus, and decimals.
 */
export function parseArithmeticExpression(expression: string): {
  result: Decimal | null;
  isValid: boolean;
  error?: string;
} {
  if (!expression || expression.trim() === '') {
    return { result: new Decimal(0), isValid: true };
  }

  try {
    const tokens = tokenize(expression);
    if (tokens.length === 0) {
      return { result: new Decimal(0), isValid: true };
    }

    // Handle trailing operators gracefully while typing (e.g. "200 + ")
    while (tokens.length > 0 && tokens[tokens.length - 1].type === 'OP') {
      tokens.pop();
    }
    if (tokens.length === 0) {
      return { result: new Decimal(0), isValid: true };
    }

    // Insert unary negation / 0 for leading minus or minus after left paren / op
    const processedTokens: Token[] = [];
    for (let i = 0; i < tokens.length; i++) {
      const curr = tokens[i];
      const prev = i > 0 ? tokens[i - 1] : null;

      if (curr.type === 'OP' && (curr.value === '-' || curr.value === '+')) {
        if (!prev || prev.type === 'OP' || prev.type === 'LPAREN') {
          // Unary operator: prepend 0
          processedTokens.push({ type: 'NUMBER', value: '0' });
        }
      }
      processedTokens.push(curr);
    }

    // Shunting-Yard to RPN
    const precedence: Record<string, number> = {
      '+': 1,
      '-': 1,
      '*': 2,
      '/': 2,
    };

    const outputQueue: Token[] = [];
    const operatorStack: Token[] = [];

    for (const token of processedTokens) {
      if (token.type === 'NUMBER') {
        outputQueue.push(token);
      } else if (token.type === 'OP') {
        while (
          operatorStack.length > 0 &&
          operatorStack[operatorStack.length - 1].type === 'OP' &&
          precedence[operatorStack[operatorStack.length - 1].value] >= precedence[token.value]
        ) {
          outputQueue.push(operatorStack.pop()!);
        }
        operatorStack.push(token);
      } else if (token.type === 'LPAREN') {
        operatorStack.push(token);
      } else if (token.type === 'RPAREN') {
        let foundLparen = false;
        while (operatorStack.length > 0) {
          const top = operatorStack.pop()!;
          if (top.type === 'LPAREN') {
            foundLparen = true;
            break;
          }
          outputQueue.push(top);
        }
        if (!foundLparen) {
          return { result: null, isValid: false, error: 'Mismatched parentheses' };
        }
      }
    }

    while (operatorStack.length > 0) {
      const top = operatorStack.pop()!;
      if (top.type === 'LPAREN' || top.type === 'RPAREN') {
        return { result: null, isValid: false, error: 'Mismatched parentheses' };
      }
      outputQueue.push(top);
    }

    // Evaluate RPN
    const evalStack: Decimal[] = [];
    for (const token of outputQueue) {
      if (token.type === 'NUMBER') {
        evalStack.push(new Decimal(token.value));
      } else if (token.type === 'OP') {
        if (evalStack.length < 2) {
          return { result: null, isValid: false, error: 'Invalid expression structure' };
        }
        const b = evalStack.pop()!;
        const a = evalStack.pop()!;

        let res: Decimal;
        switch (token.value) {
          case '+':
            res = a.plus(b);
            break;
          case '-':
            res = a.minus(b);
            break;
          case '*':
            res = a.times(b);
            break;
          case '/':
            if (b.isZero()) {
              return { result: null, isValid: false, error: 'Division by zero' };
            }
            res = a.dividedBy(b);
            break;
          default:
            return { result: null, isValid: false, error: `Unknown operator ${token.value}` };
        }
        evalStack.push(res);
      }
    }

    if (evalStack.length !== 1) {
      return { result: null, isValid: false, error: 'Invalid evaluation stack' };
    }

    return { result: evalStack[0], isValid: true };
  } catch (err: any) {
    return { result: null, isValid: false, error: err?.message || 'Arithmetic syntax error' };
  }
}
