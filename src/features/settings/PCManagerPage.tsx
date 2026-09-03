import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Laptop, Wifi, ShieldCheck, ExternalLink } from 'lucide-react';

export const PCManagerPage: React.FC = () => {
  const navigate = useNavigate();
  const currentHost = window.location.origin;

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
              PC Manager
            </h1>
            <p className="text-[10px] text-muted-foreground">
              Manage accounts & transactions from desktop browser
            </p>
          </div>
        </div>
      </div>

      <Card className="border-border/60 bg-card shadow-2xs">
        <CardContent className="flex flex-col gap-3.5 p-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Laptop className="size-5" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-foreground">
                Desktop Web Access
              </h2>
              <span className="text-[10px] text-muted-foreground">
                Open in any modern browser on the same network
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-2 p-3 rounded-xl border border-border/50 bg-muted/20">
            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
              Web Address
            </span>
            <span className="text-xs font-mono font-bold text-primary select-all">
              {currentHost}
            </span>
          </div>

          <div className="flex items-center justify-between pt-1 text-xs">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Wifi className="size-3.5 text-emerald-500" />
              <span className="text-[11px]">Real-time synchronization</span>
            </div>
            <Badge variant="outline" className="text-[9.5px]">
              Ready
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
