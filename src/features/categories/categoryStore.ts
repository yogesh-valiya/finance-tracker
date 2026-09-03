import { create } from 'zustand';
import { collections, pb } from '@/lib/pocketbase';
import type { Category, Subcategory } from '@/types';

interface CategoryState {
  incomeCategories: Category[];
  expenseCategories: Category[];
  isLoading: boolean;
  error: string | null;

  fetchCategories: () => Promise<void>;
  createCategory: (params: { name: string; type: 'income' | 'expense'; icon?: string }) => Promise<Category>;
  updateCategory: (id: string, partial: Partial<Category>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  reorderCategories: (type: 'income' | 'expense', categoryIds: string[]) => Promise<void>;

  createSubcategory: (categoryId: string, name: string, icon?: string) => Promise<Subcategory>;
  updateSubcategory: (id: string, partial: { name?: string; icon?: string }) => Promise<void>;
  deleteSubcategory: (id: string) => Promise<void>;
  reorderSubcategories: (categoryId: string, subcategoryIds: string[]) => Promise<void>;
}

export const useCategoryStore = create<CategoryState>((set, get) => ({
  incomeCategories: [],
  expenseCategories: [],
  isLoading: false,
  error: null,

  fetchCategories: async () => {
    const userId = pb.authStore.model?.id;
    if (!userId) return;

    set({ isLoading: true, error: null });
    try {
      const [cats, subcats] = await Promise.all([
        collections.categories().getFullList({
          filter: `user = "${userId}"`,
          sort: 'order',
        }),
        collections.subcategories().getFullList({
          filter: `user = "${userId}"`,
          sort: 'order',
        }),
      ]);

      const subcatMap = new Map<string, Subcategory[]>();
      for (const sub of subcats) {
        const list = subcatMap.get(sub.category) || [];
        list.push(sub);
        subcatMap.set(sub.category, list);
      }

      const categoriesWithSubs = cats.map((cat) => ({
        ...cat,
        subcategories: (subcatMap.get(cat.id) || []).sort((a, b) => a.order - b.order),
      }));

      const incomeCategories = categoriesWithSubs.filter((c) => c.type === 'income');
      const expenseCategories = categoriesWithSubs.filter((c) => c.type === 'expense');

      set({ incomeCategories, expenseCategories, isLoading: false });
    } catch (err: any) {
      console.error('Error fetching categories:', err);
      set({ error: err.message || 'Failed to load categories', isLoading: false });
    }
  },

  createCategory: async ({ name, type, icon = '🏷️' }) => {
    const userId = pb.authStore.model?.id;
    if (!userId) throw new Error('Unauthenticated user');

    const currentList = type === 'income' ? get().incomeCategories : get().expenseCategories;
    const nextOrder = currentList.length;

    const created = await collections.categories().create({
      user: userId,
      name: name.trim(),
      type,
      icon,
      order: nextOrder,
    });

    const categoryWithSubs: Category = {
      ...created,
      subcategories: [],
    };

    if (type === 'income') {
      set({ incomeCategories: [...get().incomeCategories, categoryWithSubs] });
    } else {
      set({ expenseCategories: [...get().expenseCategories, categoryWithSubs] });
    }

    return categoryWithSubs;
  },

  updateCategory: async (id, partial) => {
    const data: Record<string, any> = {};
    if (partial.name !== undefined) data.name = partial.name.trim();
    if (partial.icon !== undefined) data.icon = partial.icon || '';
    if (partial.order !== undefined) data.order = partial.order;
    if (partial.type !== undefined) data.type = partial.type;
    await collections.categories().update(id, data);
    await get().fetchCategories();
  },

  deleteCategory: async (id) => {
    // Delete category and let PocketBase cascade delete associated subcategories
    await collections.categories().delete(id);
    set({
      incomeCategories: get().incomeCategories.filter((c) => c.id !== id),
      expenseCategories: get().expenseCategories.filter((c) => c.id !== id),
    });
  },

  reorderCategories: async (type, categoryIds) => {
    const currentList = type === 'income' ? get().incomeCategories : get().expenseCategories;
    const reordered = categoryIds
      .map((id, index) => {
        const item = currentList.find((c) => c.id === id);
        return item ? { ...item, order: index } : null;
      })
      .filter((Boolean as unknown) as (x: any) => x is Category);

    if (type === 'income') {
      set({ incomeCategories: reordered });
    } else {
      set({ expenseCategories: reordered });
    }

    // Persist orders in background
    Promise.all(
      categoryIds.map((id, index) =>
        collections.categories().update(id, { order: index })
      )
    ).catch((err) => console.error('Error persisting category order:', err));
  },

  createSubcategory: async (categoryId, name, icon = '') => {
    const userId = pb.authStore.model?.id;
    if (!userId) throw new Error('Unauthenticated user');

    const parentCat = [...get().incomeCategories, ...get().expenseCategories].find(
      (c) => c.id === categoryId
    );
    const nextOrder = parentCat?.subcategories?.length || 0;

    const created = await collections.subcategories().create({
      user: userId,
      category: categoryId,
      name: name.trim(),
      icon: icon || '',
      order: nextOrder,
    });

    await get().fetchCategories();
    return created;
  },

  updateSubcategory: async (id, partial) => {
    const data: Record<string, any> = {};
    if (partial.name !== undefined) data.name = partial.name.trim();
    if (partial.icon !== undefined) data.icon = partial.icon;
    await collections.subcategories().update(id, data);
    await get().fetchCategories();
  },

  deleteSubcategory: async (id) => {
    await collections.subcategories().delete(id);
    await get().fetchCategories();
  },

  reorderSubcategories: async (categoryId, subcategoryIds) => {
    Promise.all(
      subcategoryIds.map((id, index) =>
        collections.subcategories().update(id, { order: index })
      )
    )
      .then(() => get().fetchCategories())
      .catch((err) => console.error('Error persisting subcategory order:', err));
  },
}));
