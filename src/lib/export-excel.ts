import * as XLSX from 'xlsx'

interface OrdonnanceData {
  treatment: {
    id: string
    description: string
    status: string
    startDate: string
    endDate?: string
    notes?: string
    outcome?: string
    createdAt: string
  }
  prescriptions: Array<{
    id: string
    dosage: string
    frequency: string
    duration: string
    instructions?: string
    quantity?: number
    medicationName?: string
    medicationGenericName?: string
    medicationForm?: string
    medicationDosage?: string
  }>
  patient: {
    firstname: string
    lastname: string
    dateOfBirth?: string
    sex?: string
    phone?: string
    address?: string
    city?: string
    bloodGroup?: string
    allergies?: string[]
  } | null
  doctor: {
    firstname: string
    lastname: string
    specialty?: string
    phone?: string
  } | null
  facility: {
    name: string
    address?: string
    phone?: string
    city?: string
  } | null
}

export function generateOrdonnanceExcel(data: OrdonnanceData): void {
  const { treatment, prescriptions, patient, doctor, facility } = data

  const wb = XLSX.utils.book_new()

  const headerData = [
    ['Établissement', facility?.name || ''],
    ['Adresse', facility?.address || ''],
    ['Ville', facility?.city || ''],
    ['Téléphone', facility?.phone || ''],
    [''],
    ['ORDONNANCE MÉDICALE'],
    [''],
    ['PATIENT', `${patient?.firstname || ''} ${patient?.lastname || ''}`],
    ['Date de naissance', patient?.dateOfBirth || ''],
    ['Sexe', patient?.sex === 'M' ? 'Masculin' : patient?.sex === 'F' ? 'Féminin' : ''],
    ['Groupe sanguin', patient?.bloodGroup || ''],
    ['Allergies', patient?.allergies?.join(', ') || ''],
    [''],
    ['MÉDECIN', `Dr. ${doctor?.firstname || ''} ${doctor?.lastname || ''}`],
    ['Spécialité', doctor?.specialty || ''],
    [''],
    ['DIAGNOSTIC / TRAITEMENT', treatment.description],
    ['Notes', treatment.notes || ''],
    ['Date de prescription', treatment.startDate],
    [''],
  ]

  const ws = XLSX.utils.aoa_to_sheet(headerData)

  ws['!cols'] = [{ wch: 25 }, { wch: 50 }]

  XLSX.utils.book_append_sheet(wb, ws, 'Ordonnance')

  const prescriptionData = [
    ['Médicament', 'Forme', 'Dosage', 'Fréquence', 'Durée', 'Quantité', 'Instructions'],
    ...prescriptions.map((rx) => [
      rx.medicationName || 'Inconnu',
      rx.medicationForm || '',
      rx.medicationDosage || rx.dosage,
      rx.frequency,
      rx.duration,
      rx.quantity?.toString() || '',
      rx.instructions || '',
    ]),
  ]

  const wsPrescriptions = XLSX.utils.aoa_to_sheet(prescriptionData)
  wsPrescriptions['!cols'] = [
    { wch: 20 },
    { wch: 15 },
    { wch: 15 },
    { wch: 20 },
    { wch: 15 },
    { wch: 10 },
    { wch: 30 },
  ]
  XLSX.utils.book_append_sheet(wb, wsPrescriptions, 'Prescriptions')

  XLSX.writeFile(wb, `ordonnance-${treatment.id.slice(0, 8)}.xlsx`)
}

interface MedicalReportData {
  type: string
  title: string
  patient?: { firstname: string; lastname: string; dateOfBirth?: string; sex?: string; bloodGroup?: string } | null
  doctor?: { firstname: string; lastname: string; specialty?: string } | null
  facility?: { name: string; address?: string; city?: string; phone?: string } | null
  createdAt: string
  updatedAt?: string
  sections: Array<{ title: string; content: string | Record<string, unknown> | Array<Record<string, unknown>> }>
}

export function generateMedicalReportExcel(data: MedicalReportData): void {
  const wb = XLSX.utils.book_new()
  const rows: (string | number)[][] = []

  if (data.facility) {
    rows.push(['Établissement', data.facility.name])
    if (data.facility.address) rows.push(['Adresse', data.facility.address])
    if (data.facility.city) rows.push(['Ville', data.facility.city])
    if (data.facility.phone) rows.push(['Téléphone', data.facility.phone])
    rows.push([''])
  }

  rows.push([data.title.toUpperCase()])
  rows.push([''])

  if (data.patient) {
    rows.push(['PATIENT', `${data.patient.firstname} ${data.patient.lastname}`])
    if (data.patient.dateOfBirth) rows.push(['Né(e) le', data.patient.dateOfBirth])
    if (data.patient.sex) rows.push(['Sexe', data.patient.sex === 'M' ? 'Masculin' : 'Féminin'])
    if (data.patient.bloodGroup) rows.push(['Groupe sanguin', data.patient.bloodGroup])
    rows.push([''])
  }

  if (data.doctor) {
    rows.push(['MÉDECIN', `Dr. ${data.doctor.firstname} ${data.doctor.lastname}`])
    if (data.doctor.specialty) rows.push(['Spécialité', data.doctor.specialty])
    rows.push([''])
  }

  rows.push(['Date', data.createdAt])
  if (data.updatedAt) rows.push(['Mis à jour', data.updatedAt])
  rows.push([''])

  for (const section of data.sections) {
    rows.push([section.title])
    if (typeof section.content === 'string') {
      rows.push([section.content])
    } else if (Array.isArray(section.content)) {
      if (section.content.length > 0) {
        const keys = Object.keys(section.content[0])
        rows.push(keys.map((k) => k.charAt(0).toUpperCase() + k.slice(1)))
        for (const item of section.content) {
          rows.push(keys.map((k) => String(item[k] ?? '')))
        }
      }
    } else {
      for (const [k, v] of Object.entries(section.content)) {
        rows.push([k.charAt(0).toUpperCase() + k.slice(1), typeof v === 'object' ? JSON.stringify(v) : String(v ?? '')])
      }
    }
    rows.push([''])
  }

  const ws = XLSX.utils.aoa_to_sheet(rows)
  ws['!cols'] = [{ wch: 25 }, { wch: 50 }]
  XLSX.utils.book_append_sheet(wb, ws, data.type)

  XLSX.writeFile(wb, `${data.type}-${Date.now()}.xlsx`)
}
