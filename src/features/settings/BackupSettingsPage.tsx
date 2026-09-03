import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../auth/authStore';
import { collections } from '@/lib/pocketbase';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  CloudUpload,
  Download,
  Upload,
  FileSpreadsheet,
  RefreshCw,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react';
import { toast } from 'sonner';

export const BackupSettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [isSyncing, setIsSyncing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleSyncNow = async () => {
    setIsSyncing(true);
    try {
      if (!user) return;
      await Promise.all([
        collections.accounts().getFullList(),
        collections.categories().getFullList(),
        collections.transactions().getList(1, 50),
      ]);
      toast.success('PocketBase ledger synced successfully!');
    } catch {
      toast.error('Sync failed. Check network connection.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleExportJSON = async () => {
    setIsExporting(true);
    try {
      if (!user) return;
      const [accs, cats, subcats, txs, prefs] = await Promise.all([
        collections.accounts().getFullList(),
        collections.categories().getFullList(),
        collections.subcategories().getFullList(),
        collections.transactions().getFullList(),
        collections.userPreferences().getFullList(),
      ]);

      const backupData = {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        user: { id: user.id, email: user.email, name: user.name },
        accounts: accs,
        categories: cats,
        subcategories: subcats,
        transactions: txs,
        preferences: prefs[0] || null,
      };

      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupData, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute(
        'download',
        `money-manager-backup-${new Date().toISOString().slice(0, 10)}.json`
      );
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      toast.success('JSON backup downloaded successfully!');
    } catch {
      toast.error('Failed to export JSON backup');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportCSV = async () => {
    setIsExporting(true);
    try {
      if (!user) return;
      const txs = await collections.transactions().getFullList({
        sort: '-date',
        expand: 'category,subcategory,from_account,to_account',
      });

      const headers = ['Date', 'Type', 'Category', 'Subcategory', 'From Account', 'To Account', 'Amount', 'Note'];
      const rows = txs.map((tx) => [
        `"${new Date(tx.date).toISOString().slice(0, 10)}"`,
        `"${tx.type}"`,
        `"${tx.expand?.category?.name || ''}"`,
        `"${tx.expand?.subcategory?.name || ''}"`,
        `"${tx.expand?.from_account?.name || ''}"`,
        `"${tx.expand?.to_account?.name || ''}"`,
        tx.amount,
        `"${(tx.note || '').replace(/"/g, '""')}"`,
      ]);

      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', encodeURI(csvContent));
      downloadAnchor.setAttribute(
        'download',
        `transactions-export-${new Date().toISOString().slice(0, 10)}.csv`
      );
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      toast.success('CSV / Excel export generated!');
    } catch {
      toast.error('Failed to export CSV');
    } finally {
      setIsExporting(false);
    }
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
              Backup & Export
            </h1>
            <p className="text-[10px] text-muted-foreground">
              Cloud sync, JSON snapshots & spreadsheet exports
            </p>
          </div>
        </div>
      </div>

      {/* Cloud Status Card */}
      <Card className="border-border/60 bg-card shadow-2xs">
        <CardContent className="flex flex-col gap-3 p-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="size-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold text-foreground">
                Cloud Sync Active
              </span>
            </div>
            <Badge variant="outline" className="text-[9.5px] font-mono text-muted-foreground">
              PocketBase v0.23
            </Badge>
          </div>

          <p className="text-[11px] text-muted-foreground leading-relaxed">
            All your ledger accounts, double-entry transactions, and categories are automatically synchronized to your dedicated cloud database.
          </p>

          <Button
            onClick={handleSyncNow}
            disabled={isSyncing}
            variant="outline"
            className="h-8 gap-1.5 text-xs font-semibold"
          >
            <RefreshCw className={`size-3.5 ${isSyncing ? 'animate-spin text-primary' : ''}`} />
            {isSyncing ? 'Synchronizing...' : 'Sync Now'}
          </Button>
        </CardContent>
      </Card>

      {/* Export / Backup Tools */}
      <div className="flex flex-col gap-1.5">
        <h2 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground px-1">
          Export & Local Backup
        </h2>

        <div className="flex flex-col rounded-xl border border-border/60 bg-card divide-y divide-border/50 overflow-hidden shadow-2xs">
          {/* JSON Backup */}
          <div
            onClick={handleExportJSON}
            className="flex items-center justify-between px-3.5 py-3 hover:bg-accent/40 active:bg-accent/60 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Download className="size-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-foreground">
                  Download JSON Backup
                </span>
                <span className="text-[10px] text-muted-foreground">
                  Complete snapshot of accounts, categories & transactions
                </span>
              </div>
            </div>
          </div>

          {/* CSV / Excel Export */}
          <div
            onClick={handleExportCSV}
            className="flex items-center justify-between px-3.5 py-3 hover:bg-accent/40 active:bg-accent/60 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
                <FileSpreadsheet className="size-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-foreground">
                  Export to CSV / Excel
                </span>
                <span className="text-[10px] text-muted-foreground">
                  Formatted spreadsheet of transaction history
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
