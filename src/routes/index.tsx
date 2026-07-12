import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { useAuthStore } from '@/store/auth-store'
import { Layout } from '@/components/layout/layout'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user)
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

const Landing = lazy(() => import('@/pages/landing'))
const Login = lazy(() => import('@/pages/auth/login'))
const ForgotPassword = lazy(() => import('@/pages/auth/forgot-password'))
const Dashboard = lazy(() => import('@/pages/dashboard'))
const Facilities = lazy(() => import('@/pages/facilities'))
const FacilityDetail = lazy(() => import('@/pages/facility-detail'))
const Users = lazy(() => import('@/pages/users'))
const Patients = lazy(() => import('@/pages/patients'))
const PatientDetail = lazy(() => import('@/pages/patient-detail'))
const ClinicalCases = lazy(() => import('@/pages/clinical-cases'))
const ClinicalCaseDetail = lazy(() => import('@/pages/clinical-case-detail'))
const TreatmentHistory = lazy(() => import('@/pages/treatment-history'))
const SyncCenter = lazy(() => import('@/pages/sync-center'))
const Analytics = lazy(() => import('@/pages/analytics'))
const Research = lazy(() => import('@/pages/research'))
const Settings = lazy(() => import('@/pages/settings'))
const Profile = lazy(() => import('@/pages/profile'))
const AuditLog = lazy(() => import('@/pages/audit-log'))
const Notifications = lazy(() => import('@/pages/notifications'))

function PageLoader() {
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  )
}

function SuspenseWrapper({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<PageLoader />}>{children}</Suspense>
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route
          path="/"
          element={
            <SuspenseWrapper>
              <Landing />
            </SuspenseWrapper>
          }
        />
        <Route
          path="/login"
          element={
            <SuspenseWrapper>
              <Login />
            </SuspenseWrapper>
          }
        />
        <Route
          path="/forgot-password"
          element={
            <SuspenseWrapper>
              <ForgotPassword />
            </SuspenseWrapper>
          }
        />

        {/* Protected app routes */}
        <Route
          path="/app"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<SuspenseWrapper><Dashboard /></SuspenseWrapper>} />
          <Route path="facilities" element={<SuspenseWrapper><Facilities /></SuspenseWrapper>} />
          <Route path="facilities/:id" element={<SuspenseWrapper><FacilityDetail /></SuspenseWrapper>} />
          <Route path="users" element={<SuspenseWrapper><Users /></SuspenseWrapper>} />
          <Route path="patients" element={<SuspenseWrapper><Patients /></SuspenseWrapper>} />
          <Route path="patients/:id" element={<SuspenseWrapper><PatientDetail /></SuspenseWrapper>} />
          <Route path="clinical-cases" element={<SuspenseWrapper><ClinicalCases /></SuspenseWrapper>} />
          <Route path="clinical-cases/:id" element={<SuspenseWrapper><ClinicalCaseDetail /></SuspenseWrapper>} />
          <Route path="treatment-history" element={<SuspenseWrapper><TreatmentHistory /></SuspenseWrapper>} />
          <Route path="sync" element={<SuspenseWrapper><SyncCenter /></SuspenseWrapper>} />
          <Route path="analytics" element={<SuspenseWrapper><Analytics /></SuspenseWrapper>} />
          <Route path="research" element={<SuspenseWrapper><Research /></SuspenseWrapper>} />
          <Route path="settings" element={<SuspenseWrapper><Settings /></SuspenseWrapper>} />
          <Route path="profile" element={<SuspenseWrapper><Profile /></SuspenseWrapper>} />
          <Route path="audit" element={<SuspenseWrapper><AuditLog /></SuspenseWrapper>} />
          <Route path="notifications" element={<SuspenseWrapper><Notifications /></SuspenseWrapper>} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
