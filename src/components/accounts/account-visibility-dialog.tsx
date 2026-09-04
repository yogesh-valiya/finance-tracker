"use client";

import * as React from "react";
import { ComputedAccount } from "@/lib/services/balance";
import { AccountGroup } from "@prisma/client";
import { ACCOUNT_GROUPS_META } from "./account-group-meta";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";

interface AccountVisibilityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accountsByGroup: Record<AccountGroup, ComputedAccount[]>;
  onSuccess: () => void;
}

export function AccountVisibilityDialog({
  open,
  onOpenChange,
  accountsByGroup,
  onSuccess,
}: AccountVisibilityDialogProps) {
  const [loadingId, setLoadingId] = React.useState<string | null>(null);

  async function handleToggle(accountId: string, currentHidden: boolean) {
    setLoadingId(accountId);
    try {
      const res = await fetch(`/api/accounts/${accountId}/visibility`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isHidden: !currentHidden }),
      });

      if (res.ok) {
        onSuccess();
      }
    } catch (err) {
      console.error("Failed to toggle visibility:", err);
    } finally {
      setLoadingId(null);
    }
  }

  const allGroups = (Object.keys(accountsByGroup) as AccountGroup[]).filter(
    (g) => accountsByGroup[g]?.length > 0
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Show / Hide Accounts</DialogTitle>
          <DialogDescription>
            Hidden accounts remain in your database but are concealed from daily transaction lists
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-5 py-2">
          {allGroups.map((groupKey) => {
            const meta = ACCOUNT_GROUPS_META[groupKey];
            if (!meta) return null;
            const accounts = accountsByGroup[groupKey] || [];
            const Icon = meta.icon;

            return (
              <div key={groupKey} className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                  <Icon className="size-3.5 text-primary" />
                  <span>{meta.label}</span>
                </div>

                <div className="flex flex-col gap-1.5 rounded-lg border border-border p-2 bg-muted/20">
                  {accounts.map((acc) => {
                    const isBusy = loadingId === acc.id;

                    return (
                      <div
                        key={acc.id}
                        className="flex items-center justify-between p-2 rounded-md bg-background border border-border/60 text-xs"
                      >
                        <div className="flex flex-col">
                          <span className="font-medium text-foreground">{acc.name}</span>
                          <span className="text-[10px] text-muted-foreground">
                            {acc.isHidden ? "Currently hidden" : "Visible"}
                          </span>
                        </div>

                        <Switch
                          checked={!acc.isHidden}
                          onCheckedChange={() => handleToggle(acc.id, acc.isHidden)}
                          disabled={isBusy}
                          size="sm"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
