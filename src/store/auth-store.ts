import { create } from 'zustand'
import type { User } from '@/types'

const isDev = typeof window !== 'undefined' && window.location.hostname === 'localhost'
const API_BASE = process.env.NEXT_PUBLIC_API_URL || (isDev ? 'http://localhost:8000/api/v1' : '/api/v1')

const mockUsers: Record<string, { password: string; user: User }> = {
  'admin@dhayaro.cd': {
    password: 'admin123',
    user: {
      id: 'usr_001',
      email: 'admin@dhayaro.cd',
      name: 'Dr. Jean-Pierre Lukusa',
      role: 'admin',
      facility: 'fac_001',
      avatar: '',
      createdAt: '2025-01-15T08:00:00Z',
      lastLogin: new Date().toISOString(),
      isActive: true,
    },
  },
  'dr.kabongo@dhayaro.cd': {
    password: 'doctor123',
    user: {
      id: 'usr_002',
      email: 'dr.kabongo@dhayaro.cd',
      name: 'Dr. Patrice Kabongo',
      role: 'doctor',
      facility: 'fac_001',
      avatar: '',
      createdAt: '2025-02-10T09:30:00Z',
      lastLogin: new Date().toISOString(),
      isActive: true,
    },
  },
  'nurse.consolee@dhayaro.cd': {
    password: 'nurse123',
    user: {
      id: 'usr_003',
      email: 'nurse.consolee@dhayaro.cd',
      name: 'Consolee Mukendi',
      role: 'nurse',
      facility: 'fac_001',
      avatar: '',
      createdAt: '2025-03-05T14:00:00Z',
      lastLogin: new Date().toISOString(),
      isActive: true,
    },
  },
}

interface AuthState {
  user: User | null
  token: string | null
  refreshToken: string | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
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

function loadSession(): { user: User | null; token: string | null; refreshToken: string | null } {
  try {
    const raw = localStorage.getItem('dhayaro_user')
    const token = localStorage.getItem('dhayaro_token')
    const refreshToken = localStorage.getItem('dhayaro_refresh_token')
    if (raw && token) {
      return { user: JSON.parse(raw), token, refreshToken }
    }
  } catch { /* ignore */ }
  return { user: null, token: null, refreshToken: null }
}

function saveSession(user: User, token: string, refreshToken: string) {
  localStorage.setItem('dhayaro_user', JSON.stringify(user))
  localStorage.setItem('dhayaro_token', token)
  localStorage.setItem('dhayaro_refresh_token', refreshToken)
  document.cookie = `dhayaro_token=${token}; path=/; max-age=86400; SameSite=Lax`
}

function clearSession() {
  localStorage.removeItem('dhayaro_user')
  localStorage.removeItem('dhayaro_token')
  localStorage.removeItem('dhayaro_refresh_token')
  document.cookie = 'dhayaro_token=; path=/; max-age=0'
}

function generateMockToken(user: User): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const payload = btoa(JSON.stringify({ sub: user.id, email: user.email, role: user.role, exp: Date.now() + 86400000 }))
  const sig = btoa('mock-signature')
  return `${header}.${payload}.${sig}`
}

const saved = loadSession()

export const useAuthStore = create<AuthState>((set) => ({
  user: saved.user,
  token: saved.token,
  refreshToken: saved.refreshToken,

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
          role: 'admin',
          createdAt: new Date().toISOString(),
          isActive: true,
        }
      }

      saveSession(user, token, data.refresh_token || '')
      set({ user, token, refreshToken: data.refresh_token || null })
      return
    } catch {
      // Backend indisponible → mode fallback mock
    }

    const entry = mockUsers[email]
    if (!entry || entry.password !== password) {
      throw new Error('Identifiant ou mot de passe incorrect')
    }

    const user = { ...entry.user, lastLogin: new Date().toISOString() }
    const token = generateMockToken(user)

    saveSession(user, token, 'mock-refresh')
    set({ user, token, refreshToken: 'mock-refresh' })
  },

  logout: () => {
    clearSession()
    set({ user: null, token: null, refreshToken: null })
  },

  updateProfile: (updates) =>
    set((state) => ({
      user: state.user ? { ...state.user, ...updates } : null,
    })),
}))
