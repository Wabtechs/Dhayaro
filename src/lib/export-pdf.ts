import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

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

export function generateOrdonnancePDF(data: OrdonnanceData): void {
  const doc = new jsPDF()
  const { treatment, prescriptions, patient, doctor, facility } = data

  doc.setFont('helvetica', 'bold')

  if (facility) {
    doc.setFontSize(18)
    doc.text(facility.name, 105, 20, { align: 'center' })
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    if (facility.address) doc.text(facility.address, 105, 28, { align: 'center' })
    if (facility.city) doc.text(facility.city, 105, 34, { align: 'center' })
    if (facility.phone) doc.text(`Tél: ${facility.phone}`, 105, 40, { align: 'center' })
  }

  doc.setDrawColor(14, 56, 76)
  doc.setLineWidth(0.5)
  doc.line(20, 45, 190, 45)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.text('ORDONNANCE MÉDICALE', 105, 55, { align: 'center' })

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')

  if (patient) {
    doc.setFont('helvetica', 'bold')
    doc.text('PATIENT', 20, 70)
    doc.setFont('helvetica', 'normal')
    doc.text(`${patient.firstname} ${patient.lastname}`, 20, 77)
    if (patient.dateOfBirth) doc.text(`Né(e) le: ${patient.dateOfBirth}`, 20, 84)
    if (patient.sex) doc.text(`Sexe: ${patient.sex === 'M' ? 'Masculin' : 'Féminin'}`, 20, 91)
    if (patient.bloodGroup) doc.text(`Groupe sanguin: ${patient.bloodGroup}`, 20, 98)
    if (patient.allergies && patient.allergies.length > 0) {
      doc.setFont('helvetica', 'bold')
      doc.text(`Allergies: ${patient.allergies.join(', ')}`, 20, 105)
    }
  }

  if (doctor) {
    doc.setFont('helvetica', 'bold')
    doc.text('MÉDECIN PRESCRIPTEUR', 120, 70)
    doc.setFont('helvetica', 'normal')
    doc.text(`Dr. ${doctor.firstname} ${doctor.lastname}`, 120, 77)
    if (doctor.specialty) doc.text(`Spécialité: ${doctor.specialty}`, 120, 84)
    if (doctor.phone) doc.text(`Tél: ${doctor.phone}`, 120, 91)
  }

  doc.setFont('helvetica', 'bold')
  doc.text('DIAGNOSTIC / TRAITEMENT', 20, 120)
  doc.setFont('helvetica', 'normal')
  const splitDescription = doc.splitTextToSize(treatment.description, 170)
  doc.text(splitDescription, 20, 127)

  if (treatment.notes) {
    doc.setFont('helvetica', 'bold')
    doc.text('Notes:', 20, 140)
    doc.setFont('helvetica', 'normal')
    const splitNotes = doc.splitTextToSize(treatment.notes, 170)
    doc.text(splitNotes, 20, 147)
  }

  doc.setFont('helvetica', 'bold')
  doc.text('PRESCRIPTIONS', 20, 165)

  const tableData = prescriptions.map((rx) => [
    rx.medicationName || 'Inconnu',
    rx.medicationDosage || rx.dosage,
    rx.frequency,
    rx.duration,
    rx.quantity?.toString() || '-',
  ])

  autoTable(doc, {
    startY: 170,
    head: [['Médicament', 'Dosage', 'Fréquence', 'Durée', 'Qté']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [14, 56, 76] },
  })

  const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10

  if (prescriptions.some((rx) => rx.instructions)) {
    doc.setFont('helvetica', 'bold')
    doc.text('INSTRUCTIONS PARTICULIÈRES', 20, finalY)
    doc.setFont('helvetica', 'normal')
    let y = finalY + 7
    prescriptions
      .filter((rx) => rx.instructions)
      .forEach((rx) => {
        doc.text(`${rx.medicationName}: ${rx.instructions}`, 20, y)
        y += 7
      })
  }

  const signatureY = Math.max(finalY + 20, 250)
  doc.setFont('helvetica', 'normal')
  doc.text(`Date de prescription: ${treatment.startDate}`, 20, signatureY)

  doc.setFont('helvetica', 'bold')
  doc.text('Signature du médecin', 140, signatureY)
  doc.line(140, signatureY + 15, 190, signatureY + 15)
  doc.setFont('helvetica', 'normal')
  doc.text(`Dr. ${doctor?.firstname} ${doctor?.lastname}`, 140, signatureY + 22)

  doc.save(`ordonnance-${treatment.id.slice(0, 8)}.pdf`)
}
