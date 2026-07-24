import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

interface PrintData {
  type: string
  title: string
  patient?: { firstname: string; lastname: string; dateOfBirth?: string; sex?: string; bloodGroup?: string } | null
  doctor?: { firstname: string; lastname: string; specialty?: string } | null
  facility?: { name: string; address?: string; city?: string; phone?: string } | null
  createdAt: string
  updatedAt?: string
  sections: Array<{ title: string; content: string | Record<string, unknown> | Array<Record<string, unknown>> }>
}

function addHeader(doc: jsPDF, data: PrintData) {
  let y = 20

  if (data.facility) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(18)
    doc.text(data.facility.name, 105, y, { align: 'center' })
    y += 8
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    if (data.facility.address) { doc.text(data.facility.address, 105, y, { align: 'center' }); y += 6 }
    if (data.facility.city) { doc.text(data.facility.city, 105, y, { align: 'center' }); y += 6 }
    if (data.facility.phone) { doc.text(`Tél: ${data.facility.phone}`, 105, y, { align: 'center' }); y += 6 }
    y += 4
  }

  doc.setDrawColor(14, 56, 76)
  doc.setLineWidth(0.5)
  doc.line(20, y, 190, y)
  y += 10

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.text(data.title.toUpperCase(), 105, y, { align: 'center' })
  y += 12

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')

  if (data.patient) {
    doc.setFont('helvetica', 'bold')
    doc.text('PATIENT', 20, y)
    doc.setFont('helvetica', 'normal')
    y += 7
    doc.text(`${data.patient.firstname} ${data.patient.lastname}`, 20, y)
    y += 6
    if (data.patient.dateOfBirth) { doc.text(`Né(e) le: ${data.patient.dateOfBirth}`, 20, y); y += 6 }
    if (data.patient.sex) { doc.text(`Sexe: ${data.patient.sex === 'M' ? 'Masculin' : 'Féminin'}`, 20, y); y += 6 }
    if (data.patient.bloodGroup) { doc.text(`Groupe sanguin: ${data.patient.bloodGroup}`, 20, y); y += 6 }
  }

  if (data.doctor) {
    doc.setFont('helvetica', 'bold')
    doc.text('MÉDECIN', 120, y - (data.patient ? 28 : 0))
    doc.setFont('helvetica', 'normal')
    const dy = y - (data.patient ? 21 : 0)
    doc.text(`Dr. ${data.doctor.firstname} ${data.doctor.lastname}`, 120, dy)
    if (data.doctor.specialty) doc.text(`Spécialité: ${data.doctor.specialty}`, 120, dy + 7)
  }

  doc.text(`Date: ${data.createdAt}`, 120, y + 8)
  y += 16

  return y
}

function addSection(doc: jsPDF, y: number, title: string, content: string | Record<string, unknown> | Array<Record<string, unknown>>, startY: number): number {
  if (y > 260) {
    doc.addPage()
    y = 20
  }

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text(title, 20, y)
  y += 7

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)

  if (typeof content === 'string') {
    const lines = doc.splitTextToSize(content, 170)
    doc.text(lines, 20, y)
    y += lines.length * 5
  } else if (Array.isArray(content)) {
    if (content.length > 0) {
      const keys = Object.keys(content[0])
      autoTable(doc, {
        startY: y,
        head: [keys.map((k) => k.charAt(0).toUpperCase() + k.slice(1))],
        body: content.map((item) => keys.map((k) => String(item[k] ?? ''))),
        theme: 'grid',
        headStyles: { fillColor: [14, 56, 76] },
        styles: { fontSize: 9 },
      })
      y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8
    }
  } else {
    const entries = Object.entries(content)
    if (entries.length > 0) {
      autoTable(doc, {
        startY: y,
        head: [['Champ', 'Valeur']],
        body: entries.map(([k, v]) => [k.charAt(0).toUpperCase() + k.slice(1), typeof v === 'object' ? JSON.stringify(v) : String(v ?? '')]),
        theme: 'grid',
        headStyles: { fillColor: [14, 56, 76] },
        styles: { fontSize: 9 },
      })
      y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8
    }
  }

  return y + 4
}

export function generateMedicalReportPDF(data: PrintData): void {
  const doc = new jsPDF()
  let y = addHeader(doc, data)

  for (const section of data.sections) {
    y = addSection(doc, y, section.title, section.content, y)
  }

  const filename = `${data.type}-${Date.now()}.pdf`
  doc.save(filename)
}
