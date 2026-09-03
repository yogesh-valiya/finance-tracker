import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCategoryStore } from './categoryStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
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
  Pencil,
  Trash2,
  ArrowUp,
  ArrowDown,
  Layers,
  Ban,
  Tag,
} from 'lucide-react';
import { toast } from 'sonner';
import type { Subcategory } from '@/types';

const EMOJI_PALETTE = [
  '🍜', '🍱', '🍔', '🍕', '☕', '🍻', '🍷', '🍨', '🍿', '🛒', '🛍️', '👔',
  '👟', '💄', '💊', '🚖', '⛽', '🚌', '🚆', '✈️', '🚲', '🏠', '⚡', '💧',
  '📶', '📱', '💻', '🎮', '🎬', '🎵', '📚', '🎓', '🏥', '🐶', '🎁', '💎',
  '💈', '🎂', '🥪', '🥗', '🥩', '🍩', '🥑', '🚗', '🚕', '🛴', '🏨', '🏖️',
];

export const SubcategoryManagerPage: React.FC = () => {
  const { categoryId } = useParams<{ categoryId: string }>();
  const navigate = useNavigate();
  const {
    incomeCategories,
    expenseCategories,
    fetchCategories,
    createSubcategory,
    updateSubcategory,
    deleteSubcategory,
    reorderSubcategories,
  } = useCategoryStore();

  // Add Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newSubName, setNewSubName] = useState('');
  const [newSubIcon, setNewSubIcon] = useState('');

  // Edit Modal State
  const [editingSub, setEditingSub] = useState<Subcategory | null>(null);
  const [editingName, setEditingName] = useState('');
  const [editingIcon, setEditingIcon] = useState('');

  // Delete State
  const [deletingSub, setDeletingSub] = useState<Subcategory | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Find parent category
  const allCategories = [...incomeCategories, ...expenseCategories];
  const parentCategory = allCategories.find((c) => c.id === categoryId);
  const subcategories = parentCategory?.subcategories || [];

  const handleOpenAdd = () => {
    setNewSubName('');
    setNewSubIcon('');
    setIsAddModalOpen(true);
  };

  const handleCreateSubcategory = async () => {
    if (!categoryId || !newSubName.trim()) {
      toast.error('Please enter a subcategory name');
      return;
    }

    setIsSubmitting(true);
    try {
      await createSubcategory(categoryId, newSubName.trim(), newSubIcon.trim());
      toast.success(`Subcategory "${newSubName.trim()}" created!`);
      setIsAddModalOpen(false);
    } catch {
      toast.error('Failed to create subcategory');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenEdit = (sub: Subcategory) => {
    setEditingSub(sub);
    setEditingName(sub.name);
    setEditingIcon(sub.icon || '');
  };

  const handleSaveEdit = async () => {
    if (!editingSub || !editingName.trim()) return;
    try {
      await updateSubcategory(editingSub.id, {
        name: editingName.trim(),
        icon: editingIcon.trim(),
      });
      toast.success('Subcategory updated');
      setEditingSub(null);
    } catch {
      toast.error('Failed to update subcategory');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingSub) return;
    try {
      await deleteSubcategory(deletingSub.id);
      toast.success(`Subcategory "${deletingSub.name}" deleted`);
      setDeletingSub(null);
    } catch {
      toast.error('Failed to delete subcategory');
    }
  };

  const handleMove = async (index: number, direction: 'up' | 'down') => {
    if (!categoryId) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= subcategories.length) return;

    const list = [...subcategories];
    const [moved] = list.splice(index, 1);
    list.splice(targetIndex, 0, moved);

    await reorderSubcategories(
      categoryId,
      list.map((s) => s.id)
    );
  };

  return (
    <div className="flex flex-col gap-4 p-4 pt-4">
      {/* Top Navigation Header with + Add Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => navigate('/more/categories')}
            className="text-muted-foreground hover:text-foreground -ml-2"
          >
            <ArrowLeft className="size-4" />
          </Button>
          <div className="flex items-center gap-2">
            <span className="text-xl">{parentCategory?.icon || '📁'}</span>
            <div>
              <h1 className="text-sm font-bold text-foreground leading-tight">
                {parentCategory?.name || 'Category'} Subcategories
              </h1>
              <p className="text-[10px] text-muted-foreground">
                {subcategories.length} subcategories configured
              </p>
            </div>
          </div>
        </div>

        {/* + Add Button in top-right header */}
        <Button
          onClick={handleOpenAdd}
          size="sm"
          className="h-8 px-2.5 gap-1 text-xs font-semibold"
        >
          <Plus className="size-3.5" />
          Add
        </Button>
      </div>

      {/* Subcategory List */}
      {subcategories.length === 0 ? (
        <Card className="border-border/60 p-8 text-center shadow-2xs">
          <Layers className="size-9 mx-auto text-muted-foreground/60 mb-2" />
          <h3 className="text-xs font-bold text-foreground">No Subcategories Configured</h3>
          <p className="text-[11px] text-muted-foreground mt-1 max-w-[240px] mx-auto">
            Tap the "+ Add" button above to add your first subcategory under {parentCategory?.name}.
          </p>
        </Card>
      ) : (
        <div className="flex flex-col rounded-xl border border-border/60 bg-card divide-y divide-border/50 overflow-hidden shadow-2xs">
          {subcategories.map((sub, index) => (
            <div
              key={sub.id}
              className="flex items-center justify-between px-3.5 py-2.5 hover:bg-accent/40 transition-colors"
            >
              <div className="flex items-center gap-2.5 flex-1 min-w-0 pr-2">
                <span className="text-[10px] font-mono text-muted-foreground w-4 text-center shrink-0">
                  {index + 1}
                </span>

                <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-secondary/80 text-sm shadow-2xs font-semibold text-muted-foreground">
                  {sub.icon && sub.icon.trim() ? (
                    <span>{sub.icon}</span>
                  ) : (
                    <span className="text-[11px] font-mono font-bold text-foreground uppercase">
                      {sub.name.slice(0, 1) || '#'}
                    </span>
                  )}
                </div>

                <span className="text-xs font-semibold text-foreground truncate">
                  {sub.name}
                </span>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  variant="ghost"
                  size="icon-xs"
                  disabled={index === 0}
                  onClick={() => handleMove(index, 'up')}
                  className="text-muted-foreground hover:text-foreground h-6 w-6"
                  title="Move Up"
                >
                  <ArrowUp className="size-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  disabled={index === subcategories.length - 1}
                  onClick={() => handleMove(index, 'down')}
                  className="text-muted-foreground hover:text-foreground h-6 w-6"
                  title="Move Down"
                >
                  <ArrowDown className="size-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => handleOpenEdit(sub)}
                  className="text-muted-foreground hover:text-primary h-6 w-6"
                  title="Edit Subcategory"
                >
                  <Pencil className="size-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => setDeletingSub(sub)}
                  className="text-muted-foreground hover:text-destructive h-6 w-6"
                  title="Delete Subcategory"
                >
                  <Trash2 className="size-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Subcategory Modal Dialog */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="max-w-xs sm:max-w-sm rounded-2xl p-4 gap-4">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold">
              Add Subcategory to {parentCategory?.name}
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-3">
            {/* Name Input */}
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-semibold">Subcategory Name</Label>
              <Input
                value={newSubName}
                onChange={(e) => setNewSubName(e.target.value)}
                placeholder="e.g. Lunch, Dinner, Groceries"
                className="h-9 text-xs"
                autoFocus
              />
            </div>

            {/* Custom Icon & Remove Option */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold">Subcategory Icon</Label>
                {newSubIcon ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="xs"
                    onClick={() => setNewSubIcon('')}
                    className="h-6 px-1.5 text-[10px] text-destructive hover:bg-destructive/10 gap-1"
                  >
                    <Ban className="size-3" />
                    Remove Icon
                  </Button>
                ) : (
                  <Badge variant="outline" className="text-[9.5px] font-normal text-muted-foreground">
                    Optional
                  </Badge>
                )}
              </div>

              {/* Custom Input + Preview */}
              <div className="flex items-center gap-2">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-muted/40 text-lg shadow-2xs">
                  {newSubIcon || <Tag className="size-4 text-muted-foreground" />}
                </div>
                <Input
                  placeholder="Type any custom emoji or symbol"
                  value={newSubIcon}
                  onChange={(e) => setNewSubIcon(e.target.value)}
                  className="h-9 text-xs flex-1"
                />
              </div>

              {/* Quick Select Palette */}
              <div className="grid grid-cols-8 gap-1 p-2 rounded-lg border border-border/60 bg-muted/20 max-h-32 overflow-y-auto">
                {EMOJI_PALETTE.map((emoji) => (
                  <Button
                    key={emoji}
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => setNewSubIcon(emoji)}
                    className={`flex size-7 items-center justify-center rounded text-sm p-0 transition-transform active:scale-90 ${
                      newSubIcon === emoji ? 'bg-primary/20 ring-1 ring-primary scale-110' : 'hover:bg-muted'
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
              onClick={() => setIsAddModalOpen(false)}
              className="h-8 text-xs font-semibold flex-1"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleCreateSubcategory}
              disabled={isSubmitting}
              className="h-8 text-xs font-semibold flex-1"
            >
              Create Subcategory
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Subcategory Modal */}
      <Dialog open={!!editingSub} onOpenChange={(open) => !open && setEditingSub(null)}>
        <DialogContent className="max-w-xs sm:max-w-sm rounded-2xl p-4 gap-4">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold">Edit Subcategory</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-3">
            {/* Name Input */}
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-semibold">Subcategory Name</Label>
              <Input
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                placeholder="Subcategory Name"
                className="h-9 text-xs"
                autoFocus
              />
            </div>

            {/* Custom Icon & Remove Option */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold">Subcategory Icon</Label>
                {editingIcon ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="xs"
                    onClick={() => setEditingIcon('')}
                    className="h-6 px-1.5 text-[10px] text-destructive hover:bg-destructive/10 gap-1"
                  >
                    <Ban className="size-3" />
                    Remove Icon
                  </Button>
                ) : (
                  <Badge variant="outline" className="text-[9.5px] font-normal text-muted-foreground">
                    No Icon
                  </Badge>
                )}
              </div>

              {/* Custom Input + Preview */}
              <div className="flex items-center gap-2">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-muted/40 text-lg shadow-2xs">
                  {editingIcon || <Tag className="size-4 text-muted-foreground" />}
                </div>
                <Input
                  placeholder="Type any custom emoji or symbol"
                  value={editingIcon}
                  onChange={(e) => setEditingIcon(e.target.value)}
                  className="h-9 text-xs flex-1"
                />
              </div>

              {/* Quick Select Palette */}
              <div className="grid grid-cols-8 gap-1 p-2 rounded-lg border border-border/60 bg-muted/20 max-h-32 overflow-y-auto">
                {EMOJI_PALETTE.map((emoji) => (
                  <Button
                    key={emoji}
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => setEditingIcon(emoji)}
                    className={`flex size-7 items-center justify-center rounded text-sm p-0 transition-transform active:scale-90 ${
                      editingIcon === emoji ? 'bg-primary/20 ring-1 ring-primary scale-110' : 'hover:bg-muted'
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
              onClick={() => setEditingSub(null)}
              className="h-8 text-xs font-semibold flex-1"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSaveEdit}
              className="h-8 text-xs font-semibold flex-1"
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Alert */}
      <AlertDialog
        open={!!deletingSub}
        onOpenChange={(open) => !open && setDeletingSub(null)}
      >
        <AlertDialogContent className="max-w-xs rounded-2xl p-4 gap-3">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-sm font-bold">
              Delete "{deletingSub?.name}"?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground">
              Are you sure you want to remove this subcategory?
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
