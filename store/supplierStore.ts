import { create } from 'zustand'
import { Supplier } from '@/lib/validations/supplier'

interface SupplierStore {
  suppliers: Supplier[]
  currentSupplier: Supplier | null
  isLoading: boolean
  error: string | null
  searchQuery: string
  setSuppliers: (suppliers: Supplier[]) => void
  setCurrentSupplier: (supplier: Supplier | null) => void
  addSupplier: (supplier: Supplier) => void
  updateSupplier: (id: string, supplier: Supplier) => void
  removeSupplier: (id: string) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  setSearchQuery: (query: string) => void
}

export const useSupplierStore = create<SupplierStore>((set) => ({
  suppliers: [],
  currentSupplier: null,
  isLoading: false,
  error: null,
  searchQuery: '',
  setSuppliers: (suppliers) => set({ suppliers }),
  setCurrentSupplier: (supplier) => set({ currentSupplier: supplier }),
  addSupplier: (supplier) =>
    set((state) => ({ suppliers: [...state.suppliers, supplier] })),
  updateSupplier: (id, updatedSupplier) =>
    set((state) => ({
      suppliers: state.suppliers.map((s) => (s.id === id ? updatedSupplier : s)),
    })),
  removeSupplier: (id) =>
    set((state) => ({
      suppliers: state.suppliers.filter((s) => s.id !== id),
    })),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  setSearchQuery: (query) => set({ searchQuery: query }),
}))
