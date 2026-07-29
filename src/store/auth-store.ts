import { create } from 'zustand'
import type { User } from '@/types'

const isDev = typeof window !== 'undefined' && window.location.hostname === 'localhost'
const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api/v1'

interface AuthState {
  user: User | null
  token: string | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  setToken: (token: string) => void
  updateProfile: (updates: Partial<User>) => void
}

function mapBackendUser(bu: Record<string, unknown>): User {
  const role = (bu.role as string).toLowerCase()
  return {
    id: bu.id as string,
    email: bu.email as string,
    name: `${bu.firstname || ''} ${bu.lastname || ''}`.trim() || bu.email as string,
    role: role as User['role'],
    facility: (bu.facilityId || bu.facility_id) as string,
    avatar: '',
    createdAt: (bu.createdAt || bu.created_at) as string,
    lastLogin: new Date().toISOString(),
    isActive: (bu.isActive !== undefined ? bu.isActive : bu.is_active) as boolean,
  }
}

function loadSession(): { user: User | null; token: string | null } {
  try {
    const raw = localStorage.getItem('dhayaro_user')
    const token = localStorage.getItem('dhayaro_token')
    if (raw && token) {
      return { user: JSON.parse(raw), token }
    }
  } catch { /* ignore */ }
  return { user: null, token: null }
}

function saveSession(user: User, token: string) {
  localStorage.setItem('dhayaro_user', JSON.stringify(user))
  localStorage.setItem('dhayaro_token', token)
}

function clearSession() {
  localStorage.removeItem('dhayaro_user')
  localStorage.removeItem('dhayaro_token')
  document.cookie = 'dhayaro_token=; path=/; max-age=0'
  document.cookie = 'dhayaro_refresh_token=; path=/; max-age=0'
}

const saved = loadSession()

export const useAuthStore = create<AuthState>((set) => ({
  user: saved.user,
  token: saved.token,

  login: async (email: string, password: string) => {
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 3000)

      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        signal: controller.signal,
      })
      clearTimeout(timeout)

      if (!res.ok) {
        throw new Error('Identifiant ou mot de passe incorrect')
      }

      const data = await res.json()
      const token = data.access_token

      const userRes = await fetch(`${API_BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      let user: User
      if (userRes.ok) {
        const backendUser = await userRes.json()
        user = mapBackendUser(backendUser)
      } else {
        const payload = JSON.parse(atob(token.split('.')[1]))
        user = {
          id: payload.sub,
          email,
          name: email,
          role: (payload.role || 'doctor').toLowerCase() as User['role'],
          facility: payload.facilityId || '',
          createdAt: new Date().toISOString(),
          isActive: true,
        }
      }

      saveSession(user, token)
      set({ user, token })
      return
    } catch {
      throw new Error('Le serveur est indisponible. Veuillez réessayer.')
    }
  },

  logout: () => {
    clearSession()
    set({ user: null, token: null })
    if (typeof window !== 'undefined') {
      window.location.href = '/login'
    }
  },

  setToken: (token: string) => {
    set({ token })
  },

  updateProfile: (updates) =>
    set((state) => ({
      user: state.user ? { ...state.user, ...updates } : null,
    })),
}))
