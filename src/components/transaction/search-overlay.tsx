"use client";

import * as React from "react";
import { TransactionWithDetails } from "@/lib/services/aggregation";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Search, Loader2, ArrowDownLeft, ArrowUpRight, ArrowLeftRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchOverlayProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectTransaction: (tx: TransactionWithDetails) => void;
}

export function SearchOverlay({
  open,
  onOpenChange,
  onSelectTransaction,
}: SearchOverlayProps) {
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<TransactionWithDetails[]>([]);
  const [metrics, setMetrics] = React.useState<{ income: number; expenses: number; transfers: number; count: number } | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  React.useEffect(() => {
    if (!open) {
      setQuery("");
      setResults([]);
      setMetrics(null);
      return;
    }
  }, [open]);

  React.useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setMetrics(null);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setIsLoading(true);
        const res = await fetch(`/api/transactions/search?q=${encodeURIComponent(query.trim())}`);
        if (res.ok) {
          const data = await res.json();
          setResults(data.transactions);
          setMetrics(data.metrics);
        }
      } catch (err) {
        console.error("Search failed:", err);
      } finally {
        setIsLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[85vh] p-0 gap-0 overflow-hidden bg-card border-border flex flex-col">
        {/* Search Header Input */}
        <div className="flex items-center gap-3 p-3.5 border-b border-border bg-background">
          <Search className="size-5 text-muted-foreground shrink-0" />
          <Input
            placeholder="Search transactions by note, description, category, or account..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="border-none shadow-none focus-visible:ring-0 p-0 text-sm h-9"
            autoFocus
          />
          {isLoading && <Loader2 className="size-4 animate-spin text-muted-foreground shrink-0" />}
        </div>

        {/* Metrics Strip */}
        {metrics && metrics.count > 0 && (
          <div className="grid grid-cols-3 gap-2 px-4 py-2.5 bg-muted/20 border-b border-border text-center text-xs">
            <div>
              <span className="text-[10px] text-muted-foreground uppercase">Matches:</span>
              <p className="font-semibold text-foreground">{metrics.count}</p>
            </div>
            <div>
              <span className="text-[10px] text-muted-foreground uppercase">Income:</span>
              <p className="font-semibold text-income tabular-nums">+₹{metrics.income.toFixed(2)}</p>
            </div>
            <div>
              <span className="text-[10px] text-muted-foreground uppercase">Expenses:</span>
              <p className="font-semibold text-expense tabular-nums">-₹{metrics.expenses.toFixed(2)}</p>
            </div>
          </div>
        )}

        {/* Results Feed */}
        <div className="overflow-y-auto flex-1 p-2 flex flex-col divide-y divide-border/60">
          {results.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground gap-2">
              <Search className="size-8 stroke-1" />
              <p className="text-xs">
                {query.trim() ? "No matching transactions found" : "Type to search through all transactions"}
              </p>
            </div>
          ) : (
            results.map((tx) => {
              const isIncome = tx.type === "INCOME";
              const isTransfer = tx.type === "TRANSFER";
              const dateStr = new Date(tx.date).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              });

              return (
                <button
                  key={tx.id}
                  type="button"
                  onClick={() => {
                    onSelectTransaction(tx);
                    onOpenChange(false);
                  }}
                  className="flex items-center justify-between p-3 hover:bg-muted/30 transition-colors text-left rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "size-8 rounded-full flex items-center justify-center text-sm shrink-0",
                        isIncome && "bg-income/10 text-income",
                        tx.type === "EXPENSE" && "bg-expense/10 text-expense",
                        isTransfer && "bg-muted text-foreground"
                      )}
                    >
                      {isIncome && <ArrowDownLeft className="size-4" />}
                      {tx.type === "EXPENSE" && <ArrowUpRight className="size-4" />}
                      {isTransfer && <ArrowLeftRight className="size-4" />}
                    </div>

                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-foreground truncate">
                          {tx.category ? `${tx.category.emoji} ${tx.category.name}` : "Transfer"}
                        </span>
                        {tx.subcategory && (
                          <span className="text-[10px] text-muted-foreground truncate">
                            › {tx.subcategory.name}
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-muted-foreground truncate">
                        {tx.note || dateStr} • {tx.account.name}
                        {tx.toAccount && ` → ${tx.toAccount.name}`}
                      </span>
                    </div>
                  </div>

                  <span
                    className={cn(
                      "text-xs font-bold tabular-nums shrink-0 pl-2",
                      isIncome && "text-income",
                      tx.type === "EXPENSE" && "text-expense",
                      isTransfer && "text-foreground"
                    )}
                  >
                    {isIncome ? "+" : "-"}₹{Number(tx.amount).toFixed(2)}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
