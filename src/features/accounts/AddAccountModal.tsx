import React, { useState } from 'react';
import { useAccountStore } from './accountStore';
import { ACCOUNT_GROUPS } from '@/types';
import type { AccountGroup } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
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
import { ArrowLeft, Plus, Check, Info } from 'lucide-react';
import { toast } from 'sonner';

interface AddAccountModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export const AddAccountModal: React.FC<AddAccountModalProps> = ({
  open,
  onOpenChange,
  onSuccess,
}) => {
  const { accounts, createAccount } = useAccountStore();

  // Wizard Step: 'select_group' | 'form'
  const [step, setStep] = useState<'select_group' | 'form'>('select_group');
  const [selectedGroup, setSelectedGroup] = useState<AccountGroup>('accounts');

  // Form Fields
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('0');
  const [description, setDescription] = useState('');
  const [includeInTotals, setIncludeInTotals] = useState(true);
  const [settlementDate, setSettlementDate] = useState('1');
  const [paymentDate, setPaymentDate] = useState('1');
  const [linkedAccount, setLinkedAccount] = useState('none');

  // Difference Confirmation Dialog
  const [showDiffConfirm, setShowDiffConfirm] = useState(false);
  const [pendingAccountData, setPendingAccountData] = useState<any>(null);

  const handleSelectGroup = (group: AccountGroup) => {
    setSelectedGroup(group);
    setStep('form');
  };

  const handleClose = () => {
    onOpenChange(false);
    setStep('select_group');
    setName('');
    setAmount('0');
    setDescription('');
    setIncludeInTotals(true);
    setSettlementDate('1');
    setPaymentDate('1');
    setLinkedAccount('none');
  };

  const groupMeta = ACCOUNT_GROUPS.find((g) => g.id === selectedGroup);
  const bankAccounts = accounts.filter((a) => a.group === 'accounts' || a.group === 'savings');

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Please enter an account name');
      return;
    }

    const numAmount = Number(amount) || 0;

    const payload = {
      name: name.trim(),
      group: selectedGroup,
      amount: numAmount,
      description: description.trim(),
      include_in_totals: includeInTotals,
      settlement_date: selectedGroup === 'card' ? Number(settlementDate) : undefined,
      payment_date: selectedGroup === 'card' ? Number(paymentDate) : undefined,
      linked_account: selectedGroup === 'debit_card' && linkedAccount !== 'none' ? linkedAccount : undefined,
    };

    // If initial amount is non-zero, trigger "Record Difference" confirmation modal
    if (numAmount !== 0) {
      setPendingAccountData(payload);
      setShowDiffConfirm(true);
    } else {
      executeCreate(payload, false);
    }
  };

  const executeCreate = async (payload: any, recordDifference: boolean) => {
    try {
      await createAccount(payload, recordDifference);
      toast.success(`Account "${payload.name}" created!`);
      handleClose();
      onSuccess?.();
    } catch {
      toast.error('Failed to create account');
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-xs sm:max-w-sm rounded-2xl p-4 gap-4">
          <DialogHeader>
            <div className="flex items-center gap-2">
              {step === 'form' && (
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => setStep('select_group')}
                  className="text-muted-foreground hover:text-foreground -ml-1"
                >
                  <ArrowLeft className="size-3.5" />
                </Button>
              )}
              <DialogTitle className="text-sm font-bold">
                {step === 'select_group' ? 'Select Account Group' : `New ${groupMeta?.name || 'Account'}`}
              </DialogTitle>
            </div>
          </DialogHeader>

          {/* STEP 1: Select Account Group Modal */}
          {step === 'select_group' && (
            <div className="flex flex-col gap-1.5 max-h-[65vh] overflow-y-auto pr-1">
              <span className="text-[10px] text-muted-foreground pb-1">
                Choose a classification group for your new account:
              </span>
              {ACCOUNT_GROUPS.map((group) => (
                <Button
                  key={group.id}
                  variant="outline"
                  onClick={() => handleSelectGroup(group.id)}
                  className="flex items-center justify-between p-3 h-auto rounded-xl border-border/60 hover:bg-muted/50 hover:border-primary/50 text-left w-full transition-all active:scale-[0.99]"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-lg shrink-0">{group.icon}</span>
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-foreground">
                          {group.name}
                        </span>
                        {group.isLiability && (
                          <Badge variant="outline" className="text-[9px] px-1 py-0 h-3.5 text-expense border-expense/40">
                            Liability
                          </Badge>
                        )}
                      </div>
                      <span className="text-[10px] text-muted-foreground truncate">
                        {group.description}
                      </span>
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          )}

          {/* STEP 2: Add Account Form */}
          {step === 'form' && (
            <form onSubmit={handleFormSubmit} className="flex flex-col gap-3">
              {/* Group Header Badge */}
              <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30 border border-border/40 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-base">{groupMeta?.icon}</span>
                  <span className="font-semibold text-foreground">{groupMeta?.name}</span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  onClick={() => setStep('select_group')}
                  className="h-6 text-[10px] text-primary"
                >
                  Change Group
                </Button>
              </div>

              {/* Account Name */}
              <div className="flex flex-col gap-1">
                <Label htmlFor="accName" className="text-xs font-semibold">
                  Account Name
                </Label>
                <Input
                  id="accName"
                  placeholder="e.g. AXIS Salary Ac, HSBC CC, Wallet"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-9 text-xs"
                  autoFocus
                />
              </div>

              {/* Initial Amount / Starting Balance */}
              <div className="flex flex-col gap-1">
                <Label htmlFor="accAmount" className="text-xs font-semibold flex items-center justify-between">
                  <span>Initial Balance</span>
                  {selectedGroup === 'loan' && (
                    <span className="text-[10px] text-expense font-normal">
                      Enter as negative for debt
                    </span>
                  )}
                </Label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-xs font-bold text-muted-foreground">
                    ₹
                  </span>
                  <Input
                    id="accAmount"
                    type="number"
                    step="any"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="h-9 pl-7 text-xs font-mono font-semibold"
                  />
                </div>
              </div>

              {/* Credit Card Specific Fields with shadcn Select */}
              {selectedGroup === 'card' && (
                <div className="grid grid-cols-2 gap-2 p-2.5 rounded-lg border border-border/60 bg-muted/20">
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

              {/* Debit Card Specific Fields with shadcn Select */}
              {selectedGroup === 'debit_card' && (
                <div className="flex flex-col gap-1 p-2.5 rounded-lg border border-border/60 bg-muted/20">
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

              {/* Description Memo */}
              <div className="flex flex-col gap-1">
                <Label htmlFor="accDesc" className="text-xs font-semibold">
                  Description / Account No. (Optional)
                </Label>
                <Input
                  id="accDesc"
                  placeholder="e.g. A/C No. ending in 4920"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>

              {/* Include in Totals Switch */}
              <div className="flex items-center justify-between p-2 rounded-lg border border-border/40 bg-muted/20">
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

              <DialogFooter className="flex flex-row justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleClose}
                  className="h-8 text-xs font-semibold flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="h-8 text-xs font-semibold flex-1"
                >
                  Save Account
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* STEP 3: "Record Difference as Income/Expense" Confirmation Modal */}
      <AlertDialog open={showDiffConfirm} onOpenChange={setShowDiffConfirm}>
        <AlertDialogContent className="max-w-xs rounded-2xl p-4 gap-3">
          <AlertDialogHeader>
            <div className="flex items-center gap-2 text-primary">
              <Info className="size-4" />
              <AlertDialogTitle className="text-sm font-bold">
                Record Initial Difference?
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-xs text-muted-foreground leading-relaxed pt-1">
              The opening balance of{' '}
              <strong className="text-foreground font-mono font-semibold">
                ₹ {pendingAccountData?.amount}
              </strong>{' '}
              is registered on your account details. Would you like to record this difference as an{' '}
              <strong className="text-foreground">
                {pendingAccountData?.amount > 0 ? 'Income' : 'Expense'}
              </strong>{' '}
              transaction for ledger double-entry parity?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-row justify-end gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setShowDiffConfirm(false);
                if (pendingAccountData) executeCreate(pendingAccountData, false);
              }}
              className="h-8 text-xs font-semibold flex-1"
            >
              [ NO ] (Balance Only)
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setShowDiffConfirm(false);
                if (pendingAccountData) executeCreate(pendingAccountData, true);
              }}
              className="h-8 text-xs font-semibold flex-1"
            >
              [ YES ] (Record Entry)
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
