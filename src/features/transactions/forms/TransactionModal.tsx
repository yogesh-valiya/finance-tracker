import React, { useState, useEffect, useMemo } from 'react';
import { useTransactionStore } from '../transactionStore';
import { useAccountStore } from '@/features/accounts/accountStore';
import { useCategoryStore } from '@/features/categories/categoryStore';
import { useAuthStore } from '@/features/auth/authStore';
import { CategorySelectSheet } from './CategorySelectSheet';
import { AccountSelectSheet } from './AccountSelectSheet';
import { RepeatModal } from '../recurring/RepeatModal';
import type { Transaction, Account, Category, Subcategory } from '@/types';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Star,
  Repeat,
  ArrowUpDown,
  Camera,
  X,
  Trash2,
  Copy,
  Delete,
  Calculator,
  Globe,
  Plus,
} from 'lucide-react';
import { parseArithmeticExpression, formatCurrency } from '@/lib/financial-math';
import { toast } from 'sonner';

interface TransactionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transactionToEdit?: Transaction | null;
  defaultType?: 'expense' | 'income' | 'transfer';
  defaultAccountId?: string;
  onSuccess?: () => void;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  open,
  onOpenChange,
  transactionToEdit,
  defaultType = 'expense',
  defaultAccountId,
  onSuccess,
}) => {
  const { preferences } = useAuthStore();
  const {
    createTransaction,
    updateTransaction,
    deleteTransaction,
    duplicateTransaction,
    transactions,
    saveBookmark,
  } = useTransactionStore();
  const { accounts } = useAccountStore();
  const { categories, subcategories } = useCategoryStore();

  const activeCurrency = preferences?.main_currency || 'INR';

  // Form State
  const [type, setType] = useState<'expense' | 'income' | 'transfer'>(defaultType);
  const [date, setDate] = useState<Date>(new Date());
  const [amountExpr, setAmountExpr] = useState('0');
  const [feeExpr, setFeeExpr] = useState('0');
  const [activeNumpadTarget, setActiveNumpadTarget] = useState<'amount' | 'fee'>('amount');
  const [showFeeRow, setShowFeeRow] = useState(false);

  // Category & Account selection
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<string | undefined>();
  const [fromAccountId, setFromAccountId] = useState<string>('');
  const [toAccountId, setToAccountId] = useState<string>('');

  // Note & Description & Photos
  const [note, setNote] = useState('');
  const [description, setDescription] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [isBookmarked, setIsBookmarked] = useState(false);

  // Sheets & Sub-Modals
  const [isCategorySheetOpen, setIsCategorySheetOpen] = useState(false);
  const [isAccountSheetOpen, setIsAccountSheetOpen] = useState(false);
  const [accountSheetTarget, setAccountSheetTarget] = useState<'from' | 'to'>('from');
  const [isRepeatModalOpen, setIsRepeatModalOpen] = useState(false);

  // Sync state on open/edit
  useEffect(() => {
    if (transactionToEdit) {
      setType(transactionToEdit.type);
      setDate(new Date(transactionToEdit.date));
      setAmountExpr(transactionToEdit.amount.toString());
      setFeeExpr((transactionToEdit.fee || 0).toString());
      setSelectedCategoryId(transactionToEdit.category || '');
      setSelectedSubcategoryId(transactionToEdit.subcategory);
      setFromAccountId(transactionToEdit.from_account || '');
      setToAccountId(transactionToEdit.to_account || '');
      setNote(transactionToEdit.note || '');
      setDescription(transactionToEdit.description || '');
      setShowFeeRow(!!transactionToEdit.fee && transactionToEdit.fee > 0);
    } else {
      setType(defaultType);
      setDate(new Date());
      setAmountExpr('0');
      setFeeExpr('0');
      setNote('');
      setDescription('');
      setShowFeeRow(false);
      setIsBookmarked(false);

      const firstCat = categories.find((c) => c.type === defaultType);
      if (firstCat) setSelectedCategoryId(firstCat.id);

      const defaultAcc = defaultAccountId || accounts[0]?.id || '';
      if (defaultType === 'expense') {
        setFromAccountId(defaultAcc);
      } else if (defaultType === 'income') {
        setToAccountId(defaultAcc);
      } else if (defaultType === 'transfer') {
        setFromAccountId(defaultAcc);
        setToAccountId(accounts[1]?.id || defaultAcc);
      }
    }
  }, [transactionToEdit, open, defaultType, defaultAccountId, categories, accounts]);

  // Autocomplete Suggestions from Recent Notes
  const noteSuggestions = useMemo(() => {
    const recent = transactions
      .filter((t) => t.type === type && t.note && t.note.trim().length > 0)
      .map((t) => t.note!.trim());
    return Array.from(new Set(recent)).slice(0, 5);
  }, [transactions, type]);

  const selectedCategory = categories.find((c) => c.id === selectedCategoryId);
  const selectedSubcategory = subcategories.find((s) => s.id === selectedSubcategoryId);
  const fromAccount = accounts.find((a) => a.id === fromAccountId);
  const toAccount = accounts.find((a) => a.id === toAccountId);

  // Arithmetic Numpad Key Press Handler
  const handleKeypadPress = (key: string) => {
    const currentVal = activeNumpadTarget === 'amount' ? amountExpr : feeExpr;
    const setTarget = activeNumpadTarget === 'amount' ? setAmountExpr : setFeeExpr;

    if (key === 'CLEAR') {
      setTarget('0');
      return;
    }

    if (key === '⌫') {
      const next = currentVal.slice(0, -1);
      setTarget(next.length === 0 ? '0' : next);
      return;
    }

    const lastChar = currentVal.slice(-1);
    const isOp = ['+', '-', '×', '÷', '*', '/'].includes(key);
    const lastIsOp = ['+', '-', '×', '÷', '*', '/'].includes(lastChar);

    if (isOp && lastIsOp) {
      setTarget(currentVal.slice(0, -1) + key);
      return;
    }

    setTarget(currentVal === '0' && !isOp && key !== '.' ? key : currentVal + key);
  };

  const handleSwapAccounts = () => {
    const temp = fromAccountId;
    setFromAccountId(toAccountId);
    setToAccountId(temp);
  };

  const handleBookmarkToggle = async () => {
    setIsBookmarked(!isBookmarked);
    if (!isBookmarked) {
      const parsed = parseArithmeticExpression(amountExpr);
      await saveBookmark({
        name: note || selectedCategory?.name || 'Template',
        type,
        amount: parsed.result ? parsed.result.toNumber() : 0,
        category: selectedCategoryId,
        subcategory: selectedSubcategoryId,
        from_account: fromAccountId,
        to_account: toAccountId,
        note,
        description,
      });
      toast.success('Saved to Bookmarks templates');
    }
  };

  const handleSave = async (continueLogging = false) => {
    const parsedAmount = parseArithmeticExpression(amountExpr);
    const parsedFee = parseArithmeticExpression(feeExpr);

    const finalAmount = parsedAmount.result ? parsedAmount.result.toNumber() : 0;
    const finalFee = parsedFee.result ? parsedFee.result.toNumber() : 0;

    if (finalAmount <= 0) {
      toast.error('Please enter a valid transaction amount');
      return;
    }

    if (type === 'transfer' && fromAccountId === toAccountId) {
      toast.error('Source and Destination accounts must be different');
      return;
    }

    const payload: Partial<Transaction> = {
      type,
      date: date.toISOString(),
      amount: finalAmount,
      fee: type === 'transfer' && showFeeRow ? finalFee : 0,
      category: type !== 'transfer' ? selectedCategoryId : undefined,
      subcategory: type !== 'transfer' ? selectedSubcategoryId : undefined,
      from_account: type === 'expense' || type === 'transfer' ? fromAccountId : undefined,
      to_account: type === 'income' || type === 'transfer' ? toAccountId : undefined,
      note: note.trim(),
      description: description.trim(),
      photos,
    };

    try {
      if (transactionToEdit) {
        await updateTransaction(transactionToEdit.id, payload);
        toast.success('Transaction updated');
      } else {
        await createTransaction(payload);
        toast.success('Transaction logged');
      }

      if (continueLogging) {
        setAmountExpr('0');
        setNote('');
        setDescription('');
      } else {
        onOpenChange(false);
      }
      onSuccess?.();
    } catch {
      toast.error('Failed to save transaction');
    }
  };

  const handleDelete = async () => {
    if (!transactionToEdit) return;
    try {
      await deleteTransaction(transactionToEdit.id);
      toast.success('Transaction deleted');
      onOpenChange(false);
      onSuccess?.();
    } catch {
      toast.error('Failed to delete transaction');
    }
  };

  const formattedDate = useMemo(() => {
    const d = date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' });
    const dayName = new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(date);
    const time = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    return `${d} (${dayName}) ${time}`;
  }, [date]);

  // Keys grid
  const keypadRows = [
    ['7', '8', '9', '÷'],
    ['4', '5', '6', '×'],
    ['1', '2', '3', '-'],
    ['0', '.', '⌫', '+'],
  ];

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md w-full h-[94vh] max-h-[94vh] rounded-3xl p-0 flex flex-col overflow-hidden bg-card border border-border/80 shadow-2xl">
          {/* 1. Header Bar: Back Chevron, Title, Star Bookmark */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 bg-card">
            <div className="flex items-center gap-1.5">
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                onClick={() => onOpenChange(false)}
                className="text-muted-foreground hover:text-foreground h-8 w-8 -ml-1 rounded-full"
              >
                <ArrowLeft className="size-4" />
              </Button>
              <h2 className="text-sm font-bold text-foreground capitalize">
                {type === 'expense' ? 'Expense' : type === 'income' ? 'Income' : 'Transfer'}
              </h2>
            </div>

            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                onClick={handleBookmarkToggle}
                className={`h-8 w-8 rounded-full ${
                  isBookmarked
                    ? 'text-amber-500 fill-amber-500'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                title="Bookmark Template"
              >
                <Star className={`size-4 ${isBookmarked ? 'fill-amber-500' : ''}`} />
              </Button>

              {transactionToEdit && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  onClick={handleDelete}
                  className="text-muted-foreground hover:text-destructive h-8 w-8 rounded-full"
                  title="Delete Transaction"
                >
                  <Trash2 className="size-4" />
                </Button>
              )}
            </div>
          </div>

          {/* 2. Top Segmented Switcher: Income | Expense | Transfer */}
          <div className="grid grid-cols-3 border-b border-border/60 bg-muted/30">
            <button
              type="button"
              onClick={() => {
                setType('income');
                const cat = categories.find((c) => c.type === 'income');
                if (cat) setSelectedCategoryId(cat.id);
              }}
              className={`py-2.5 text-xs font-bold transition-all border-b-2 ${
                type === 'income'
                  ? 'border-income text-income bg-background'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              Income
            </button>
            <button
              type="button"
              onClick={() => {
                setType('expense');
                const cat = categories.find((c) => c.type === 'expense');
                if (cat) setSelectedCategoryId(cat.id);
              }}
              className={`py-2.5 text-xs font-bold transition-all border-b-2 ${
                type === 'expense'
                  ? 'border-expense text-expense bg-background'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              Expense
            </button>
            <button
              type="button"
              onClick={() => setType('transfer')}
              className={`py-2.5 text-xs font-bold transition-all border-b-2 ${
                type === 'transfer'
                  ? 'border-foreground text-foreground bg-background'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              Transfer
            </button>
          </div>

          {/* 3. Form Rows Container */}
          <div className="flex-1 overflow-y-auto divide-y divide-border/40">
            {/* Row 1: Date & Time */}
            <div className="flex items-center justify-between px-4 py-2.5">
              <span className="text-xs font-medium text-muted-foreground w-20">Date</span>
              <div className="flex items-center justify-between flex-1">
                <span
                  onClick={() => {
                    const next = new Date(date.getTime() + 86400000);
                    setDate(next);
                  }}
                  className="text-xs font-semibold text-foreground cursor-pointer hover:underline"
                >
                  {formattedDate}
                </span>

                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  onClick={() => setIsRepeatModalOpen(true)}
                  className="h-6 px-1.5 text-[10.5px] font-semibold text-muted-foreground hover:text-foreground gap-1 ml-2"
                >
                  <Repeat className="size-3 text-primary" />
                  Rep/Inst.
                </Button>
              </div>
            </div>

            {/* Row 2: Account(s) */}
            {type !== 'transfer' ? (
              <div
                onClick={() => {
                  setAccountSheetTarget(type === 'expense' ? 'from' : 'to');
                  setIsAccountSheetOpen(true);
                }}
                className="flex items-center justify-between px-4 py-2.5 cursor-pointer hover:bg-muted/30 transition-colors"
              >
                <span className="text-xs font-medium text-muted-foreground w-20">Account</span>
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="text-base">🏦</span>
                  <span className="text-xs font-bold text-foreground truncate">
                    {(type === 'expense' ? fromAccount?.name : toAccount?.name) || 'Select Account'}
                  </span>
                </div>
              </div>
            ) : (
              /* Transfer Mode: From & To Rows with Swap Button */
              <>
                <div
                  onClick={() => {
                    setAccountSheetTarget('from');
                    setIsAccountSheetOpen(true);
                  }}
                  className="flex items-center justify-between px-4 py-2.5 cursor-pointer hover:bg-muted/30 transition-colors"
                >
                  <span className="text-xs font-medium text-muted-foreground w-20">From</span>
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="text-base">🏦</span>
                    <span className="text-xs font-bold text-foreground truncate">
                      {fromAccount?.name || 'Source Account'}
                    </span>
                  </div>
                </div>

                <div
                  onClick={() => {
                    setAccountSheetTarget('to');
                    setIsAccountSheetOpen(true);
                  }}
                  className="flex items-center justify-between px-4 py-2.5 cursor-pointer hover:bg-muted/30 transition-colors"
                >
                  <span className="text-xs font-medium text-muted-foreground w-20">To</span>
                  <div className="flex items-center justify-between flex-1 min-w-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-base">🏦</span>
                      <span className="text-xs font-bold text-foreground truncate">
                        {toAccount?.name || 'Destination Account'}
                      </span>
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSwapAccounts();
                      }}
                      className="h-6 w-6 text-primary hover:bg-primary/10 rounded-full"
                      title="Swap Source and Destination"
                    >
                      <ArrowUpDown className="size-3.5" />
                    </Button>
                  </div>
                </div>
              </>
            )}

            {/* Row 3: Category (in Expense & Income) */}
            {type !== 'transfer' && (
              <div
                onClick={() => setIsCategorySheetOpen(true)}
                className="flex items-center justify-between px-4 py-2.5 cursor-pointer hover:bg-muted/30 transition-colors"
              >
                <span className="text-xs font-medium text-muted-foreground w-20">Category</span>
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="text-base">{selectedCategory?.icon || '🏷️'}</span>
                  <span className="text-xs font-bold text-foreground truncate">
                    {selectedCategory?.name || 'Select Category'}
                    {selectedSubcategory ? ` / ${selectedSubcategory.name}` : ''}
                  </span>
                </div>
              </div>
            )}

            {/* Row 4: Amount & Embedded Fees Button */}
            <div
              onClick={() => setActiveNumpadTarget('amount')}
              className={`flex items-center justify-between px-4 py-2.5 cursor-pointer transition-colors ${
                activeNumpadTarget === 'amount' ? 'bg-primary/5' : ''
              }`}
            >
              <span className="text-xs font-medium text-muted-foreground w-20">Amount</span>
              <div className="flex items-center justify-end gap-2 flex-1">
                <span
                  className={`text-base font-extrabold font-mono tabular-nums ${
                    type === 'income'
                      ? 'text-income'
                      : type === 'expense'
                      ? 'text-expense'
                      : 'text-foreground'
                  }`}
                >
                  {amountExpr || '0.00'}
                </span>

                {type === 'transfer' && (
                  <Button
                    type="button"
                    variant={showFeeRow ? 'secondary' : 'outline'}
                    size="xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowFeeRow(!showFeeRow);
                      if (!showFeeRow) setActiveNumpadTarget('fee');
                      else setActiveNumpadTarget('amount');
                    }}
                    className="h-6 px-2 text-[10px] font-bold text-primary border-primary/30"
                  >
                    Fees
                  </Button>
                )}
              </div>
            </div>

            {/* Conditional Transfer Fees Row */}
            {type === 'transfer' && showFeeRow && (
              <div
                onClick={() => setActiveNumpadTarget('fee')}
                className={`flex items-center justify-between px-4 py-2 bg-muted/20 cursor-pointer transition-colors ${
                  activeNumpadTarget === 'fee' ? 'bg-primary/5' : ''
                }`}
              >
                <span className="text-xs font-medium text-muted-foreground w-20">Fees</span>
                <div className="flex items-center justify-end gap-2 flex-1">
                  <span className="text-xs font-bold font-mono text-expense tabular-nums">
                    {feeExpr || '0.00'}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowFeeRow(false);
                      setActiveNumpadTarget('amount');
                    }}
                    className="h-5 w-5 text-muted-foreground hover:text-foreground"
                  >
                    <X className="size-3" />
                  </Button>
                </div>
              </div>
            )}

            {/* Row 5: Note Input & Autocomplete */}
            <div className="flex flex-col px-4 py-2 gap-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground w-20">Note</span>
                <div className="relative flex items-center flex-1">
                  <Input
                    placeholder="Enter note or memo..."
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="h-7 text-xs border-0 border-b rounded-none px-0 shadow-none focus-visible:ring-0 focus-visible:border-primary"
                  />
                  {note && (
                    <button
                      type="button"
                      onClick={() => setNote('')}
                      className="absolute right-0 text-muted-foreground hover:text-foreground"
                    >
                      <X className="size-3" />
                    </button>
                  )}
                </div>
              </div>

              {/* Suggestions Chips */}
              {noteSuggestions.length > 0 && (
                <div className="flex items-center gap-1.5 overflow-x-auto pt-1 pl-20">
                  {noteSuggestions.map((s, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setNote(s)}
                      className="px-2 py-0.5 text-[9.5px] rounded-full border border-border/60 bg-muted/40 hover:bg-muted text-foreground font-medium shrink-0"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Row 6: Description & Photo Attachment */}
            <div className="flex items-center justify-between px-4 py-2.5">
              <span className="text-xs font-medium text-muted-foreground w-20">Description</span>
              <div className="flex items-center justify-between flex-1 gap-2">
                <Input
                  placeholder="Additional notes..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="h-7 text-xs border-0 border-b rounded-none px-0 shadow-none focus-visible:ring-0 focus-visible:border-primary"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => toast.info('Photo receipt attachment active')}
                  className="h-7 w-7 text-muted-foreground hover:text-foreground shrink-0 rounded-full"
                  title="Attach Photo Receipt"
                >
                  <Camera className="size-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* 4. Docked Bottom Arithmetic Numpad & Action Buttons */}
          <div className="flex flex-col border-t border-border/60 bg-muted/20 p-2 gap-1.5 select-none">
            {/* Keypad Grid (4x4) */}
            <div className="grid grid-cols-4 gap-1">
              {keypadRows.map((row, rIdx) =>
                row.map((k, cIdx) => {
                  const isOperator = ['+', '-', '×', '÷'].includes(k);
                  const isBackspace = k === '⌫';

                  return (
                    <button
                      key={`${rIdx}-${cIdx}`}
                      type="button"
                      onClick={() => handleKeypadPress(k)}
                      className={`h-10 rounded-xl text-base font-bold font-mono active:scale-95 transition-all shadow-2xs ${
                        isOperator
                          ? 'bg-muted text-primary text-lg font-extrabold'
                          : 'bg-card hover:bg-accent text-foreground border border-border/40'
                      }`}
                    >
                      {isBackspace ? <Delete className="size-4 mx-auto" /> : k}
                    </button>
                  );
                })
              )}
            </div>

            {/* Actions Bar: Continue + Save */}
            <div className="grid grid-cols-2 gap-2 pt-0.5">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleSave(true)}
                className="h-10 text-xs font-bold rounded-xl bg-card border-border/80 shadow-2xs"
              >
                Continue
              </Button>

              <Button
                type="button"
                onClick={() => handleSave(false)}
                className={`h-10 text-xs font-bold rounded-xl shadow-xs ${
                  type === 'income'
                    ? 'bg-income hover:bg-income/90 text-income-foreground'
                    : type === 'expense'
                    ? 'bg-expense hover:bg-expense/90 text-expense-foreground'
                    : 'bg-primary text-primary-foreground'
                }`}
              >
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Category Select Sheet */}
      {type !== 'transfer' && (
        <CategorySelectSheet
          open={isCategorySheetOpen}
          onOpenChange={setIsCategorySheetOpen}
          type={type}
          selectedCategoryId={selectedCategoryId}
          selectedSubcategoryId={selectedSubcategoryId}
          onSelect={(catId, subId) => {
            setSelectedCategoryId(catId);
            setSelectedSubcategoryId(subId);
          }}
        />
      )}

      {/* Account Select Sheet */}
      <AccountSelectSheet
        open={isAccountSheetOpen}
        onOpenChange={setIsAccountSheetOpen}
        title={accountSheetTarget === 'from' ? 'Select Source Account' : 'Select Destination Account'}
        selectedAccountId={accountSheetTarget === 'from' ? fromAccountId : toAccountId}
        onSelect={(acc) => {
          if (accountSheetTarget === 'from') setFromAccountId(acc.id);
          else setToAccountId(acc.id);
        }}
        currency={activeCurrency}
      />

      {/* Recurring Repeat Modal */}
      <RepeatModal
        open={isRepeatModalOpen}
        onOpenChange={setIsRepeatModalOpen}
        defaultData={{
          type,
          amount: Number(amountExpr) || 0,
          category: selectedCategoryId,
          subcategory: selectedSubcategoryId,
          from_account: fromAccountId,
          to_account: toAccountId,
          note,
        }}
      />
    </>
  );
};
