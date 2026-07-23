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
