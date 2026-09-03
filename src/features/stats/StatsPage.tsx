import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PieChart, Sparkles } from 'lucide-react';

export const StatsPage: React.FC = () => {
  return (
    <div className="flex flex-col gap-4 p-4 pt-6">
      <div className="flex items-center justify-between">
        <h1 className="text-base font-bold text-foreground">Stats & Analytics</h1>
        <Badge variant="outline" className="text-[10px]">Phase 7 Preview</Badge>
      </div>

      <Card className="border-border/60">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <PieChart className="size-4 text-primary" />
            Visual Intelligence Hub
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 text-xs text-muted-foreground">
          <p>
            Interactive donut charts, ranked category breakdown, historical 12-month trend curves, and weekly aggregations will be configured in Phase 7.
          </p>
          <div className="flex items-center gap-1.5 text-primary text-[11px] font-semibold pt-2">
            <Sparkles className="size-3.5" />
            Double-entry ledger data ready for visualization
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
