"use client";

import * as React from "react";
import { Bookmark, TransactionType } from "@prisma/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Star, Trash2, ArrowUpRight, ArrowDownLeft, ArrowLeftRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface BookmarksPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectBookmark: (bm: Bookmark) => void;
}

export function BookmarksPanel({
  open,
  onOpenChange,
  onSelectBookmark,
}: BookmarksPanelProps) {
  const [bookmarks, setBookmarks] = React.useState<Bookmark[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);

  const fetchBookmarks = React.useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/bookmarks");
      if (res.ok) {
        const data = await res.json();
        setBookmarks(data);
      }
    } catch (err) {
      console.error("Failed to load bookmarks:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (open) {
      fetchBookmarks();
    }
  }, [open, fetchBookmarks]);

  async function handleDelete(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    try {
      setDeletingId(id);
      const res = await fetch(`/api/bookmarks?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setBookmarks((prev) => prev.filter((b) => b.id !== id));
      }
    } catch (err) {
      console.error("Failed to delete bookmark:", err);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold flex items-center gap-2">
            <Star className="size-4 text-amber-500 fill-amber-500" />
            Saved Transaction Templates
          </DialogTitle>
          <DialogDescription className="text-xs">
            Tap any template to immediately pre-fill the transaction creator (§5.3)
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="size-6 animate-spin text-primary" />
          </div>
        ) : bookmarks.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground gap-2">
            <Star className="size-8 stroke-1 text-muted-foreground/60" />
            <p className="text-xs">No bookmarks saved yet.</p>
            <p className="text-[11px] text-muted-foreground">
              Tip: Click the star icon (⭐) on the transaction form to save frequently used templates.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2 py-2">
            {bookmarks.map((bm) => {
              const isIncome = bm.type === "INCOME";
              const isTransfer = bm.type === "TRANSFER";

              return (
                <div
                  key={bm.id}
                  onClick={() => {
                    onSelectBookmark(bm);
                    onOpenChange(false);
                  }}
                  className="flex items-center justify-between p-3 rounded-xl border border-border bg-background hover:bg-muted/40 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={cn(
                        "size-7 rounded-md flex items-center justify-center text-xs",
                        isIncome && "bg-income/10 text-income",
                        bm.type === "EXPENSE" && "bg-expense/10 text-expense",
                        isTransfer && "bg-muted text-foreground"
                      )}
                    >
                      {isIncome && <ArrowDownLeft className="size-3.5" />}
                      {bm.type === "EXPENSE" && <ArrowUpRight className="size-3.5" />}
                      {isTransfer && <ArrowLeftRight className="size-3.5" />}
                    </div>

                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-foreground">{bm.name}</span>
                      <span className="text-[10px] text-muted-foreground">{bm.type}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {bm.amount && (
                      <span className="text-xs font-bold tabular-nums text-foreground">
                        ₹{parseFloat(bm.amount.toString()).toFixed(2)}
                      </span>
                    )}

                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={(e) => handleDelete(bm.id, e)}
                      disabled={deletingId === bm.id}
                      className="size-7 text-muted-foreground hover:text-destructive"
                      title="Delete template"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
