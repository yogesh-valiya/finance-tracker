"use client";

import * as React from "react";
import { Account } from "@prisma/client";
import { ACCOUNT_GROUPS_META } from "@/components/accounts/account-group-meta";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface AccountSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accounts: Account[];
  selectedAccountId: string | null;
  disabledAccountId?: string | null;
  title?: string;
  onSelect: (account: Account) => void;
}

export function AccountSelector({
  open,
  onOpenChange,
  accounts,
  selectedAccountId,
  disabledAccountId,
  title = "Select Account",
  onSelect,
}: AccountSelectorProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">{title}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 py-2">
          {accounts.map((acc) => {
            const meta = ACCOUNT_GROUPS_META[acc.group];
            const Icon = meta.icon;
            const isSelected = selectedAccountId === acc.id;
            const isDisabled = disabledAccountId === acc.id;

            return (
              <button
                key={acc.id}
                type="button"
                disabled={isDisabled}
                onClick={() => {
                  onSelect(acc);
                  onOpenChange(false);
                }}
                className={cn(
                  "flex flex-col items-start gap-1 p-3 rounded-xl border transition-all text-left relative",
                  isSelected
                    ? "border-primary bg-primary/5 text-primary shadow-xs"
                    : "border-border hover:border-primary/40 hover:bg-muted/40",
                  isDisabled && "opacity-30 cursor-not-allowed hover:border-border hover:bg-transparent"
                )}
              >
                <div
                  className={cn(
                    "p-1.5 rounded-md",
                    isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                  )}
                >
                  <Icon className="size-4" />
                </div>
                <span className="font-semibold text-xs text-foreground mt-1 truncate max-w-full">
                  {acc.name}
                </span>
                <span className="text-[10px] text-muted-foreground truncate max-w-full">
                  {meta.label}
                </span>
              </button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
