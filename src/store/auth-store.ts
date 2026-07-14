import { create } from 'zustand'
import type { User } from '@/types'

const isDev = typeof window !== 'undefined' && window.location.hostname === 'localhost'
const API_BASE = process.env.NEXT_PUBLIC_API_URL || (isDev ? 'http://localhost:8000/api/v1' : '/api/v1')

const mockUsers: Record<string, { password: string; user: User }> = {
  'admin@medinsight.dz': {
    password: 'admin123',
    user: {
      id: 'usr_001',
      email: 'admin@medinsight.dz',
      name: 'Dr. Amira Benali',
      role: 'admin',
      facility: 'fac_001',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin@medinsight.dz',
      createdAt: '2025-01-15T08:00:00Z',
      lastLogin: new Date().toISOString(),
      isActive: true,
    },
  },
  'dr.benali@medinsight.dz': {
    password: 'doctor123',
    user: {
      id: 'usr_002',
      email: 'dr.benali@medinsight.dz',
      name: 'Dr. Karim Benali',
      role: 'doctor',
      facility: 'fac_001',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=dr.benali@medinsight.dz',
      createdAt: '2025-02-10T09:30:00Z',
      lastLogin: new Date().toISOString(),
      isActive: true,
    },
  },
  'researcher@medinsight.dz': {
    password: 'researcher123',
    user: {
      id: 'usr_003',
      email: 'researcher@medinsight.dz',
      name: 'Dr. Yacine Khelifi',
      role: 'researcher',
      facility: 'fac_002',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=researcher@medinsight.dz',
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
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${bu.email}`,
    createdAt: (bu.createdAt || bu.created_at) as string,
    lastLogin: new Date().toISOString(),
    isActive: (bu.isActive !== undefined ? bu.isActive : bu.is_active) as boolean,
  }
}

function loadSession(): { user: User | null; token: string | null; refreshToken: string | null } {
  try {
    const raw = localStorage.getItem('medinsight_user')
    const token = localStorage.getItem('medinsight_token')
    const refreshToken = localStorage.getItem('medinsight_refresh_token')
    if (raw && token) {
      return { user: JSON.parse(raw), token, refreshToken }
    }
  } catch { /* ignore */ }
  return { user: null, token: null, refreshToken: null }
}

function saveSession(user: User, token: string, refreshToken: string) {
  localStorage.setItem('medinsight_user', JSON.stringify(user))
  localStorage.setItem('medinsight_token', token)
  localStorage.setItem('medinsight_refresh_token', refreshToken)
}

function clearSession() {
  localStorage.removeItem('medinsight_user')
  localStorage.removeItem('medinsight_token')
  localStorage.removeItem('medinsight_refresh_token')
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
