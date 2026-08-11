import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

interface DocumentPdfInput {
  title: string
  documentType: string
  content: Record<string, unknown>
  facilityName?: string | null
  doctorName?: string | null
  createdAt?: string | null
}

const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  PRESCRIPTION: 'Prescription',
  CERTIFICATE: 'Certificat médical',
  REPORT: 'Compte-rendu',
  LAB_RESULT: 'Résultat de laboratoire',
  REFERRAL: 'Lettre d\'orientation',
  ORDONNANCE: 'Ordonnance médicale',
}

function renderKeyValueTable(doc: jsPDF, title: string, startY: number, data: Record<string, unknown>): number {
  const rows = Object.entries(data)
    .filter(([key, value]) => value !== null && value !== undefined && value !== '')
    .map(([key, value]) => [key, String(value)])

  if (rows.length === 0) return startY

  autoTable(doc, {
    startY,
    head: [[title]],
    body: rows,
    theme: 'grid',
    headStyles: { fillColor: [14, 56, 76] },
  })

  return (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8
}

function renderMedicationsTable(doc: jsPDF, startY: number, medications: unknown[]): number {
  if (!Array.isArray(medications) || medications.length === 0) return startY

  const rows = medications.map((med) => {
    const m = med as Record<string, unknown>
    return [
      String(m.name ?? ''),
      String(m.form ?? ''),
      String(m.dosage ?? ''),
      String(m.frequency ?? ''),
      String(m.duration ?? ''),
      m.quantity !== null && m.quantity !== undefined ? String(m.quantity) : '-',
    ]
  })

  autoTable(doc, {
    startY,
    head: [['Médicament', 'Forme', 'Dosage', 'Fréquence', 'Durée', 'Qté']],
    body: rows,
    theme: 'grid',
    headStyles: { fillColor: [14, 56, 76] },
  })

  return (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8
}

function renderTextBlock(doc: jsPDF, label: string, value: unknown, startY: number): number {
  if (value === null || value === undefined || value === '') return startY

  const text = String(value)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text(label, 20, startY)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  const lines = doc.splitTextToSize(text, 170)
  doc.text(lines, 20, startY + 6)
  return startY + 8 + lines.length * 5
}

export function generateDocumentPdf(input: DocumentPdfInput): Buffer {
  const doc = new jsPDF()
  const { title, documentType, content, facilityName, doctorName, createdAt } = input

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.text(facilityName || 'Centre de santé', 105, 20, { align: 'center' })

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  doc.text(DOCUMENT_TYPE_LABELS[documentType] || documentType, 105, 28, { align: 'center' })

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.text(title, 105, 38, { align: 'center' })

  doc.setDrawColor(14, 56, 76)
  doc.setLineWidth(0.5)
  doc.line(20, 44, 190, 44)

  let y = 54

  if (doctorName) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.text(`Médecin: ${doctorName}`, 20, y)
    y += 6
  }
  if (createdAt) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.text(`Date: ${new Date(createdAt).toLocaleDateString('fr-FR')}`, 20, y)
    y += 8
  }

  const medications = content.medications
  const results = content.results

  const contentEntries = Object.entries(content)

  const order = [
    'consultationNumber', 'motif', 'provisionalDiagnosis', 'description', 'clinicalIndication',
    'examName', 'diagnosticType', 'resultNotes', 'notes', 'outcome', 'status', 'startDate', 'endDate',
    'quantity', 'dosage', 'batchNumber', 'expiryDate', 'pharmacistName', 'treatmentId', 'labExamId',
  ]

  const knownKeys = new Set<string>(['medications', 'results'])
  const orderedEntries = order
    .map((key) => contentEntries.find(([k]) => k === key))
    .filter((entry): entry is [string, unknown] => !!entry)
  const remainingEntries = contentEntries.filter(([key]) => !order.includes(key) && !knownKeys.has(key))

  for (const [key, value] of [...orderedEntries, ...remainingEntries]) {
    y = renderTextBlock(doc, key, value, y)
  }

  y = renderKeyValueTable(doc, 'Résultats', y, typeof results === 'object' && results !== null ? results as Record<string, unknown> : {})
  y = renderMedicationsTable(doc, y, medications as unknown[])

  const signatureY = Math.max(y + 15, 260)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.text(`Établi le: ${new Date().toLocaleDateString('fr-FR')}`, 20, signatureY)

  if (doctorName) {
    doc.setFont('helvetica', 'bold')
    doc.text('Signature du médecin', 140, signatureY)
    doc.line(140, signatureY + 12, 190, signatureY + 12)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.text(`Dr. ${doctorName}`, 140, signatureY + 20)
  }

  return Buffer.from(doc.output('arraybuffer'))
}
