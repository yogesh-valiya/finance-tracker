import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCategoryStore } from '@/features/categories/categoryStore';
import type { Category, Subcategory } from '@/types';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Pencil, X, ChevronRight, Plus, Check } from 'lucide-react';

interface CategorySelectSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: 'expense' | 'income';
  selectedCategoryId?: string;
  selectedSubcategoryId?: string;
  onSelect: (categoryId: string, subcategoryId?: string) => void;
}

export const CategorySelectSheet: React.FC<CategorySelectSheetProps> = ({
  open,
  onOpenChange,
  type,
  selectedCategoryId,
  selectedSubcategoryId,
  onSelect,
}) => {
  const navigate = useNavigate();
  const { categories, subcategories } = useCategoryStore();

  const filteredCategories = categories.filter((c) => c.type === type);
  const [activeCategory, setActiveCategory] = useState<Category | null>(
    filteredCategories.find((c) => c.id === selectedCategoryId) || filteredCategories[0] || null
  );

  const activeSubcategories = activeCategory
    ? subcategories.filter((s) => s.category === activeCategory.id)
    : [];

  const handleSelectParentOnly = (cat: Category) => {
    setActiveCategory(cat);
    onSelect(cat.id, undefined);
    onOpenChange(false);
  };

  const handleSelectSubcategory = (cat: Category, sub: Subcategory) => {
    onSelect(cat.id, sub.id);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[75vh] max-h-[75vh] rounded-t-3xl p-0 flex flex-col bg-card">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/60">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-foreground">
              {type === 'income' ? 'Income Category' : 'Expense Category'}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              onClick={() => {
                onOpenChange(false);
                navigate('/more/categories');
              }}
              className="text-muted-foreground hover:text-foreground h-6 w-6"
              title="Edit Categories"
            >
              <Pencil className="size-3.5" />
            </Button>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            onClick={() => onOpenChange(false)}
            className="text-muted-foreground hover:text-foreground h-7 w-7 rounded-full"
          >
            <X className="size-4" />
          </Button>
        </div>

        {/* 2-Column Responsive Layout */}
        <div className="grid grid-cols-2 divide-x divide-border/50 flex-1 overflow-hidden">
          {/* Left Column: Parent Categories */}
          <div className="flex flex-col overflow-y-auto divide-y divide-border/30">
            {filteredCategories.map((cat) => {
              const isActive = activeCategory?.id === cat.id;

              return (
                <div
                  key={cat.id}
                  onClick={() => setActiveCategory(cat)}
                  className={`flex items-center justify-between px-3.5 py-3 cursor-pointer transition-colors ${
                    isActive
                      ? 'bg-muted font-bold text-foreground border-l-3 border-primary'
                      : 'hover:bg-muted/40 text-foreground/80'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 pr-1">
                    <span className="text-base shrink-0">{cat.icon || '🏷️'}</span>
                    <span className="text-xs truncate">{cat.name}</span>
                  </div>
                  <ChevronRight className={`size-3.5 shrink-0 ${isActive ? 'text-primary' : 'text-muted-foreground/50'}`} />
                </div>
              );
            })}
          </div>

          {/* Right Column: Dynamic Subcategories */}
          <div className="flex flex-col overflow-y-auto divide-y divide-border/30 bg-muted/15">
            {activeCategory && (
              <div
                onClick={() => handleSelectParentOnly(activeCategory)}
                className={`flex items-center justify-between px-3.5 py-3 cursor-pointer transition-colors ${
                  selectedCategoryId === activeCategory.id && !selectedSubcategoryId
                    ? 'bg-primary/10 font-bold text-primary'
                    : 'hover:bg-muted/50 text-foreground'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-base shrink-0">{activeCategory.icon || '🏷️'}</span>
                  <span className="text-xs font-semibold truncate">General / All {activeCategory.name}</span>
                </div>
                {selectedCategoryId === activeCategory.id && !selectedSubcategoryId && (
                  <Check className="size-4 text-primary shrink-0" />
                )}
              </div>
            )}

            {activeSubcategories.map((sub) => {
              const isSelected = selectedSubcategoryId === sub.id;

              return (
                <div
                  key={sub.id}
                  onClick={() => activeCategory && handleSelectSubcategory(activeCategory, sub)}
                  className={`flex items-center justify-between px-3.5 py-3 cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-primary/10 font-bold text-primary'
                      : 'hover:bg-muted/50 text-foreground'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-sm shrink-0">{sub.icon || '•'}</span>
                    <span className="text-xs truncate">{sub.name}</span>
                  </div>
                  {isSelected && <Check className="size-4 text-primary shrink-0" />}
                </div>
              );
            })}

            {/* Quick Add Subcategory Button */}
            {activeCategory && (
              <div
                onClick={() => {
                  onOpenChange(false);
                  navigate(`/more/categories/${activeCategory.id}/subcategories`);
                }}
                className="flex items-center gap-2 px-3.5 py-3 text-xs font-semibold text-primary hover:bg-primary/5 cursor-pointer"
              >
                <Plus className="size-3.5" />
                <span>Add Subcategory</span>
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
