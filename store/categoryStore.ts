import { create } from 'zustand'
import { Category } from '@/lib/validations/category'

interface CategoryStore {
  categories: Category[]
  currentCategory: Category | null
  isLoading: boolean
  error: string | null
  searchQuery: string
  setCategories: (categories: Category[]) => void
  setCurrentCategory: (category: Category | null) => void
  addCategory: (category: Category) => void
  updateCategory: (id: string, category: Category) => void
  removeCategory: (id: string) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  setSearchQuery: (query: string) => void
}

export const useCategoryStore = create<CategoryStore>((set) => ({
  categories: [],
  currentCategory: null,
  isLoading: false,
  error: null,
  searchQuery: '',
  setCategories: (categories) => set({ categories }),
  setCurrentCategory: (category) => set({ currentCategory: category }),
  addCategory: (category) =>
    set((state) => ({ categories: [...state.categories, category] })),
  updateCategory: (id, updatedCategory) =>
    set((state) => ({
      categories: state.categories.map((c) => (c.id === id ? updatedCategory : c)),
    })),
  removeCategory: (id) =>
    set((state) => ({
      categories: state.categories.filter((c) => c.id !== id),
    })),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  setSearchQuery: (query) => set({ searchQuery: query }),
}))
