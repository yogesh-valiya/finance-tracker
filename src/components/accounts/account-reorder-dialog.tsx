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
import { Button } from "@/components/ui/button";
import { ArrowDown, ArrowUp, Loader2 } from "lucide-react";

interface AccountReorderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accountsByGroup: Record<AccountGroup, ComputedAccount[]>;
  onSuccess: () => void;
}

export function AccountReorderDialog({
  open,
  onOpenChange,
  accountsByGroup,
  onSuccess,
}: AccountReorderDialogProps) {
  const [loadingId, setLoadingId] = React.useState<string | null>(null);

  async function handleMove(accountId: string, direction: "up" | "down") {
    setLoadingId(accountId);
    try {
      const res = await fetch("/api/accounts/reorder", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountId, direction }),
      });

      if (res.ok) {
        onSuccess();
      }
    } catch (err) {
      console.error("Reorder failed:", err);
    } finally {
      setLoadingId(null);
    }
  }

  const activeGroups = (Object.keys(accountsByGroup) as AccountGroup[]).filter(
    (g) => accountsByGroup[g]?.length > 1
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Modify Account Orders</DialogTitle>
          <DialogDescription>
            Reorder accounts within their respective classification groups
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-6 py-2">
          {activeGroups.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-6">
              Add multiple accounts in the same group to enable reordering.
            </p>
          ) : (
            activeGroups.map((groupKey) => {
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
                    {accounts.map((acc, index) => {
                      const isFirst = index === 0;
                      const isLast = index === accounts.length - 1;
                      const isBusy = loadingId === acc.id;

                      return (
                        <div
                          key={acc.id}
                          className="flex items-center justify-between p-2 rounded-md bg-background border border-border/60 text-xs"
                        >
                          <span className="font-medium text-foreground truncate pr-2">
                            {acc.name}
                          </span>

                          <div className="flex items-center gap-1 shrink-0">
                            <Button
                              variant="outline"
                              size="icon-xs"
                              disabled={isFirst || isBusy}
                              onClick={() => handleMove(acc.id, "up")}
                              title="Move up"
                            >
                              <ArrowUp className="size-3" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon-xs"
                              disabled={isLast || isBusy}
                              onClick={() => handleMove(acc.id, "down")}
                              title="Move down"
                            >
                              <ArrowDown className="size-3" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
