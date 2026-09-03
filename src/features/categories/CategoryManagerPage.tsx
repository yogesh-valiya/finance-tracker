import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCategoryStore } from './categoryStore';
import { useAuthStore } from '../auth/authStore';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  ArrowLeft,
  Plus,
  ChevronRight,
  Pencil,
  Trash2,
  ArrowUp,
  ArrowDown,
  Layers,
  Sparkles,
  Ban,
  Smile,
  Tag,
} from 'lucide-react';
import { toast } from 'sonner';
import type { Category } from '@/types';

const EMOJI_PALETTE = [
  '🍜', '🧑‍🤝‍🧑', '🐶', '🚖', '🖼️', '🪑', '👔', '💄', '🏥', '📚', '🏷️', '🎁',
  '💰', '💵', '🏅', '💸', '🤑', '💳', '📦', '☕', '🍔', '🎬', '✈️', '🏠',
  '⚡', '🛒', '🎮', '⚽', '💊', '🔧', '🎓', '🛡️', '🍕', '🍻', '🚲', '⛽',
  '🚌', '🚆', '📱', '💻', '💡', '🎵', '🏝️', '💐', '💎', '🎉', '💈', '🎂',
];

export const CategoryManagerPage: React.FC = () => {
  const navigate = useNavigate();
  const { preferences, updatePreferences } = useAuthStore();
  const {
    incomeCategories,
    expenseCategories,
    isLoading,
    fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    reorderCategories,
  } = useCategoryStore();

  const [activeTab, setActiveTab] = useState<'income' | 'expense'>('expense');

  // Add / Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [catName, setCatName] = useState('');
  const [catIcon, setCatIcon] = useState('🏷️');
  const [catType, setCatType] = useState<'income' | 'expense'>('expense');

  // Delete Alert State
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const enableSubcategories = preferences?.enable_subcategories ?? true;

  const handleToggleSubcategories = async () => {
    const nextVal = !enableSubcategories;
    await updatePreferences({ enable_subcategories: nextVal });
    toast.success(`Subcategories globally ${nextVal ? 'enabled' : 'disabled'}`);
  };

  const handleOpenAdd = () => {
    setEditingCategory(null);
    setCatName('');
    setCatIcon(activeTab === 'income' ? '💰' : '🍜');
    setCatType(activeTab);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cat: Category, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingCategory(cat);
    setCatName(cat.name);
    setCatIcon(cat.icon || '');
    setCatType(cat.type);
    setIsModalOpen(true);
  };

  const handleSaveCategory = async () => {
    if (!catName.trim()) {
      toast.error('Please enter a category name');
      return;
    }

    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, {
          name: catName.trim(),
          icon: catIcon.trim(),
        });
        toast.success(`Category "${catName}" updated!`);
      } else {
        await createCategory({
          name: catName.trim(),
          type: catType,
          icon: catIcon.trim(),
        });
        toast.success(`Category "${catName}" created!`);
      }
      setIsModalOpen(false);
    } catch {
      toast.error('Failed to save category');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingCategory) return;
    try {
      await deleteCategory(deletingCategory.id);
      toast.success(`Category "${deletingCategory.name}" deleted`);
      setDeletingCategory(null);
    } catch {
      toast.error('Failed to delete category');
    }
  };

  const handleMove = async (
    type: 'income' | 'expense',
    index: number,
    direction: 'up' | 'down',
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    const list = type === 'income' ? [...incomeCategories] : [...expenseCategories];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= list.length) return;

    const [moved] = list.splice(index, 1);
    list.splice(targetIndex, 0, moved);

    await reorderCategories(
      type,
      list.map((c) => c.id)
    );
  };

  const renderCategoryList = (categories: Category[], type: 'income' | 'expense') => {
    if (categories.length === 0 && !isLoading) {
      return (
        <Card className="border-border/60 p-6 text-center shadow-2xs">
          <Layers className="size-8 mx-auto text-muted-foreground/60 mb-2" />
          <h3 className="text-xs font-bold text-foreground">No {type} categories</h3>
          <p className="text-[11px] text-muted-foreground mt-1">
            Tap "+ Add Category" above to create your first category.
          </p>
        </Card>
      );
    }

    return (
      <div className="flex flex-col rounded-xl border border-border/60 bg-card divide-y divide-border/50 overflow-hidden shadow-2xs">
        {categories.map((cat, index) => {
          const subCount = cat.subcategories?.length || 0;
          const subPreview = cat.subcategories
            ?.slice(0, 3)
            .map((s) => (s.icon ? `${s.icon} ${s.name}` : s.name))
            .join(', ');

          return (
            <div
              key={cat.id}
              onClick={() => {
                if (enableSubcategories) {
                  navigate(`/more/categories/${cat.id}/subcategories`);
                }
              }}
              className={`flex items-center justify-between px-3.5 py-2.5 transition-colors ${
                enableSubcategories ? 'hover:bg-accent/40 cursor-pointer active:bg-accent/60' : ''
              }`}
            >
              {/* Icon & Title info */}
              <div className="flex items-center gap-3 flex-1 min-w-0 pr-2">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-secondary/80 text-base shadow-2xs font-semibold text-muted-foreground">
                  {cat.icon && cat.icon.trim() ? (
                    <span>{cat.icon}</span>
                  ) : (
                    <span className="text-xs font-mono font-bold text-foreground uppercase">
                      {cat.name.slice(0, 1) || '#'}
                    </span>
                  )}
                </div>

                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-foreground truncate">
                      {cat.name}
                    </span>
                    {enableSubcategories && subCount > 0 && (
                      <Badge variant="secondary" className="text-[9px] px-1 py-0 h-4 font-semibold text-muted-foreground">
                        {subCount}
                      </Badge>
                    )}
                  </div>

                  {enableSubcategories && subPreview && (
                    <span className="text-[10px] text-muted-foreground truncate leading-tight">
                      {subPreview}
                      {subCount > 3 ? ` +${subCount - 3} more` : ''}
                    </span>
                  )}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                {/* Reorder Buttons */}
                <Button
                  variant="ghost"
                  size="icon-xs"
                  disabled={index === 0}
                  onClick={(e) => handleMove(type, index, 'up', e)}
                  className="text-muted-foreground hover:text-foreground h-6 w-6"
                  title="Move Up"
                >
                  <ArrowUp className="size-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  disabled={index === categories.length - 1}
                  onClick={(e) => handleMove(type, index, 'down', e)}
                  className="text-muted-foreground hover:text-foreground h-6 w-6"
                  title="Move Down"
                >
                  <ArrowDown className="size-3" />
                </Button>

                {/* Edit */}
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={(e) => handleOpenEdit(cat, e)}
                  className="text-muted-foreground hover:text-primary h-6 w-6"
                  title="Edit Category"
                >
                  <Pencil className="size-3" />
                </Button>

                {/* Delete */}
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeletingCategory(cat);
                  }}
                  className="text-muted-foreground hover:text-destructive h-6 w-6"
                  title="Delete Category"
                >
                  <Trash2 className="size-3" />
                </Button>

                {/* Subcategory Navigation Chevron */}
                {enableSubcategories && (
                  <div className="pl-1 text-muted-foreground/60">
                    <ChevronRight className="size-3.5" />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-3.5 p-4 pt-4">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => navigate('/more/configuration')}
            className="text-muted-foreground hover:text-foreground -ml-2"
          >
            <ArrowLeft className="size-4" />
          </Button>
          <div>
            <h1 className="text-base font-bold text-foreground leading-tight">
              Category Settings
            </h1>
            <p className="text-[10px] text-muted-foreground">
              Manage Income & Expense classifications
            </p>
          </div>
        </div>

        <Button
          onClick={handleOpenAdd}
          size="sm"
          className="h-8 px-2.5 gap-1 text-xs font-semibold"
        >
          <Plus className="size-3.5" />
          Add
        </Button>
      </div>

      {/* Global Subcategories Toggle Banner */}
      <Card className="border-border/60 bg-muted/20 shadow-2xs">
        <CardContent className="flex items-center justify-between p-3">
          <div className="flex flex-col pr-2">
            <span className="text-xs font-semibold text-foreground">
              Enable Subcategories
            </span>
            <span className="text-[10px] text-muted-foreground">
              Toggle 2-tier subcategory hierarchy for transactions
            </span>
          </div>
          <Switch
            checked={enableSubcategories}
            onCheckedChange={handleToggleSubcategories}
            aria-label="Toggle Subcategories"
          />
        </CardContent>
      </Card>

      {/* Segmented Switcher: Income | Expense */}
      <Tabs
        value={activeTab}
        onValueChange={(val) => setActiveTab(val as 'income' | 'expense')}
        className="w-full"
      >
        <TabsList className="grid grid-cols-2 w-full h-9 bg-muted/60 p-0.5 border border-border/40">
          <TabsTrigger
            value="income"
            className="text-xs font-semibold data-[state=active]:bg-background data-[state=active]:text-income data-[state=active]:shadow-xs"
          >
            Income ({incomeCategories.length})
          </TabsTrigger>
          <TabsTrigger
            value="expense"
            className="text-xs font-semibold data-[state=active]:bg-background data-[state=active]:text-expense data-[state=active]:shadow-xs"
          >
            Expense ({expenseCategories.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="income" className="mt-3">
          {renderCategoryList(incomeCategories, 'income')}
        </TabsContent>

        <TabsContent value="expense" className="mt-3">
          {renderCategoryList(expenseCategories, 'expense')}
        </TabsContent>
      </Tabs>

      {/* Add / Edit Category Dialog Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-xs sm:max-w-sm rounded-2xl p-4 gap-4">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold">
              {editingCategory ? 'Edit Category' : `Add ${catType === 'income' ? 'Income' : 'Expense'} Category`}
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-3">
            {/* Name Input */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="catName" className="text-xs font-semibold">
                Category Name
              </Label>
              <Input
                id="catName"
                placeholder="e.g. Dining, Salary, Groceries"
                value={catName}
                onChange={(e) => setCatName(e.target.value)}
                className="h-9 text-xs"
                autoFocus
              />
            </div>

            {/* Custom Icon / Emoji & Remove Option */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold">
                  Category Icon
                </Label>
                <div className="flex items-center gap-1.5">
                  {catIcon ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="xs"
                      onClick={() => setCatIcon('')}
                      className="h-6 px-1.5 text-[10px] text-destructive hover:bg-destructive/10 gap-1"
                    >
                      <Ban className="size-3" />
                      Remove Icon
                    </Button>
                  ) : (
                    <Badge variant="outline" className="text-[9.5px] font-normal text-muted-foreground">
                      No Icon Selected
                    </Badge>
                  )}
                </div>
              </div>

              {/* Custom Input + Preview */}
              <div className="flex items-center gap-2">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-muted/40 text-lg shadow-2xs">
                  {catIcon || <Tag className="size-4 text-muted-foreground" />}
                </div>
                <Input
                  placeholder="Type any custom emoji or symbol (e.g. 🚀, ☕)"
                  value={catIcon}
                  onChange={(e) => setCatIcon(e.target.value)}
                  className="h-9 text-xs flex-1"
                />
              </div>

              {/* Quick Select Palette */}
              <span className="text-[10px] text-muted-foreground pt-1">
                Or pick from common icons:
              </span>
              <div className="grid grid-cols-8 gap-1 p-2 rounded-lg border border-border/60 bg-muted/20 max-h-32 overflow-y-auto">
                {EMOJI_PALETTE.map((emoji) => (
                  <Button
                    key={emoji}
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => setCatIcon(emoji)}
                    className={`flex size-7 items-center justify-center rounded text-sm p-0 transition-transform active:scale-90 ${
                      catIcon === emoji ? 'bg-primary/20 ring-1 ring-primary scale-110' : 'hover:bg-muted'
                    }`}
                  >
                    {emoji}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter className="flex flex-row justify-end gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsModalOpen(false)}
              className="h-8 text-xs font-semibold flex-1"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSaveCategory}
              className="h-8 text-xs font-semibold flex-1"
            >
              {editingCategory ? 'Save Changes' : 'Create Category'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Alert */}
      <AlertDialog
        open={!!deletingCategory}
        onOpenChange={(open) => !open && setDeletingCategory(null)}
      >
        <AlertDialogContent className="max-w-xs rounded-2xl p-4 gap-3">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-sm font-bold">
              Delete "{deletingCategory?.name}"?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground">
              This will permanently delete this category and any subcategories under it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-row justify-end gap-2">
            <AlertDialogCancel className="h-8 text-xs font-semibold flex-1">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="h-8 text-xs font-semibold flex-1 bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
