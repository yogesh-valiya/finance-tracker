import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../auth/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  ArrowLeft,
  Calculator,
  Percent,
  TrendingUp,
  Receipt,
  RotateCcw,
} from 'lucide-react';
import { formatCurrency, toDecimal } from '@/lib/financial-math';

export const CalcBoxPage: React.FC = () => {
  const navigate = useNavigate();
  const { preferences } = useAuthStore();
  const currency = preferences?.main_currency || 'INR';

  // --- 1. Loan EMI State ---
  const [loanAmount, setLoanAmount] = useState('1000000');
  const [loanRate, setLoanRate] = useState('8.5');
  const [loanTenureYears, setLoanTenureYears] = useState('15');

  // EMI Math
  const P = parseFloat(loanAmount) || 0;
  const annualR = parseFloat(loanRate) || 0;
  const n = (parseFloat(loanTenureYears) || 0) * 12;
  const r = annualR / 12 / 100;

  let emi = 0;
  let totalPayable = 0;
  let totalInterest = 0;

  if (P > 0 && r > 0 && n > 0) {
    const factor = Math.pow(1 + r, n);
    emi = Math.round((P * r * factor) / (factor - 1));
    totalPayable = emi * n;
    totalInterest = totalPayable - P;
  }

  // --- 2. Compound Interest State ---
  const [ciPrincipal, setCiPrincipal] = useState('100000');
  const [ciMonthly, setCiMonthly] = useState('10000');
  const [ciRate, setCiRate] = useState('12');
  const [ciYears, setCiYears] = useState('10');

  const pInit = parseFloat(ciPrincipal) || 0;
  const pMonth = parseFloat(ciMonthly) || 0;
  const ciR = parseFloat(ciRate) || 0;
  const ciY = parseFloat(ciYears) || 0;
  const totalMonths = ciY * 12;
  const monthlyR = ciR / 12 / 100;

  let futureVal = pInit * Math.pow(1 + monthlyR, totalMonths);
  if (monthlyR > 0) {
    futureVal += pMonth * ((Math.pow(1 + monthlyR, totalMonths) - 1) / monthlyR) * (1 + monthlyR);
  } else {
    futureVal += pMonth * totalMonths;
  }
  const totalInvested = pInit + pMonth * totalMonths;
  const totalGains = Math.max(0, futureVal - totalInvested);

  // --- 3. Tip & Tax Splitter State ---
  const [billAmount, setBillAmount] = useState('2500');
  const [taxPercent, setTaxPercent] = useState('5');
  const [tipPercent, setTipPercent] = useState('10');
  const [splitCount, setSplitCount] = useState('4');

  const rawBill = parseFloat(billAmount) || 0;
  const taxVal = (rawBill * (parseFloat(taxPercent) || 0)) / 100;
  const tipVal = (rawBill * (parseFloat(tipPercent) || 0)) / 100;
  const grandTotal = rawBill + taxVal + tipVal;
  const people = Math.max(1, parseInt(splitCount) || 1);
  const perPerson = grandTotal / people;

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
              CalcBox
            </h1>
            <p className="text-[10px] text-muted-foreground">
              Financial calculations, EMI & investment modeling
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="emi" className="w-full">
        <TabsList className="grid grid-cols-3 w-full h-9 bg-muted/60 p-0.5 border border-border/40">
          <TabsTrigger value="emi" className="text-xs font-semibold">
            Loan EMI
          </TabsTrigger>
          <TabsTrigger value="compound" className="text-xs font-semibold">
            Compound SIP
          </TabsTrigger>
          <TabsTrigger value="split" className="text-xs font-semibold">
            Tip & Split
          </TabsTrigger>
        </TabsList>

        {/* 1. Loan EMI */}
        <TabsContent value="emi" className="flex flex-col gap-3.5 mt-3">
          <Card className="border-border/60 bg-card shadow-2xs">
            <CardContent className="flex flex-col gap-3 p-3.5">
              <div className="flex flex-col gap-1">
                <Label className="text-xs font-semibold">Loan Principal ({currency})</Label>
                <Input
                  type="number"
                  value={loanAmount}
                  onChange={(e) => setLoanAmount(e.target.value)}
                  className="h-9 text-xs font-mono"
                  placeholder="e.g. 1000000"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="flex flex-col gap-1">
                  <Label className="text-xs font-semibold">Interest Rate (% p.a.)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={loanRate}
                    onChange={(e) => setLoanRate(e.target.value)}
                    className="h-9 text-xs font-mono"
                    placeholder="8.5"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <Label className="text-xs font-semibold">Tenure (Years)</Label>
                  <Input
                    type="number"
                    value={loanTenureYears}
                    onChange={(e) => setLoanTenureYears(e.target.value)}
                    className="h-9 text-xs font-mono"
                    placeholder="15"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* EMI Result Card */}
          <Card className="border-primary/30 bg-primary/5 shadow-xs">
            <CardContent className="flex flex-col gap-3 p-4">
              <div className="flex items-center justify-between border-b border-border/40 pb-2">
                <span className="text-xs font-semibold text-muted-foreground">Monthly EMI</span>
                <span className="text-base font-extrabold font-mono text-primary tabular-nums">
                  {formatCurrency(emi, { currency })}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[10px] text-muted-foreground block">Principal Amount</span>
                  <span className="font-semibold font-mono tabular-nums">
                    {formatCurrency(P, { currency })}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-muted-foreground block">Total Interest</span>
                  <span className="font-semibold font-mono text-destructive tabular-nums">
                    {formatCurrency(totalInterest, { currency })}
                  </span>
                </div>
                <div className="col-span-2 pt-1 border-t border-border/40 flex justify-between">
                  <span className="text-[11px] font-semibold text-foreground">Total Payable Amount</span>
                  <span className="font-bold font-mono text-foreground tabular-nums">
                    {formatCurrency(totalPayable, { currency })}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 2. Compound SIP */}
        <TabsContent value="compound" className="flex flex-col gap-3.5 mt-3">
          <Card className="border-border/60 bg-card shadow-2xs">
            <CardContent className="flex flex-col gap-3 p-3.5">
              <div className="grid grid-cols-2 gap-2.5">
                <div className="flex flex-col gap-1">
                  <Label className="text-xs font-semibold">Initial Lump Sum</Label>
                  <Input
                    type="number"
                    value={ciPrincipal}
                    onChange={(e) => setCiPrincipal(e.target.value)}
                    className="h-9 text-xs font-mono"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <Label className="text-xs font-semibold">Monthly SIP</Label>
                  <Input
                    type="number"
                    value={ciMonthly}
                    onChange={(e) => setCiMonthly(e.target.value)}
                    className="h-9 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="flex flex-col gap-1">
                  <Label className="text-xs font-semibold">Expected Return (% p.a.)</Label>
                  <Input
                    type="number"
                    value={ciRate}
                    onChange={(e) => setCiRate(e.target.value)}
                    className="h-9 text-xs font-mono"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <Label className="text-xs font-semibold">Period (Years)</Label>
                  <Input
                    type="number"
                    value={ciYears}
                    onChange={(e) => setCiYears(e.target.value)}
                    className="h-9 text-xs font-mono"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* SIP Result */}
          <Card className="border-income/30 bg-income/5 shadow-xs">
            <CardContent className="flex flex-col gap-3 p-4">
              <div className="flex items-center justify-between border-b border-border/40 pb-2">
                <span className="text-xs font-semibold text-muted-foreground">Expected Maturity Value</span>
                <span className="text-base font-extrabold font-mono text-income tabular-nums">
                  {formatCurrency(futureVal, { currency })}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[10px] text-muted-foreground block">Total Invested</span>
                  <span className="font-semibold font-mono tabular-nums">
                    {formatCurrency(totalInvested, { currency })}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-muted-foreground block">Estimated Wealth Gain</span>
                  <span className="font-semibold font-mono text-income tabular-nums">
                    +{formatCurrency(totalGains, { currency })}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 3. Tip & Split */}
        <TabsContent value="split" className="flex flex-col gap-3.5 mt-3">
          <Card className="border-border/60 bg-card shadow-2xs">
            <CardContent className="flex flex-col gap-3 p-3.5">
              <div className="flex flex-col gap-1">
                <Label className="text-xs font-semibold">Total Bill Amount</Label>
                <Input
                  type="number"
                  value={billAmount}
                  onChange={(e) => setBillAmount(e.target.value)}
                  className="h-9 text-xs font-mono"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="flex flex-col gap-1">
                  <Label className="text-xs font-semibold">Tax (%)</Label>
                  <Input
                    type="number"
                    value={taxPercent}
                    onChange={(e) => setTaxPercent(e.target.value)}
                    className="h-9 text-xs font-mono"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <Label className="text-xs font-semibold">Tip (%)</Label>
                  <Input
                    type="number"
                    value={tipPercent}
                    onChange={(e) => setTipPercent(e.target.value)}
                    className="h-9 text-xs font-mono"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <Label className="text-xs font-semibold">People</Label>
                  <Input
                    type="number"
                    value={splitCount}
                    onChange={(e) => setSplitCount(e.target.value)}
                    className="h-9 text-xs font-mono"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Split Result */}
          <Card className="border-border/60 bg-secondary/50 shadow-xs">
            <CardContent className="flex flex-col gap-3 p-4">
              <div className="flex items-center justify-between border-b border-border/40 pb-2">
                <span className="text-xs font-semibold text-muted-foreground">Each Person Pays</span>
                <span className="text-base font-extrabold font-mono text-primary tabular-nums">
                  {formatCurrency(perPerson, { currency })}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs text-center">
                <div>
                  <span className="text-[10px] text-muted-foreground block">Tax</span>
                  <span className="font-semibold font-mono tabular-nums">
                    {formatCurrency(taxVal, { currency })}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground block">Tip</span>
                  <span className="font-semibold font-mono tabular-nums">
                    {formatCurrency(tipVal, { currency })}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground block">Total Bill</span>
                  <span className="font-semibold font-mono tabular-nums">
                    {formatCurrency(grandTotal, { currency })}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
