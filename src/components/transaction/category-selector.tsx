"use client";

import * as React from "react";
import { Category, Subcategory } from "@prisma/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface CategoryWithSubs extends Category {
  subcategories: Subcategory[];
}

interface CategorySelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: CategoryWithSubs[];
  type: "INCOME" | "EXPENSE";
  selectedCategoryId: string | null;
  selectedSubcategoryId: string | null;
  onSelect: (categoryId: string, subcategoryId: string | null) => void;
}

export function CategorySelector({
  open,
  onOpenChange,
  categories,
  type,
  selectedCategoryId,
  selectedSubcategoryId,
  onSelect,
}: CategorySelectorProps) {
  const filtered = React.useMemo(() => {
    return categories.filter((c) => c.type === type);
  }, [categories, type]);

  const [activeParentId, setActiveParentId] = React.useState<string | null>(
    selectedCategoryId || (filtered[0]?.id ?? null)
  );

  React.useEffect(() => {
    if (open) {
      if (selectedCategoryId && filtered.some((c) => c.id === selectedCategoryId)) {
        setActiveParentId(selectedCategoryId);
      } else if (filtered.length > 0) {
        setActiveParentId(filtered[0].id);
      } else {
        setActiveParentId(null);
      }
    }
  }, [open, selectedCategoryId, type]);

  const activeParent = React.useMemo(() => {
    return filtered.find((c) => c.id === activeParentId) || filtered[0] || null;
  }, [filtered, activeParentId]);

  function handleSelectSub(subId: string | null) {
    if (activeParent) {
      onSelect(activeParent.id, subId);
      onOpenChange(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 gap-0 overflow-hidden bg-card border-border">
        <DialogHeader className="p-4 border-b border-border">
          <DialogTitle className="text-base font-semibold">
            Select {type === "INCOME" ? "Income" : "Expense"} Category
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 divide-x divide-border h-80">
          {/* Left Column: Parent Categories */}
          <div className="overflow-y-auto p-2 flex flex-col gap-1">
            {filtered.map((cat) => {
              const isSelected = activeParent?.id === cat.id;
              return (
                <Button
                  key={cat.id}
                  type="button"
                  variant={isSelected ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setActiveParentId(cat.id)}
                  className={cn(
                    "w-full justify-start text-xs font-medium h-9 gap-2.5 px-3",
                    !isSelected && "text-muted-foreground"
                  )}
                >
                  <span className="text-base leading-none shrink-0">{cat.emoji}</span>
                  <span className="truncate">{cat.name}</span>
                </Button>
              );
            })}
          </div>

          {/* Right Column: Subcategories */}
          <div className="overflow-y-auto p-2 flex flex-col gap-1 bg-muted/10">
            {activeParent ? (
              <>
                <Button
                  type="button"
                  variant={selectedCategoryId === activeParent.id && !selectedSubcategoryId ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => handleSelectSub(null)}
                  className={cn(
                    "w-full justify-start text-xs font-medium h-9 px-3",
                    selectedCategoryId === activeParent.id && !selectedSubcategoryId
                      ? "text-primary font-semibold"
                      : "text-muted-foreground"
                  )}
                >
                  <span>General / All {activeParent.name}</span>
                </Button>

                {activeParent.subcategories?.map((sub) => {
                  const isSubSelected = selectedSubcategoryId === sub.id;
                  return (
                    <Button
                      key={sub.id}
                      type="button"
                      variant={isSubSelected ? "secondary" : "ghost"}
                      size="sm"
                      onClick={() => handleSelectSub(sub.id)}
                      className={cn(
                        "w-full justify-start text-xs font-medium h-9 px-3",
                        isSubSelected
                          ? "text-primary font-semibold"
                          : "text-muted-foreground"
                      )}
                    >
                      <span className="truncate">{sub.name}</span>
                    </Button>
                  );
                })}
              </>
            ) : (
              <p className="text-xs text-muted-foreground p-3 text-center">No categories found</p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
