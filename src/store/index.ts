import { create } from 'zustand'
import type { Notification } from '@/types'

interface AppState {
  sidebarOpen: boolean
  toggleSidebar: () => void
  darkMode: boolean
  toggleDarkMode: () => void
  searchOpen: boolean
  setSearchOpen: (open: boolean) => void
  commandPaletteOpen: boolean
  setCommandPaletteOpen: (open: boolean) => void
  notifications: Notification[]
  markNotificationRead: (id: string) => void
  markAllNotificationsRead: () => void
  activeFacility: string | null
  setActiveFacility: (id: string | null) => void
}

function getInitialDarkMode(): boolean {
  if (typeof window === 'undefined') return false
  const stored = localStorage.getItem('dhayaro-dark-mode')
  return stored === 'true'
}

function applyDarkMode(dark: boolean) {
  if (dark) {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
  localStorage.setItem('dhayaro-dark-mode', String(dark))
}

const initialDarkMode = getInitialDarkMode()
if (typeof window !== 'undefined') {
  applyDarkMode(initialDarkMode)
}

export const useAppStore = create<AppState>((set) => ({
  sidebarOpen: true,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

  darkMode: initialDarkMode,
  toggleDarkMode: () =>
    set((state) => {
      const next = !state.darkMode
      applyDarkMode(next)
      return { darkMode: next }
    }),

  searchOpen: false,
  setSearchOpen: (open) => set({ searchOpen: open }),

  commandPaletteOpen: false,
  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),

  notifications: [],
  markNotificationRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
    })),
  markAllNotificationsRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
    })),

  activeFacility: null,
  setActiveFacility: (id) => set({ activeFacility: id }),
}))
