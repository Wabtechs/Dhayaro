import { PatientLayout } from '@/components/patient-layout'

export default function PatientRootLayout({ children }: { children: React.ReactNode }) {
  return <PatientLayout>{children}</PatientLayout>
}
