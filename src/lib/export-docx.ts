import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  Table,
  TableRow,
  TableCell,
  WidthType,
  ShadingType,
  FileChild,
} from 'docx'
import { saveAs } from 'file-saver'

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

function makeCell(text: string, bold = false): TableCell {
  return new TableCell({
    children: [
      new Paragraph({
        children: [new TextRun({ text, bold, size: 20 })],
      }),
    ],
  })
}

function makeHeaderCell(text: string): TableCell {
  return new TableCell({
    shading: { type: ShadingType.CLEAR, fill: '0E384C' },
    children: [
      new Paragraph({
        children: [new TextRun({ text, bold: true, size: 20, color: 'FFFFFF' })],
      }),
    ],
  })
}

export async function generateOrdonnanceDOCX(data: OrdonnanceData): Promise<void> {
  const { treatment, prescriptions, patient, doctor, facility } = data

  const headerChildren: FileChild[] = []

  if (facility) {
    headerChildren.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: facility.name, bold: true, size: 36 })],
      })
    )
    if (facility.address) {
      headerChildren.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: facility.address, size: 20 })],
        })
      )
    }
    if (facility.city) {
      headerChildren.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: facility.city, size: 20 })],
        })
      )
    }
    if (facility.phone) {
      headerChildren.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: `Tél: ${facility.phone}`, size: 20 })],
        })
      )
    }
    headerChildren.push(new Paragraph({ spacing: { after: 200 }, children: [] }))
  }

  headerChildren.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      heading: HeadingLevel.HEADING_1,
      children: [new TextRun({ text: 'ORDONNANCE MÉDICALE', bold: true, size: 28 })],
    }),
    new Paragraph({ spacing: { after: 200 }, children: [] })
  )

  const patientRows: FileChild[] = []
  patientRows.push(
    new Paragraph({
      children: [new TextRun({ text: 'PATIENT', bold: true, size: 24 })],
    }),
    new Paragraph({
      children: [
        new TextRun({ text: `${patient?.firstname || ''} ${patient?.lastname || ''}`, size: 22 }),
      ],
    })
  )
  if (patient?.dateOfBirth) {
    patientRows.push(
      new Paragraph({
        children: [new TextRun({ text: `Né(e) le: ${patient.dateOfBirth}`, size: 20 })],
      })
    )
  }
  if (patient?.bloodGroup) {
    patientRows.push(
      new Paragraph({
        children: [new TextRun({ text: `Groupe sanguin: ${patient.bloodGroup}`, size: 20 })],
      })
    )
  }
  if (patient?.allergies && patient.allergies.length > 0) {
    patientRows.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `Allergies: ${patient.allergies.join(', ')}`,
            bold: true,
            size: 20,
            color: 'FF0000',
          }),
        ],
      })
    )
  }

  const doctorRows: FileChild[] = []
  doctorRows.push(
    new Paragraph({
      children: [new TextRun({ text: 'MÉDECIN PRESCRIPTEUR', bold: true, size: 24 })],
    }),
    new Paragraph({
      children: [
        new TextRun({ text: `Dr. ${doctor?.firstname || ''} ${doctor?.lastname || ''}`, size: 22 }),
      ],
    })
  )
  if (doctor?.specialty) {
    doctorRows.push(
      new Paragraph({
        children: [new TextRun({ text: `Spécialité: ${doctor.specialty}`, size: 20 })],
      })
    )
  }
  if (doctor?.phone) {
    doctorRows.push(
      new Paragraph({
        children: [new TextRun({ text: `Tél: ${doctor.phone}`, size: 20 })],
      })
    )
  }

  const infoTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            children: patientRows,
          }),
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            children: doctorRows,
          }),
        ],
      }),
    ],
  })

  headerChildren.push(infoTable)
  headerChildren.push(new Paragraph({ spacing: { after: 200 }, children: [] }))

  headerChildren.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_2,
      children: [new TextRun({ text: 'DIAGNOSTIC / TRAITEMENT', bold: true, size: 24 })],
    }),
    new Paragraph({
      children: [new TextRun({ text: treatment.description, size: 22 })],
    })
  )

  if (treatment.notes) {
    headerChildren.push(
      new Paragraph({
        children: [
          new TextRun({ text: 'Notes: ', bold: true, size: 22 }),
          new TextRun({ text: treatment.notes, size: 22 }),
        ],
      })
    )
  }

  headerChildren.push(new Paragraph({ spacing: { after: 200 }, children: [] }))
  headerChildren.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_2,
      children: [new TextRun({ text: 'PRESCRIPTIONS', bold: true, size: 24 })],
    })
  )

  const prescriptionRows = prescriptions.map(
    (rx) =>
      new TableRow({
        children: [
          makeCell(rx.medicationName || 'Inconnu'),
          makeCell(rx.medicationForm || ''),
          makeCell(rx.medicationDosage || rx.dosage),
          makeCell(rx.frequency),
          makeCell(rx.duration),
          makeCell(rx.quantity?.toString() || '-'),
          makeCell(rx.instructions || ''),
        ],
      })
  )

  const prescriptionTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          makeHeaderCell('Médicament'),
          makeHeaderCell('Forme'),
          makeHeaderCell('Dosage'),
          makeHeaderCell('Fréquence'),
          makeHeaderCell('Durée'),
          makeHeaderCell('Qté'),
          makeHeaderCell('Instructions'),
        ],
      }),
      ...prescriptionRows,
    ],
  })

  headerChildren.push(prescriptionTable)
  headerChildren.push(new Paragraph({ spacing: { after: 200 }, children: [] }))
  headerChildren.push(
    new Paragraph({
      children: [new TextRun({ text: `Date de prescription: ${treatment.startDate}`, size: 22 })],
    })
  )
  headerChildren.push(new Paragraph({ spacing: { after: 400 }, children: [] }))
  headerChildren.push(
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      children: [new TextRun({ text: 'Signature du médecin', size: 22 })],
    }),
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      children: [
        new TextRun({ text: `Dr. ${doctor?.firstname || ''} ${doctor?.lastname || ''}`, bold: true, size: 22 }),
      ],
    })
  )

  const doc = new Document({
    sections: [{ children: headerChildren }],
  })

  const blob = await Packer.toBlob(doc)
  saveAs(blob, `ordonnance-${treatment.id.slice(0, 8)}.docx`)
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

