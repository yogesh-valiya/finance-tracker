import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  ArrowLeft,
  Share2,
  Copy,
  QrCode,
  Sparkles,
  Heart,
} from 'lucide-react';
import { toast } from 'sonner';

export const RecommendPage: React.FC = () => {
  const navigate = useNavigate();
  const shareUrl = window.location.origin;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    toast.success('App link copied to clipboard!');
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
              Recommend App
            </h1>
            <p className="text-[10px] text-muted-foreground">
              Share Money Manager with friends & family
            </p>
          </div>
        </div>
      </div>

      <Card className="border-border/60 bg-gradient-to-br from-card to-muted/30 shadow-2xs">
        <CardContent className="flex flex-col items-center gap-3.5 p-6 text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-xs">
            <Heart className="size-7 fill-primary/20 text-primary" />
          </div>

          <div className="flex flex-col gap-1">
            <h2 className="text-sm font-bold text-foreground">
              Enjoying Money Manager?
            </h2>
            <p className="text-[11px] text-muted-foreground leading-relaxed max-w-[280px]">
              Help your colleagues, friends, and family track double-entry finances, manage budgets, and build net worth.
            </p>
          </div>

          <div className="flex items-center gap-2 w-full max-w-[280px] p-2 rounded-xl border border-border/60 bg-background font-mono text-xs text-muted-foreground justify-between">
            <span className="truncate">{shareUrl}</span>
            <Button
              size="icon-xs"
              variant="ghost"
              onClick={handleCopyLink}
              className="text-primary hover:bg-primary/10 h-6 w-6 shrink-0"
              title="Copy link"
            >
              <Copy className="size-3.5" />
            </Button>
          </div>

          <Button
            onClick={handleCopyLink}
            className="w-full max-w-[280px] h-9 gap-1.5 text-xs font-semibold"
          >
            <Share2 className="size-3.5" />
            Share Money Manager
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
