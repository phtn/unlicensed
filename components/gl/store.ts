import {create} from 'zustand'

export interface SavedConfig {
  id: string
  name: string
  timestamp: number
  camera: {
    position: [number, number, number]
    target: [number, number, number]
  }
  params: Record<string, unknown>
}

interface CatalogState {
  showGrid: boolean
  setShowGrid: (show: boolean) => void
  toggleGrid: () => void
  backgroundColor: string
  setBackgroundColor: (color: string) => void
  cameraPosition: [number, number, number]
  setCameraPosition: (pos: [number, number, number]) => void
  savedConfigs: SavedConfig[]
  saveConfig: (config: SavedConfig) => void
  removeConfig: (id: string) => void
}

export const useCatalogStore = create<CatalogState>((set) => ({
  showGrid: false,
  setShowGrid: (show) => set({showGrid: show}),
  toggleGrid: () => set((state) => ({showGrid: !state.showGrid})),
  backgroundColor: '#111111',
  setBackgroundColor: (color) => set({backgroundColor: color}),
  cameraPosition: [0, 2, 5],
  setCameraPosition: (pos) => set({cameraPosition: pos}),
  savedConfigs: [],
  saveConfig: (config) =>
    set((state) => ({savedConfigs: [...state.savedConfigs, config]})),
  removeConfig: (id) =>
    set((state) => ({
      savedConfigs: state.savedConfigs.filter((c) => c.id !== id),
    })),
}))
