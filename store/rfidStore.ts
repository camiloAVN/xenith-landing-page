import { create } from 'zustand'
import { RfidTag, RfidDetection } from '@/lib/validations/rfid'

interface RfidFilters {
  search: string
  status: string
}

interface RfidStore {
  tags: RfidTag[]
  unknownTags: RfidTag[]
  currentTag: RfidTag | null
  detections: RfidDetection[]
  isLoading: boolean
  error: string | null
  filters: RfidFilters
  setTags: (tags: RfidTag[]) => void
  setUnknownTags: (tags: RfidTag[]) => void
  setCurrentTag: (tag: RfidTag | null) => void
  addTag: (tag: RfidTag) => void
  updateTag: (id: string, tag: RfidTag) => void
  removeTag: (id: string) => void
  setDetections: (detections: RfidDetection[]) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  setFilters: (filters: Partial<RfidFilters>) => void
  resetFilters: () => void
}

const defaultFilters: RfidFilters = {
  search: '',
  status: '',
}

export const useRfidStore = create<RfidStore>((set) => ({
  tags: [],
  unknownTags: [],
  currentTag: null,
  detections: [],
  isLoading: false,
  error: null,
  filters: defaultFilters,
  setTags: (tags) => set({ tags }),
  setUnknownTags: (tags) => set({ unknownTags: tags }),
  setCurrentTag: (tag) => set({ currentTag: tag }),
  addTag: (tag) =>
    set((state) => ({ tags: [tag, ...state.tags] })),
  updateTag: (id, updatedTag) =>
    set((state) => ({
      tags: state.tags.map((t) => (t.id === id ? updatedTag : t)),
      unknownTags: state.unknownTags.filter((t) => t.id !== id || updatedTag.status === 'UNKNOWN'),
    })),
  removeTag: (id) =>
    set((state) => ({
      tags: state.tags.filter((t) => t.id !== id),
      unknownTags: state.unknownTags.filter((t) => t.id !== id),
    })),
  setDetections: (detections) => set({ detections }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  setFilters: (filters) =>
    set((state) => ({ filters: { ...state.filters, ...filters } })),
  resetFilters: () => set({ filters: defaultFilters }),
}))
