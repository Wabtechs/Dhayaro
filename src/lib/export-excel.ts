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
