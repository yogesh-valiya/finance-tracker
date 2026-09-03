import React, { useEffect } from 'react';
import { useTransactionStore } from '../transactionStore';
import { useCategoryStore } from '@/features/categories/categoryStore';
import { useAccountStore } from '@/features/accounts/accountStore';
import { useAuthStore } from '@/features/auth/authStore';
import type { BookmarkTemplate } from '../transactionStore';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, Trash2, Plus, Tag, ArrowRight } from 'lucide-react';
import { formatCurrency } from '@/lib/financial-math';
import { toast } from 'sonner';

interface BookmarksModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectTemplate: (template: BookmarkTemplate) => void;
}

export const BookmarksModal: React.FC<BookmarksModalProps> = ({
  open,
  onOpenChange,
  onSelectTemplate,
}) => {
  const { preferences } = useAuthStore();
  const { bookmarks, fetchBookmarks, deleteBookmark } = useTransactionStore();
  const { categories } = useCategoryStore();
  const { accounts } = useAccountStore();

  useEffect(() => {
    fetchBookmarks();
  }, [fetchBookmarks]);

  const activeCurrency = preferences?.main_currency || 'INR';

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await deleteBookmark(id);
    toast.success('Bookmark removed');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xs sm:max-w-sm rounded-3xl p-4 gap-3 max-h-[85vh] overflow-y-auto">
        <DialogHeader className="pb-1">
          <DialogTitle className="text-sm font-bold flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Star className="size-4 text-amber-500 fill-amber-500" />
              <span>Bookmarks & Reusable Templates</span>
            </div>
          </DialogTitle>
        </DialogHeader>

        {/* Templates List */}
        <div className="flex flex-col gap-2 max-h-[55vh] overflow-y-auto pr-1">
          {bookmarks.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted-foreground flex flex-col items-center gap-2">
              <Star className="size-8 text-muted-foreground/40" />
              <p className="font-semibold text-foreground">No saved bookmark templates</p>
              <p className="text-[10px] leading-relaxed">
                Save frequent transactions (e.g. rent, coffee, gym) to log them in 1-click!
              </p>
            </div>
          ) : (
            bookmarks.map((bm) => {
              const cat = categories.find((c) => c.id === bm.category);
              const acc = accounts.find((a) => a.id === bm.from_account || a.id === bm.to_account);

              return (
                <div
                  key={bm.id}
                  onClick={() => {
                    onSelectTemplate(bm);
                    onOpenChange(false);
                  }}
                  className="flex items-center justify-between p-3 rounded-2xl border border-border/60 bg-card hover:bg-muted/40 cursor-pointer transition-all active:scale-[0.99]"
                >
                  <div className="flex items-center gap-2.5 min-w-0 pr-2">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-secondary/80 text-sm shadow-2xs">
                      {cat?.icon ? <span>{cat.icon}</span> : <Tag className="size-3.5 text-muted-foreground" />}
                    </div>

                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-foreground truncate">
                        {bm.name || cat?.name || 'Template'}
                      </span>
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground truncate">
                        <span>{cat?.name || 'Uncategorized'}</span>
                        {acc && <span>• {acc.name}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-bold font-mono text-foreground tabular-nums">
                      {formatCurrency(bm.amount, { currency: activeCurrency })}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      onClick={(e) => handleDelete(e, bm.id)}
                      className="text-muted-foreground hover:text-destructive h-6 w-6"
                      title="Remove Bookmark"
                    >
                      <Trash2 className="size-3" />
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
