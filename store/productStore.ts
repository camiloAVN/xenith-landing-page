import { create } from 'zustand'
import { Product } from '@/lib/validations/product'

interface ProductFilters {
  search: string
  categoryId: string
  status: string
}

interface ProductStore {
  products: Product[]
  currentProduct: Product | null
  isLoading: boolean
  error: string | null
  filters: ProductFilters
  setProducts: (products: Product[]) => void
  setCurrentProduct: (product: Product | null) => void
  addProduct: (product: Product) => void
  updateProduct: (id: string, product: Product) => void
  removeProduct: (id: string) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  setFilters: (filters: Partial<ProductFilters>) => void
  resetFilters: () => void
}

const defaultFilters: ProductFilters = {
  search: '',
  categoryId: '',
  status: '',
}

export const useProductStore = create<ProductStore>((set) => ({
  products: [],
  currentProduct: null,
  isLoading: false,
  error: null,
  filters: defaultFilters,
  setProducts: (products) => set({ products }),
  setCurrentProduct: (product) => set({ currentProduct: product }),
  addProduct: (product) =>
    set((state) => ({ products: [...state.products, product] })),
  updateProduct: (id, updatedProduct) =>
    set((state) => ({
      products: state.products.map((p) => (p.id === id ? updatedProduct : p)),
    })),
  removeProduct: (id) =>
    set((state) => ({
      products: state.products.filter((p) => p.id !== id),
    })),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  setFilters: (filters) =>
    set((state) => ({ filters: { ...state.filters, ...filters } })),
  resetFilters: () => set({ filters: defaultFilters }),
}))
