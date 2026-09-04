"use client";

import * as React from "react";
import { Account, TransactionType } from "@prisma/client";
import { CategoryWithSubs } from "./category-selector";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Filter, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FilterState {
  type: TransactionType | "ALL";
  accountId: string | "ALL";
  categoryId: string | "ALL";
}

interface FilterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accounts: Account[];
  categories: CategoryWithSubs[];
  filters: FilterState;
  onApply: (filters: FilterState) => void;
}

export function FilterDialog({
  open,
  onOpenChange,
  accounts,
  categories,
  filters,
  onApply,
}: FilterDialogProps) {
  const [localFilters, setLocalFilters] = React.useState<FilterState>(filters);

  React.useEffect(() => {
    if (open) {
      setLocalFilters(filters);
    }
  }, [open, filters]);

  function handleReset() {
    const defaultState: FilterState = { type: "ALL", accountId: "ALL", categoryId: "ALL" };
    setLocalFilters(defaultState);
    onApply(defaultState);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold flex items-center gap-2">
            <Filter className="size-4 text-primary" />
            Filter Transactions
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-5 py-2">
          {/* Transaction Type Filter */}
          <div className="flex flex-col gap-2">
            <Label className="text-xs font-semibold">Transaction Type</Label>
            <div className="grid grid-cols-4 gap-1.5 p-1 rounded-xl bg-muted/30 border border-border">
              {(["ALL", "EXPENSE", "INCOME", "TRANSFER"] as const).map((t) => (
                <Button
                  key={t}
                  type="button"
                  size="sm"
                  variant={localFilters.type === t ? "default" : "ghost"}
                  onClick={() => setLocalFilters((prev) => ({ ...prev, type: t }))}
                  className={cn(
                    "h-8 text-xs font-semibold",
                    localFilters.type !== t && "text-muted-foreground"
                  )}
                >
                  {t === "ALL" ? "All" : t === "EXPENSE" ? "Expense" : t === "INCOME" ? "Income" : "Transfer"}
                </Button>
              ))}
            </div>
          </div>

          {/* Account Filter */}
          <div className="flex flex-col gap-2">
            <Label className="text-xs font-semibold">Account</Label>
            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-1">
              <Button
                type="button"
                variant={localFilters.accountId === "ALL" ? "default" : "outline"}
                size="sm"
                onClick={() => setLocalFilters((prev) => ({ ...prev, accountId: "ALL" }))}
                className="justify-start text-xs font-medium truncate h-8"
              >
                All Accounts
              </Button>
              {accounts.map((acc) => (
                <Button
                  key={acc.id}
                  type="button"
                  variant={localFilters.accountId === acc.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setLocalFilters((prev) => ({ ...prev, accountId: acc.id }))}
                  className="justify-start text-xs font-medium truncate h-8"
                >
                  {acc.name}
                </Button>
              ))}
            </div>
          </div>

          {/* Category Filter */}
          {localFilters.type !== "TRANSFER" && (
            <div className="flex flex-col gap-2">
              <Label className="text-xs font-semibold">Category</Label>
              <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-1">
                <Button
                  type="button"
                  variant={localFilters.categoryId === "ALL" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setLocalFilters((prev) => ({ ...prev, categoryId: "ALL" }))}
                  className="justify-start text-xs font-medium truncate h-8"
                >
                  All Categories
                </Button>
                {categories
                  .filter((c) => localFilters.type === "ALL" || c.type === localFilters.type)
                  .map((cat) => (
                    <Button
                      key={cat.id}
                      type="button"
                      variant={localFilters.categoryId === cat.id ? "default" : "outline"}
                      size="sm"
                      onClick={() => setLocalFilters((prev) => ({ ...prev, categoryId: cat.id }))}
                      className="justify-start text-xs font-medium truncate h-8 gap-1.5"
                    >
                      <span>{cat.emoji}</span>
                      <span className="truncate">{cat.name}</span>
                    </Button>
                  ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 pt-3 border-t border-border">
          <Button type="button" variant="ghost" size="sm" onClick={handleReset} className="h-8 text-xs">
            <RotateCcw className="size-3 mr-1.5" />
            Reset
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={() => {
              onApply(localFilters);
              onOpenChange(false);
            }}
            className="h-8 text-xs"
          >
            Apply Filters
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
