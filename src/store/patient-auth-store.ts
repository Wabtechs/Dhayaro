import { create } from 'zustand'

interface PatientUser {
  id: string
  email: string
  firstname: string
  lastname: string
  role: string
}

interface PatientProfile {
  id: string
  patientUuid: string
  firstname: string
  lastname: string
  facilityId: string | null
  facilityName?: string | null
  sex: string
  dateOfBirth: string
  age?: number | null
  bloodGroup?: string | null
  phone?: string | null
  email?: string | null
  address?: string | null
  city?: string | null
  photo?: string | null
  emergencyContactName?: string | null
  emergencyContactPhone?: string | null
  emergencyContactRelation?: string | null
  insuranceName?: string | null
  insuranceNumber?: string | null
  allergies?: string[] | null
  antecedents?: unknown[] | null
}

interface PatientAuthState {
  user: PatientUser | null
  patient: PatientProfile | null
  token: string | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  loadSession: () => void
}

function saveSession(user: PatientUser, patient: PatientProfile, token: string) {
  localStorage.setItem('dhayaro_patient_user', JSON.stringify(user))
  localStorage.setItem('dhayaro_patient_profile', JSON.stringify(patient))
  localStorage.setItem('dhayaro_patient_token', token)
  document.cookie = `dhayaro_token=${token}; path=/; max-age=86400; SameSite=Lax`
}

function clearSession() {
  localStorage.removeItem('dhayaro_patient_user')
  localStorage.removeItem('dhayaro_patient_profile')
  localStorage.removeItem('dhayaro_patient_token')
  localStorage.removeItem('dhayaro_token')
  document.cookie = 'dhayaro_token=; path=/; max-age=0'
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api/v1'

function loadInitialSession() {
  try {
    const raw = localStorage.getItem('dhayaro_patient_user')
    const profile = localStorage.getItem('dhayaro_patient_profile')
    const token = localStorage.getItem('dhayaro_patient_token')
    if (raw && token) {
      return {
        user: JSON.parse(raw) as PatientUser,
        patient: profile ? JSON.parse(profile) as PatientProfile : null,
        token,
      }
    }
  } catch { /* ignore */ }
  return { user: null, patient: null, token: null }
}

const initial = loadInitialSession()

export const usePatientAuthStore = create<PatientAuthState>((set) => ({
  user: initial.user,
  patient: initial.patient,
  token: initial.token,

  login: async (email: string, password: string) => {
    const res = await fetch(`${API_BASE}/auth/patient-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Erreur de connexion' }))
      throw new Error(err.detail || 'Erreur de connexion')
    }

    const data = await res.json()
    const token = data.access_token
    const user = data.user as PatientUser
    const patient = data.patient as PatientProfile

    saveSession(user, patient, token)
    set({ user, patient, token })
  },

  logout: () => {
    clearSession()
    set({ user: null, patient: null, token: null })
    if (typeof window !== 'undefined') {
      window.location.href = '/patient/login'
    }
  },

  loadSession: () => {
    const s = loadInitialSession()
    set(s)
  },
}))