export async function generateMedicalReportDOCX(data: MedicalReportData): Promise<void> {
  const children: FileChild[] = []

  if (data.facility) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: data.facility.name, bold: true, size: 36 })],
      })
    )
    if (data.facility.address) children.push(new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: data.facility.address, size: 20 })] }))
    if (data.facility.city) children.push(new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: data.facility.city, size: 20 })] }))
    if (data.facility.phone) children.push(new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `Tél: ${data.facility.phone}`, size: 20 })] }))
    children.push(new Paragraph({ spacing: { after: 200 }, children: [] }))
  }

  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      heading: HeadingLevel.HEADING_1,
      children: [new TextRun({ text: data.title.toUpperCase(), bold: true, size: 28 })],
    }),
    new Paragraph({ spacing: { after: 200 }, children: [] })
  )

  if (data.patient) {
    children.push(
      new Paragraph({ children: [new TextRun({ text: 'PATIENT', bold: true, size: 24 })] }),
      new Paragraph({ children: [new TextRun({ text: `${data.patient.firstname} ${data.patient.lastname}`, size: 22 })] })
    )
    if (data.patient.dateOfBirth) children.push(new Paragraph({ children: [new TextRun({ text: `Né(e) le: ${data.patient.dateOfBirth}`, size: 20 })] }))
    if (data.patient.sex) children.push(new Paragraph({ children: [new TextRun({ text: `Sexe: ${data.patient.sex === 'M' ? 'Masculin' : 'Féminin'}`, size: 20 })] }))
    if (data.patient.bloodGroup) children.push(new Paragraph({ children: [new TextRun({ text: `Groupe sanguin: ${data.patient.bloodGroup}`, size: 20 })] }))
    children.push(new Paragraph({ spacing: { after: 200 }, children: [] }))
  }

  if (data.doctor) {
    children.push(
      new Paragraph({ children: [new TextRun({ text: 'MÉDECIN', bold: true, size: 24 })] }),
      new Paragraph({ children: [new TextRun({ text: `Dr. ${data.doctor.firstname} ${data.doctor.lastname}`, size: 22 })] })
    )
    if (data.doctor.specialty) children.push(new Paragraph({ children: [new TextRun({ text: `Spécialité: ${data.doctor.specialty}`, size: 20 })] }))
    children.push(new Paragraph({ spacing: { after: 200 }, children: [] }))
  }

  children.push(
    new Paragraph({ children: [new TextRun({ text: `Date: ${data.createdAt}`, size: 20 })] }),
    new Paragraph({ spacing: { after: 200 }, children: [] })
  )

  for (const section of data.sections) {
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun({ text: section.title, bold: true, size: 24 })],
      })
    )
    if (typeof section.content === 'string') {
      const lines = section.content.split('\n').filter(Boolean)
      for (const line of lines) {
        children.push(new Paragraph({ children: [new TextRun({ text: line, size: 22 })] }))
      }
    } else if (Array.isArray(section.content) && section.content.length > 0) {
      const keys = Object.keys(section.content[0])
      const table = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({ children: keys.map((k) => makeHeaderCell(k.charAt(0).toUpperCase() + k.slice(1))) }),
          ...section.content.map((item) =>
            new TableRow({ children: keys.map((k) => makeCell(String(item[k] ?? ''))) })
          ),
        ],
      })
      children.push(table)
    } else if (typeof section.content === 'object' && !Array.isArray(section.content)) {
      const entries = Object.entries(section.content)
      if (entries.length > 0) {
        const table = new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({ children: [makeHeaderCell('Champ'), makeHeaderCell('Valeur')] }),
            ...entries.map(([k, v]) =>
              new TableRow({ children: [makeCell(k.charAt(0).toUpperCase() + k.slice(1)), makeCell(typeof v === 'object' ? JSON.stringify(v) : String(v ?? ''))] })
            ),
          ],
        })
        children.push(table)
      }
    }
    children.push(new Paragraph({ spacing: { after: 200 }, children: [] }))
  }

  const doc = new Document({ sections: [{ children }] })
  const blob = await Packer.toBlob(doc)
  saveAs(blob, `${data.type}-${Date.now()}.docx`)
}
