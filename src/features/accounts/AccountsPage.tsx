import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Landmark, Sparkles } from 'lucide-react';

export const AccountsPage: React.FC = () => {
  return (
    <div className="flex flex-col gap-4 p-4 pt-6">
      <div className="flex items-center justify-between">
        <h1 className="text-base font-bold text-foreground">Accounts & Net Worth</h1>
        <Badge variant="outline" className="text-[10px]">Phase 3 Preview</Badge>
      </div>

      <Card className="border-border/60">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Landmark className="size-4 text-primary" />
            Consolidated Balance Sheet
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 text-xs text-muted-foreground">
          <p>
            11 classification groups (Cash, Bank, Credit Cards, Debit Cards, Loans, Investments, Insurance) with Net Worth formula (<span className="font-mono font-semibold text-foreground">Assets - Liabilities</span>) will be configured in Phase 3.
          </p>
          <div className="flex items-center gap-1.5 text-primary text-[11px] font-semibold pt-2">
            <Sparkles className="size-3.5" />
            Double-entry ledger invariant verified in unit tests
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
