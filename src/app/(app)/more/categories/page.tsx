"use client";

import * as React from "react";
import Link from "next/link";
import { Category, Subcategory, CategoryType } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  ArrowLeft,
  FolderTree,
  Plus,
  Trash2,
  Edit2,
  ChevronUp,
  ChevronDown,
  ChevronRight,
  Layers,
  Loader2,
  Check,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CategoryWithSubs extends Category {
  subcategories: Subcategory[];
}

const COMMON_EMOJIS = [
  "💰", "💼", "📈", "🎁", "💵", "🍔", "🏠", "🚗", "🛍️", "🏥",
  "🎬", "📚", "💳", "🐾", "✈️", "☕", "🎮", "💡", "🛠️", "📦"
];

export default function CategoriesPage() {
  const [categories, setCategories] = React.useState<CategoryWithSubs[]>([]);
  const [activeTab, setActiveTab] = React.useState<CategoryType>("EXPENSE");
  const [subcategoryEnabled, setSubcategoryEnabled] = React.useState(true);
  const [isLoading, setIsLoading] = React.useState(true);

  // Category Dialog
  const [catDialogOpen, setCatDialogOpen] = React.useState(false);
  const [editingCategory, setEditingCategory] = React.useState<CategoryWithSubs | null>(null);
  const [catName, setCatName] = React.useState("");
  const [catEmoji, setCatEmoji] = React.useState("📁");
  const [isSavingCat, setIsSavingCat] = React.useState(false);

  // Subcategory Manager Dialog
  const [subManagerCategory, setSubManagerCategory] = React.useState<CategoryWithSubs | null>(null);
  const [newSubName, setNewSubName] = React.useState("");
  const [editingSub, setEditingSub] = React.useState<Subcategory | null>(null);
  const [editSubName, setEditSubName] = React.useState("");

  // Category Deletion & Reassignment Dialog
  const [deleteCat, setDeleteCat] = React.useState<CategoryWithSubs | null>(null);
  const [linkedCount, setLinkedCount] = React.useState<number>(0);
  const [reassignCatId, setReassignCatId] = React.useState<string>("");
  const [isDeletingCat, setIsDeletingCat] = React.useState(false);
  const [deleteError, setDeleteError] = React.useState("");

  const fetchCategories = React.useCallback(async () => {
    try {
      setIsLoading(true);
      const [resCats, resSettings] = await Promise.all([
        fetch("/api/categories"),
        fetch("/api/settings"),
      ]);

      if (resCats.ok) {
        const data = await resCats.json();
        setCategories(data.all || []);
      }
      if (resSettings.ok) {
        const data = await resSettings.json();
        setSubcategoryEnabled(data.subcategoryEnabled ?? true);
      }
    } catch (err) {
      console.error("Failed to load categories:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleToggleSubcategoryMaster = async (checked: boolean) => {
    setSubcategoryEnabled(checked);
    try {
      await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subcategoryEnabled: checked }),
      });
    } catch (err) {
      console.error("Failed to update subcategory setting:", err);
    }
  };

  const openAddCategory = () => {
    setEditingCategory(null);
    setCatName("");
    setCatEmoji(activeTab === "INCOME" ? "💰" : "🍔");
    setCatDialogOpen(true);
  };

  const openEditCategory = (cat: CategoryWithSubs) => {
    setEditingCategory(cat);
    setCatName(cat.name);
    setCatEmoji(cat.emoji);
    setCatDialogOpen(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) return;

    try {
      setIsSavingCat(true);
      if (editingCategory) {
        const res = await fetch(`/api/categories/${editingCategory.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: catName.trim(), emoji: catEmoji }),
        });
        if (res.ok) {
          setCatDialogOpen(false);
          fetchCategories();
        }
      } else {
        const res = await fetch("/api/categories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: catName.trim(),
            emoji: catEmoji,
            type: activeTab,
          }),
        });
        if (res.ok) {
          setCatDialogOpen(false);
          fetchCategories();
        }
      }
    } catch (err) {
      console.error("Failed to save category:", err);
    } finally {
      setIsSavingCat(false);
    }
  };

  const handleMoveCategory = async (index: number, direction: "up" | "down") => {
    const list = categories.filter((c) => c.type === activeTab);
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= list.length) return;

    const reordered = [...list];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIdx, 0, moved);

    // Optimistically update
    const otherType = categories.filter((c) => c.type !== activeTab);
    setCategories([...reordered, ...otherType]);

    try {
      await fetch("/api/categories/reorder", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categoryIds: reordered.map((c) => c.id) }),
      });
    } catch (err) {
      console.error("Failed to reorder categories:", err);
      fetchCategories();
    }
  };

  const initiateDeleteCategory = async (cat: CategoryWithSubs) => {
    setDeleteCat(cat);
    setDeleteError("");
    setReassignCatId("");
    // Check if category has transactions
    try {
      const res = await fetch(`/api/categories/${cat.id}`, { method: "DELETE" });
      if (res.status === 409) {
        const data = await res.json();
        setLinkedCount(data.transactionCount || 0);
        // Find first other category of same type to default reassign
        const alternative = categories.find((c) => c.id !== cat.id && c.type === cat.type);
        if (alternative) setReassignCatId(alternative.id);
      } else if (res.ok) {
        setDeleteCat(null);
        fetchCategories();
      }
    } catch (err) {
      console.error("Error initiating category delete:", err);
    }
  };

  const confirmReassignedDelete = async () => {
    if (!deleteCat) return;
    try {
      setIsDeletingCat(true);
      const res = await fetch(`/api/categories/${deleteCat.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reassignToCategoryId: reassignCatId }),
      });
      if (res.ok) {
        setDeleteCat(null);
        fetchCategories();
      } else {
        const data = await res.json();
        setDeleteError(data.error || "Failed to reassign and delete");
      }
    } catch (err) {
      setDeleteError("Failed to reassign and delete category");
    } finally {
      setIsDeletingCat(false);
    }
  };

  // Subcategory management actions
  const handleAddSubcategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subManagerCategory || !newSubName.trim()) return;

    try {
      const res = await fetch(`/api/categories/${subManagerCategory.id}/subcategories`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newSubName.trim() }),
      });
      if (res.ok) {
        const created = await res.json();
        const updatedCat = {
          ...subManagerCategory,
          subcategories: [...subManagerCategory.subcategories, created],
        };
        setSubManagerCategory(updatedCat);
        setCategories((prev) =>
          prev.map((c) => (c.id === updatedCat.id ? updatedCat : c))
        );
        setNewSubName("");
      }
    } catch (err) {
      console.error("Failed to add subcategory:", err);
    }
  };

  const handleUpdateSubcategory = async (subId: string) => {
    if (!subManagerCategory || !editSubName.trim()) return;
    try {
      const res = await fetch(
        `/api/categories/${subManagerCategory.id}/subcategories/${subId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: editSubName.trim() }),
        }
      );
      if (res.ok) {
        const updated = await res.json();
        const updatedCat = {
          ...subManagerCategory,
          subcategories: subManagerCategory.subcategories.map((s) =>
            s.id === subId ? updated : s
          ),
        };
        setSubManagerCategory(updatedCat);
        setCategories((prev) =>
          prev.map((c) => (c.id === updatedCat.id ? updatedCat : c))
        );
        setEditingSub(null);
      }
    } catch (err) {
      console.error("Failed to update subcategory:", err);
    }
  };

  const handleDeleteSubcategory = async (subId: string) => {
    if (!subManagerCategory) return;
    try {
      const res = await fetch(
        `/api/categories/${subManagerCategory.id}/subcategories/${subId}`,
        { method: "DELETE" }
      );
      if (res.ok) {
        const updatedCat = {
          ...subManagerCategory,
          subcategories: subManagerCategory.subcategories.filter((s) => s.id !== subId),
        };
        setSubManagerCategory(updatedCat);
        setCategories((prev) =>
          prev.map((c) => (c.id === updatedCat.id ? updatedCat : c))
        );
      }
    } catch (err) {
      console.error("Failed to delete subcategory:", err);
    }
  };

  const currentList = categories.filter((c) => c.type === activeTab);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <Link href="/more" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <FolderTree className="size-5 text-primary" />
              Category Management
            </h1>
            <p className="text-xs text-muted-foreground">
              Manage custom categories, subcategories, icons, and hierarchy
            </p>
          </div>
        </div>

        <Button size="sm" onClick={openAddCategory} className="text-xs gap-1.5 h-9">
          <Plus className="size-4" />
          Add Category
        </Button>
      </div>

      {/* Subcategory Master Toggle Banner */}
      <div className="flex items-center justify-between p-3 rounded-xl border border-border bg-muted/30">
        <div className="flex items-center gap-2.5">
          <Layers className="size-4 text-primary" />
          <div>
            <div className="text-xs font-semibold text-foreground">
              Two-Tier Subcategories
            </div>
            <div className="text-[11px] text-muted-foreground">
              Enable subcategories under parent categories across entry and filters
            </div>
          </div>
        </div>
        <Switch
          checked={subcategoryEnabled}
          onCheckedChange={handleToggleSubcategoryMaster}
          aria-label="Toggle subcategories"
        />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as CategoryType)}>
        <div className="flex items-center justify-between border-b border-border pb-2">
          <TabsList className="grid grid-cols-2 w-64 h-8">
            <TabsTrigger value="EXPENSE" className="text-xs">
              Expense Categories
            </TabsTrigger>
            <TabsTrigger value="INCOME" className="text-xs">
              Income Categories
            </TabsTrigger>
          </TabsList>
          <div className="text-xs text-muted-foreground">
            {currentList.length} categories
          </div>
        </div>

        <TabsContent value={activeTab} className="mt-4">
          {isLoading ? (
            <div className="flex items-center justify-center p-12 text-muted-foreground">
              <Loader2 className="size-6 animate-spin mr-2" />
              <span>Loading classifications...</span>
            </div>
          ) : currentList.length === 0 ? (
            <Card className="border-border">
              <CardContent className="flex flex-col items-center justify-center p-12 text-center">
                <FolderTree className="size-10 text-muted-foreground mb-2" />
                <h3 className="font-semibold text-sm">No categories found</h3>
                <p className="text-xs text-muted-foreground max-w-xs mt-1 mb-4">
                  Create your first {activeTab.toLowerCase()} category to organize transactions.
                </p>
                <Button size="sm" onClick={openAddCategory} className="text-xs gap-1.5">
                  <Plus className="size-4" />
                  Add Category
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {currentList.map((cat, index) => (
                <div
                  key={cat.id}
                  className="flex flex-col p-3 rounded-xl border border-border bg-card hover:bg-muted/10 transition-colors gap-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {/* Reorder Buttons */}
                      <div className="flex flex-col -my-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-xs"
                          disabled={index === 0}
                          onClick={() => handleMoveCategory(index, "up")}
                          className="text-muted-foreground hover:text-foreground disabled:opacity-20 size-5 p-0"
                        >
                          <ChevronUp className="size-3.5" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-xs"
                          disabled={index === currentList.length - 1}
                          onClick={() => handleMoveCategory(index, "down")}
                          className="text-muted-foreground hover:text-foreground disabled:opacity-20 size-5 p-0"
                        >
                          <ChevronDown className="size-3.5" />
                        </Button>
                      </div>

                      <span className="text-xl select-none">{cat.emoji}</span>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-foreground">
                            {cat.name}
                          </span>
                          {cat.subcategories.length > 0 && (
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                              {cat.subcategories.length} subs
                            </Badge>
                          )}
                        </div>
                        {cat.subcategories.length > 0 && (
                          <div className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                            {cat.subcategories.map((s) => s.name).join(" · ")}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {subcategoryEnabled && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSubManagerCategory(cat);
                            setNewSubName("");
                            setEditingSub(null);
                          }}
                          className="h-8 text-xs text-muted-foreground hover:text-foreground gap-1 px-2"
                        >
                          <Layers className="size-3.5" />
                          <span className="hidden sm:inline">Subcategories</span>
                        </Button>
                      )}

                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-muted-foreground hover:text-foreground"
                        onClick={() => openEditCategory(cat)}
                      >
                        <Edit2 className="size-3.5" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-destructive hover:text-destructive"
                        onClick={() => initiateDeleteCategory(cat)}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Add / Edit Category Dialog */}
      <Dialog open={catDialogOpen} onOpenChange={setCatDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">
              {editingCategory ? "Edit Category" : `New ${activeTab === "INCOME" ? "Income" : "Expense"} Category`}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Choose an icon and a unique title for this classification.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveCategory} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Category Emoji</Label>
              <div className="flex items-center gap-2">
                <div className="size-11 rounded-lg border border-border flex items-center justify-center text-2xl bg-muted/30">
                  {catEmoji}
                </div>
                <div className="flex-1 flex flex-wrap gap-1 max-h-24 overflow-y-auto p-1.5 rounded-lg border border-border">
                  {COMMON_EMOJIS.map((emoji) => (
                    <Button
                      key={emoji}
                      type="button"
                      variant={catEmoji === emoji ? "secondary" : "ghost"}
                      size="icon-xs"
                      onClick={() => setCatEmoji(emoji)}
                      className={cn(
                        "size-7 text-base",
                        catEmoji === emoji && "ring-1 ring-primary"
                      )}
                    >
                      {emoji}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Category Name</Label>
              <Input
                type="text"
                placeholder="e.g. Subscriptions, Groceries"
                value={catName}
                onChange={(e) => setCatName(e.target.value)}
                className="h-9 text-xs"
                required
                autoFocus
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setCatDialogOpen(false)}
                className="h-8 text-xs"
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={isSavingCat} className="h-8 text-xs gap-1.5">
                {isSavingCat && <Loader2 className="size-3.5 animate-spin" />}
                {editingCategory ? "Update" : "Create"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Subcategory Manager Dialog */}
      <Dialog
        open={!!subManagerCategory}
        onOpenChange={(open) => !open && setSubManagerCategory(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold flex items-center gap-2">
              <span>{subManagerCategory?.emoji}</span>
              <span>{subManagerCategory?.name} — Subcategories</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Create and manage fine-grained classifications under this category.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            {/* Add Subcategory Form */}
            <form onSubmit={handleAddSubcategory} className="flex items-center gap-2">
              <Input
                type="text"
                placeholder="Add new subcategory..."
                value={newSubName}
                onChange={(e) => setNewSubName(e.target.value)}
                className="h-8 text-xs flex-1"
              />
              <Button type="submit" size="sm" className="h-8 text-xs gap-1">
                <Plus className="size-3.5" />
                Add
              </Button>
            </form>

            {/* Subcategories List */}
            <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
              {subManagerCategory?.subcategories.length === 0 ? (
                <div className="text-center py-6 text-xs text-muted-foreground">
                  No subcategories created yet. Add one above!
                </div>
              ) : (
                subManagerCategory?.subcategories.map((sub) => (
                  <div
                    key={sub.id}
                    className="flex items-center justify-between p-2 rounded-lg border border-border bg-muted/20 text-xs"
                  >
                    {editingSub?.id === sub.id ? (
                      <div className="flex items-center gap-1.5 flex-1 mr-2">
                        <Input
                          type="text"
                          value={editSubName}
                          onChange={(e) => setEditSubName(e.target.value)}
                          className="h-7 text-xs"
                          autoFocus
                        />
                        <Button
                          size="sm"
                          onClick={() => handleUpdateSubcategory(sub.id)}
                          className="h-7 px-2 text-xs"
                        >
                          <Check className="size-3" />
                        </Button>
                      </div>
                    ) : (
                      <span className="font-medium text-foreground">{sub.name}</span>
                    )}

                    <div className="flex items-center gap-1">
                      {editingSub?.id !== sub.id && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-6 text-muted-foreground hover:text-foreground"
                          onClick={() => {
                            setEditingSub(sub);
                            setEditSubName(sub.name);
                          }}
                        >
                          <Edit2 className="size-3" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-6 text-destructive hover:text-destructive"
                        onClick={() => handleDeleteSubcategory(sub.id)}
                      >
                        <Trash2 className="size-3" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Category Collision / Reassignment Dialog */}
      <AlertDialog open={!!deleteCat && linkedCount > 0} onOpenChange={(open) => !open && setDeleteCat(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base flex items-center gap-2 text-destructive">
              <AlertTriangle className="size-5" />
              Category Has Linked Transactions
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs space-y-2">
              <p>
                <strong>{deleteCat?.name}</strong> is currently assigned to{" "}
                <strong>{linkedCount} transaction(s)</strong>.
              </p>
              <p>
                To maintain ledger integrity per accounting standards (§9.2), please select a replacement category to reassign these transactions to before deletion:
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>

          {deleteError && (
            <div className="text-xs text-destructive bg-destructive/10 p-2 rounded">
              {deleteError}
            </div>
          )}

          <div className="space-y-1.5 my-2">
            <Label className="text-xs">Reassign Transactions To</Label>
            <Select value={reassignCatId} onValueChange={(val) => val && setReassignCatId(val)}>
              <SelectTrigger className="w-full h-9 text-xs">
                <SelectValue placeholder="Select Category" />
              </SelectTrigger>
              <SelectContent>
                {categories
                  .filter((c) => c.id !== deleteCat?.id && c.type === deleteCat?.type)
                  .map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.emoji} {cat.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel className="text-xs">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmReassignedDelete}
              disabled={isDeletingCat || !reassignCatId}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 text-xs gap-1"
            >
              {isDeletingCat && <Loader2 className="size-3 animate-spin" />}
              Reassign & Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
