import { create } from 'zustand'
import { InventoryItem, InventoryMovement, InventorySummary } from '@/lib/validations/inventory'

interface InventoryFilters {
  search: string
  status: string
  type: string
  productId: string
}

interface InventoryStore {
  items: InventoryItem[]
  currentItem: InventoryItem | null
  movements: InventoryMovement[]
  summary: InventorySummary | null
  isLoading: boolean
  error: string | null
  filters: InventoryFilters
  setItems: (items: InventoryItem[]) => void
  setCurrentItem: (item: InventoryItem | null) => void
  addItem: (item: InventoryItem) => void
  updateItem: (id: string, item: InventoryItem) => void
  removeItem: (id: string) => void
  setMovements: (movements: InventoryMovement[]) => void
  setSummary: (summary: InventorySummary | null) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  setFilters: (filters: Partial<InventoryFilters>) => void
  resetFilters: () => void
}

const defaultFilters: InventoryFilters = {
  search: '',
  status: '',
  type: '',
  productId: '',
}

export const useInventoryStore = create<InventoryStore>((set) => ({
  items: [],
  currentItem: null,
  movements: [],
  summary: null,
  isLoading: false,
  error: null,
  filters: defaultFilters,
  setItems: (items) => set({ items }),
  setCurrentItem: (item) => set({ currentItem: item }),
  addItem: (item) =>
    set((state) => ({ items: [item, ...state.items] })),
  updateItem: (id, updatedItem) =>
    set((state) => ({
      items: state.items.map((i) => (i.id === id ? updatedItem : i)),
    })),
  removeItem: (id) =>
    set((state) => ({
      items: state.items.filter((i) => i.id !== id),
    })),
  setMovements: (movements) => set({ movements }),
  setSummary: (summary) => set({ summary }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  setFilters: (filters) =>
    set((state) => ({ filters: { ...state.filters, ...filters } })),
  resetFilters: () => set({ filters: defaultFilters }),
}))
