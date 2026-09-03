import { describe, it, expect } from 'vitest';
import {
  toDecimal,
  toMinorUnits,
  fromMinorUnits,
  formatCurrency,
  calculateAccountBalance,
  calculateNetWorth,
  parseArithmeticExpression,
  Decimal,
} from '../financial-math';

describe('Financial Math Core', () => {
  describe('toDecimal', () => {
    it('converts number, string, bigint, and Decimal correctly', () => {
      expect(toDecimal(100.5).toString()).toBe('100.5');
      expect(toDecimal('100.50').toString()).toBe('100.5');
      expect(toDecimal('1,000,500.75').toString()).toBe('1000500.75');
      expect(toDecimal(BigInt(5000)).toString()).toBe('5000');
      expect(toDecimal(new Decimal('250.25')).toString()).toBe('250.25');
    });

    it('handles null, undefined, empty string, and invalid inputs gracefully', () => {
      expect(toDecimal(null).toString()).toBe('0');
      expect(toDecimal(undefined).toString()).toBe('0');
      expect(toDecimal('').toString()).toBe('0');
      expect(toDecimal('abc').toString()).toBe('0');
    });
  });

  describe('Minor Units (Integer Paisa / Cents) Conversion', () => {
    it('converts amounts to minor units with exact rounding', () => {
      expect(toMinorUnits(10.5)).toBe(BigInt(1050));
      expect(toMinorUnits('1838737.80')).toBe(BigInt(183873780));
      expect(toMinorUnits(0.005)).toBe(BigInt(1)); // half-up
      expect(toMinorUnits('0.004')).toBe(BigInt(0));
    });

    it('converts minor units back to Decimal amounts', () => {
      expect(fromMinorUnits(BigInt(1050)).toString()).toBe('10.5');
      expect(fromMinorUnits(BigInt(183873780)).toString()).toBe('1838737.8');
    });
  });

  describe('formatCurrency', () => {
    it('formats Indian numbering system accurately (₹ 18,38,737.80)', () => {
      const formatted = formatCurrency(1838737.8, { currency: 'INR', locale: 'en-IN' });
      expect(formatted).toBe('₹ 18,38,737.80');
    });

    it('formats negative balances accurately (₹ -5,47,000.00)', () => {
      const formatted = formatCurrency(-547000, { currency: 'INR', locale: 'en-IN' });
      expect(formatted).toBe('₹ -5,47,000.00');
    });

    it('formats international currencies (USD, EUR, GBP, JPY)', () => {
      expect(formatCurrency(1234567.89, { currency: 'USD', locale: 'en-US' })).toBe('$ 1,234,567.89');
      expect(formatCurrency(1234567.89, { currency: 'EUR', locale: 'de-DE' })).toBe('€ 1.234.567,89');
      expect(formatCurrency(1234567, { currency: 'JPY', locale: 'ja-JP', decimals: 0 })).toBe('¥ 1,234,567');
    });

    it('supports showSign option for positive values', () => {
      expect(formatCurrency(500, { currency: 'INR', showSign: true })).toBe('+₹ 500.00');
      expect(formatCurrency(-500, { currency: 'INR', showSign: true })).toBe('₹ -500.00');
      expect(formatCurrency(0, { currency: 'INR', showSign: true })).toBe('₹ 0.00');
    });
  });

  describe('calculateAccountBalance (Double-Entry Invariant)', () => {
    it('calculates: Initial + Income - Expense + TransferIn - TransferOut', () => {
      const initial = 10000;
      const income = 50000;
      const expense = 15000;
      const transferIn = 2000;
      const transferOut = 5000;

      const balance = calculateAccountBalance(initial, income, expense, transferIn, transferOut);
      // 10000 + 50000 - 15000 + 2000 - 5000 = 42000
      expect(balance.toNumber()).toBe(42000);
    });

    it('handles decimal precision with zero floating point errors', () => {
      // Classic 0.1 + 0.2 floating point challenge
      const balance = calculateAccountBalance(0, 0.1, 0, 0.2, 0);
      expect(balance.toString()).toBe('0.3');
    });
  });

  describe('calculateNetWorth', () => {
    it('calculates Net Worth = Total Assets - Total Liabilities', () => {
      const assets = [
        { balance: 25000 },      // Cash
        { balance: 185450 },     // Salary bank
        { balance: 450000 },     // Savings
        { balance: 820000 },     // Mutual funds
      ];
      const liabilities = [
        { balance: 34200 },      // Credit card outstanding
        { balance: -350000 },    // Loan liability (negative balance)
      ];

      const { totalAssets, totalLiabilities, netWorth } = calculateNetWorth(assets, liabilities);

      // Total Assets = 25000 + 185450 + 450000 + 820000 = 1480450
      expect(totalAssets.toNumber()).toBe(1480450);

      // Total Liabilities = 34200 + 350000 = 384200
      expect(totalLiabilities.toNumber()).toBe(384200);

      // Net Worth = 1480450 - 384200 = 1096250
      expect(netWorth.toNumber()).toBe(1096250);
    });

    it('excludes accounts when includeInTotals is false', () => {
      const assets = [
        { balance: 100000, includeInTotals: true },
        { balance: 50000, includeInTotals: false },
      ];
      const liabilities = [
        { balance: 20000, includeInTotals: true },
        { balance: 10000, includeInTotals: false },
      ];

      const { totalAssets, totalLiabilities, netWorth } = calculateNetWorth(assets, liabilities);
      expect(totalAssets.toNumber()).toBe(100000);
      expect(totalLiabilities.toNumber()).toBe(20000);
      expect(netWorth.toNumber()).toBe(80000);
    });
  });

  describe('parseArithmeticExpression (Deterministic Keypad Parser)', () => {
    it('evaluates basic addition, subtraction, multiplication, and division', () => {
      expect(parseArithmeticExpression('200 + 45 - 15').result?.toNumber()).toBe(230);
      expect(parseArithmeticExpression('50 * 3 + 10 / 2').result?.toNumber()).toBe(155);
      expect(parseArithmeticExpression('100 / 4').result?.toNumber()).toBe(25);
    });

    it('respects operator precedence and parentheses', () => {
      expect(parseArithmeticExpression('(100 + 20) * 1.05').result?.toNumber()).toBe(126);
      expect(parseArithmeticExpression('10 + 20 * 3').result?.toNumber()).toBe(70);
      expect(parseArithmeticExpression('(10 + 20) * 3').result?.toNumber()).toBe(90);
    });

    it('handles unicode multiplication and division symbols (x, X, ÷)', () => {
      expect(parseArithmeticExpression('25 x 4').result?.toNumber()).toBe(100);
      expect(parseArithmeticExpression('50 X 2').result?.toNumber()).toBe(100);
      expect(parseArithmeticExpression('100 ÷ 5').result?.toNumber()).toBe(20);
    });

    it('handles decimal numbers and unary minus', () => {
      expect(parseArithmeticExpression('-50 + 120.75').result?.toNumber()).toBe(70.75);
      expect(parseArithmeticExpression('0.1 + 0.2').result?.toString()).toBe('0.3');
    });

    it('gracefully handles live typing with trailing operators', () => {
      expect(parseArithmeticExpression('200 +').result?.toNumber()).toBe(200);
      expect(parseArithmeticExpression('200 + 50 -').result?.toNumber()).toBe(250);
    });

    it('detects division by zero and malformed syntax', () => {
      const divZero = parseArithmeticExpression('100 / 0');
      expect(divZero.isValid).toBe(false);
      expect(divZero.error).toBe('Division by zero');

      const mismatchedParen = parseArithmeticExpression('(100 + 50');
      expect(mismatchedParen.isValid).toBe(false);
      expect(mismatchedParen.error).toBe('Mismatched parentheses');
    });
  });

  describe('Credit Card Statement & Settlement Cutoff Math', () => {
    it('accurately divides transactions into statement vs unbilled based on settlement date', () => {
      const settlementDate = 15;
      const statementCutoff = new Date(2026, 7, settlementDate, 23, 59, 59); // Aug 15, 2026

      const txList = [
        { date: '2026-08-10T12:00:00.000Z', amount: 5000, type: 'expense' }, // before cutoff -> billed
        { date: '2026-08-14T20:00:00.000Z', amount: 3500, type: 'expense' }, // before cutoff -> billed
        { date: '2026-08-18T10:00:00.000Z', amount: 4200, type: 'expense' }, // after cutoff -> unbilled
      ];

      const billed = txList.filter((t) => new Date(t.date).getTime() <= statementCutoff.getTime());
      const statementBalance = billed.reduce((sum, t) => sum + t.amount, 0);
      const totalOutstanding = txList.reduce((sum, t) => sum + t.amount, 0);

      expect(statementBalance).toBe(8500);
      expect(totalOutstanding).toBe(12700);
    });
  });
});
