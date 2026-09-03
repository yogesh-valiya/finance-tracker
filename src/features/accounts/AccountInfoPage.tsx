import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAccountStore } from './accountStore';
import { useAuthStore } from '../auth/authStore';
import { ACCOUNT_GROUPS } from '@/types';
import type { AccountGroup } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  ArrowLeft,
  Trash2,
  AlertTriangle,
  CreditCard,
  Building,
  Info,
} from 'lucide-react';
import { formatCurrency, toDecimal } from '@/lib/financial-math';
import { toast } from 'sonner';

export const AccountInfoPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { preferences } = useAuthStore();
  const {
    accounts,
    fetchAccounts,
    updateAccount,
    deleteAccount,
    getAccountBalance,
    getCreditCardMetrics,
  } = useAccountStore();

  const account = accounts.find((a) => a.id === id);

  const [name, setName] = useState('');
  const [group, setGroup] = useState<AccountGroup>('accounts');
  const [amount, setAmount] = useState('0');
  const [description, setDescription] = useState('');
  const [includeInTotals, setIncludeInTotals] = useState(true);
  const [isHidden, setIsHidden] = useState(false);
  const [settlementDate, setSettlementDate] = useState('1');
  const [paymentDate, setPaymentDate] = useState('1');
  const [linkedAccount, setLinkedAccount] = useState('none');

  // Difference Confirmation State
  const [showDiffConfirm, setShowDiffConfirm] = useState(false);
  const [pendingDiff, setPendingDiff] = useState<number>(0);

  // Delete Alert State
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (account) {
      setName(account.name);
      setGroup(account.group);
      setAmount(account.amount.toString());
      setDescription(account.description || '');
      setIncludeInTotals(account.include_in_totals ?? true);
      setIsHidden(account.is_hidden ?? false);
      setSettlementDate((account.settlement_date || 1).toString());
      setPaymentDate((account.payment_date || 1).toString());
      setLinkedAccount(account.linked_account || 'none');
    } else {
      fetchAccounts();
    }
  }, [account, fetchAccounts]);

  if (!account) {
    return (
      <div className="flex flex-col items-center justify-center p-8 gap-3">
        <span className="text-xs text-muted-foreground">Account not found</span>
        <Button size="sm" variant="outline" onClick={() => navigate('/accounts')}>
          Back to Accounts
        </Button>
      </div>
    );
  }

  const groupMeta = ACCOUNT_GROUPS.find((g) => g.id === group);
  const bankAccounts = accounts.filter(
    (a) => (a.group === 'accounts' || a.group === 'savings') && a.id !== id
  );
  const currentLiveBalance = getAccountBalance(account);
  const activeCurrency = preferences?.main_currency || 'INR';
  const ccMetrics = account.group === 'card' ? getCreditCardMetrics(account) : null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Please enter an account name');
      return;
    }

    const newAmount = Number(amount) || 0;
    const diff = toDecimal(newAmount).minus(toDecimal(account.amount)).toNumber();

    if (diff !== 0) {
      setPendingDiff(diff);
      setShowDiffConfirm(true);
    } else {
      executeSave(false);
    }
  };

  const executeSave = async (recordDifference: boolean) => {
    try {
      await updateAccount(
        account.id,
        {
          name: name.trim(),
          group,
          amount: Number(amount) || 0,
          description: description.trim(),
          include_in_totals: includeInTotals,
          is_hidden: isHidden,
          settlement_date: group === 'card' ? Number(settlementDate) : undefined,
          payment_date: group === 'card' ? Number(paymentDate) : undefined,
          linked_account: group === 'debit_card' && linkedAccount !== 'none' ? linkedAccount : undefined,
        },
        recordDifference,
        account.amount
      );

      toast.success('Account settings saved');
      navigate('/accounts');
    } catch {
      toast.error('Failed to save account settings');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteAccount(account.id);
      toast.success(`Account "${account.name}" deleted`);
      navigate('/accounts');
    } catch {
      toast.error('Failed to delete account');
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4 pt-4 pb-16">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => navigate('/accounts')}
            className="text-muted-foreground hover:text-foreground -ml-2"
          >
            <ArrowLeft className="size-4" />
          </Button>
          <div className="flex items-center gap-2">
            <span className="text-xl">{groupMeta?.icon || '🏦'}</span>
            <div>
              <h1 className="text-sm font-bold text-foreground leading-tight">
                {account.name}
              </h1>
              <p className="text-[10px] text-muted-foreground">
                Account Configuration & Settings
              </p>
            </div>
          </div>
        </div>

        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => setShowDeleteConfirm(true)}
          className="text-muted-foreground hover:text-destructive h-8 w-8"
          title="Delete Account"
        >
          <Trash2 className="size-4" />
        </Button>
      </div>

      {/* Current Balance Summary Strip */}
      <Card className="border-border/60 bg-muted/20 shadow-2xs">
        <CardContent className="flex items-center justify-between p-3.5">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-semibold text-muted-foreground">
              Current Live Balance
            </span>
            <span className="text-sm font-bold font-mono text-foreground tabular-nums">
              {formatCurrency(currentLiveBalance, { currency: activeCurrency })}
            </span>
          </div>
          <Badge variant="secondary" className="text-xs px-2 py-0.5 font-semibold">
            {groupMeta?.name}
          </Badge>
        </CardContent>
      </Card>

      {/* Credit Card Specific Statement Summary Box */}
      {group === 'card' && ccMetrics && (
        <Card className="border-border/60 bg-card shadow-2xs">
          <CardContent className="flex flex-col gap-2.5 p-3.5">
            <div className="flex items-center justify-between border-b border-border/40 pb-2">
              <span className="text-xs font-bold text-foreground">Statement vs Outstanding</span>
              <span className="text-[10px] text-muted-foreground font-mono">{ccMetrics.billingCycleText}</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col">
                <span className="text-[10px] font-semibold text-muted-foreground">Balance Payable</span>
                <span className="text-sm font-bold font-mono text-expense tabular-nums">
                  {formatCurrency(ccMetrics.statementBalance, { currency: activeCurrency })}
                </span>
                <span className="text-[9px] text-muted-foreground">{ccMetrics.paymentDueText}</span>
              </div>

              <div className="flex flex-col text-right">
                <span className="text-[10px] font-semibold text-muted-foreground">Outstanding Balance</span>
                <span className="text-sm font-bold font-mono text-foreground tabular-nums">
                  {formatCurrency(ccMetrics.outstandingBalance, { currency: activeCurrency })}
                </span>
                <span className="text-[9px] text-muted-foreground">Total Unpaid Debt</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loan Negative Amount Warning */}
      {group === 'loan' && Number(amount) > 0 && (
        <Card className="border-amber-500/40 bg-amber-500/10 shadow-2xs">
          <CardContent className="flex items-center gap-2 p-3 text-xs text-amber-700 dark:text-amber-400">
            <AlertTriangle className="size-4 shrink-0" />
            <span>
              Loan amounts should be entered as a <strong>negative value</strong> (e.g. ₹ -5,47,000.00). Positive values will incorrectly be added to your assets.
            </span>
          </CardContent>
        </Card>
      )}

      {/* Main Settings Form */}
      <form onSubmit={handleSave} className="flex flex-col gap-3.5">
        {/* Classification Group Selector */}
        <div className="flex flex-col gap-1">
          <Label className="text-xs font-semibold">Account Group</Label>
          <Select value={group} onValueChange={(v) => setGroup(v as AccountGroup)}>
            <SelectTrigger className="h-9 text-xs font-semibold">
              <SelectValue placeholder="Select Group" />
            </SelectTrigger>
            <SelectContent className="max-h-60">
              {ACCOUNT_GROUPS.map((g) => (
                <SelectItem key={g.id} value={g.id} className="text-xs font-medium">
                  {g.icon} {g.name} {g.isLiability ? '(Liability)' : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Account Name */}
        <div className="flex flex-col gap-1">
          <Label htmlFor="accName" className="text-xs font-semibold">Account Name</Label>
          <Input
            id="accName"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-9 text-xs"
          />
        </div>

        {/* Base Initial Amount */}
        <div className="flex flex-col gap-1">
          <Label htmlFor="accAmount" className="text-xs font-semibold flex items-center justify-between">
            <span>Base / Initial Amount</span>
            <span className="text-[10px] text-muted-foreground font-normal">
              Changing this prompts difference reconciliation
            </span>
          </Label>
          <div className="relative flex items-center">
            <span className="absolute left-3 text-xs font-bold text-muted-foreground">₹</span>
            <Input
              id="accAmount"
              type="number"
              step="any"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="h-9 pl-7 text-xs font-mono font-semibold"
            />
          </div>
        </div>

        {/* Credit Card Specific Date Settings */}
        {group === 'card' && (
          <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl border border-border/60 bg-card shadow-2xs">
            <div className="flex flex-col gap-1">
              <Label className="text-[10px] font-semibold">Settlement Date</Label>
              <Select value={settlementDate} onValueChange={setSettlementDate}>
                <SelectTrigger className="h-8 text-xs font-mono">
                  <SelectValue placeholder="Settlement Date" />
                </SelectTrigger>
                <SelectContent className="max-h-48">
                  {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                    <SelectItem key={d} value={d.toString()} className="text-xs font-mono">
                      Every {d}th
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-[10px] font-semibold">Payment Date</Label>
              <Select value={paymentDate} onValueChange={setPaymentDate}>
                <SelectTrigger className="h-8 text-xs font-mono">
                  <SelectValue placeholder="Payment Date" />
                </SelectTrigger>
                <SelectContent className="max-h-48">
                  {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                    <SelectItem key={d} value={d.toString()} className="text-xs font-mono">
                      Every {d}th
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* Debit Card Linked Bank Account */}
        {group === 'debit_card' && (
          <div className="flex flex-col gap-1 p-2.5 rounded-xl border border-border/60 bg-card shadow-2xs">
            <Label className="text-[10px] font-semibold">Linked Bank Account</Label>
            <Select value={linkedAccount} onValueChange={setLinkedAccount}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Select Parent Account" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none" className="text-xs">None / Independent</SelectItem>
                {bankAccounts.map((b) => (
                  <SelectItem key={b.id} value={b.id} className="text-xs">
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Description */}
        <div className="flex flex-col gap-1">
          <Label htmlFor="accDesc" className="text-xs font-semibold">Description / Notes</Label>
          <Input
            id="accDesc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Account details, branch, notes"
            className="h-9 text-xs"
          />
        </div>

        {/* Include in Totals Switch */}
        <div className="flex items-center justify-between p-3 rounded-xl border border-border/60 bg-card shadow-2xs">
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-foreground">Include in Totals</span>
            <span className="text-[10px] text-muted-foreground">
              Include in Consolidated Net Worth calculation
            </span>
          </div>
          <Switch
            checked={includeInTotals}
            onCheckedChange={setIncludeInTotals}
          />
        </div>

        {/* Hide Account Switch */}
        <div className="flex items-center justify-between p-3 rounded-xl border border-border/60 bg-card shadow-2xs">
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-foreground">Hide Account</span>
            <span className="text-[10px] text-muted-foreground">
              Hide from transaction selection sheets and feeds
            </span>
          </div>
          <Switch
            checked={isHidden}
            onCheckedChange={setIsHidden}
          />
        </div>

        {/* Save Changes Button */}
        <Button type="submit" size="sm" className="h-9 text-xs font-semibold mt-2">
          Save Changes
        </Button>
      </form>

      {/* Difference Reconciliation Dialog */}
      <AlertDialog open={showDiffConfirm} onOpenChange={setShowDiffConfirm}>
        <AlertDialogContent className="max-w-xs rounded-2xl p-4 gap-3">
          <AlertDialogHeader>
            <div className="flex items-center gap-2 text-primary">
              <Info className="size-4" />
              <AlertDialogTitle className="text-sm font-bold">
                Record Balance Difference?
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-xs text-muted-foreground leading-relaxed pt-1">
              You adjusted the baseline balance by{' '}
              <strong className="text-foreground font-mono font-semibold">
                ₹ {Math.abs(pendingDiff)}
              </strong>. Would you like to record this difference as an{' '}
              <strong className="text-foreground">
                {pendingDiff > 0 ? 'Income' : 'Expense'}
              </strong>{' '}
              transaction for double-entry ledger parity?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-row justify-end gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setShowDiffConfirm(false);
                executeSave(false);
              }}
              className="h-8 text-xs font-semibold flex-1"
            >
              [ NO ] (Balance Only)
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setShowDiffConfirm(false);
                executeSave(true);
              }}
              className="h-8 text-xs font-semibold flex-1"
            >
              [ YES ] (Record Entry)
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Alert */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent className="max-w-xs rounded-2xl p-4 gap-3">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-sm font-bold">
              Delete "{account.name}"?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground">
              Are you sure you want to delete this account? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-row justify-end gap-2">
            <AlertDialogCancel className="h-8 text-xs font-semibold flex-1">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="h-8 text-xs font-semibold flex-1 bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
