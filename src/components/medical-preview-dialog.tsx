'use client'

import { useState } from 'react'
import {
  Printer,
  FileDown,
  FileSpreadsheet,
  FileText,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { generateMedicalReportPDF } from '@/lib/export-medical'
import { generateMedicalReportExcel } from '@/lib/export-excel'
import { generateMedicalReportDOCX } from '@/lib/export-docx'
import { formatDate } from '@/lib/utils'

export interface PreviewData {
  type: string
  title: string
  patient?: { firstname: string; lastname: string; dateOfBirth?: string; sex?: string; bloodGroup?: string } | null
  doctor?: { firstname: string; lastname: string; specialty?: string } | null
  facility?: { name: string; address?: string; city?: string; phone?: string } | null
  createdAt: string
  updatedAt?: string
  sections: Array<{ title: string; content: string | Record<string, unknown> | Array<Record<string, unknown>> }>
}

const typeLabels: Record<string, string> = {
  consultation: 'Consultation',
  diagnostic: 'Diagnostic',
  lab_result: 'Résultat de laboratoire',
  document: 'Document',
  treatment: 'Traitement',
}

interface MedicalPreviewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  data: PreviewData | null
  onNavigate?: () => void
}

export function MedicalPreviewDialog({ open, onOpenChange, data, onNavigate }: MedicalPreviewDialogProps) {
  const [exporting, setExporting] = useState<'pdf' | 'excel' | 'docx' | null>(null)

  if (!data) return null

  const handlePrint = () => window.print()

  const handleExportPDF = async () => {
    setExporting('pdf')
    try {
      generateMedicalReportPDF(data)
    } catch (err) {
      console.error('PDF export error:', err)
    } finally {
      setExporting(null)
    }
  }

  const handleExportExcel = async () => {
    setExporting('excel')
    try {
      generateMedicalReportExcel(data)
    } catch (err) {
      console.error('Excel export error:', err)
    } finally {
      setExporting(null)
    }
  }

  const handleExportDOCX = async () => {
    setExporting('docx')
    try {
      await generateMedicalReportDOCX(data)
    } catch (err) {
      console.error('DOCX export error:', err)
    } finally {
      setExporting(null)
    }
  }

  const renderContent = (content: string | Record<string, unknown> | Array<Record<string, unknown>>) => {
    if (typeof content === 'string') {
      return <p className="text-sm whitespace-pre-wrap">{content}</p>
    }
    if (Array.isArray(content)) {
      if (content.length === 0) return <p className="text-sm text-muted-foreground">Aucune donnée</p>
      const keys = Object.keys(content[0])
      return (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                {keys.map((k) => (
                  <th key={k} className="px-3 py-2 text-left font-medium text-muted-foreground">{k}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {content.map((row, i) => (
                <tr key={i} className="border-b last:border-0">
                  {keys.map((k) => (
                    <td key={k} className="px-3 py-2">{String(row[k] ?? '')}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
    }
    const entries = Object.entries(content)
    if (entries.length === 0) return <p className="text-sm text-muted-foreground">Aucune donnée</p>
    return (
      <div className="space-y-1">
        {entries.map(([k, v]) => (
          <div key={k} className="flex gap-2 text-sm">
            <span className="font-medium text-muted-foreground min-w-[120px]">{k}:</span>
            <span className="flex-1">{typeof v === 'object' ? JSON.stringify(v) : String(v ?? '')}</span>
          </div>
        ))}
      </div>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{data.title}</DialogTitle>
          <DialogDescription>
            {typeLabels[data.type] || data.type}
            {data.createdAt && ` — ${formatDate(data.createdAt)}`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {(data.patient || data.doctor) && (
            <>
              <div className="grid grid-cols-2 gap-4 text-sm">
                {data.patient && (
                  <div>
                    <p className="text-muted-foreground">Patient</p>
                    <p className="font-medium">{data.patient.firstname} {data.patient.lastname}</p>
                    {data.patient.dateOfBirth && <p className="text-xs text-muted-foreground">Né(e) le {data.patient.dateOfBirth}</p>}
                    {data.patient.sex && <p className="text-xs text-muted-foreground">Sexe: {data.patient.sex === 'M' ? 'Masculin' : 'Féminin'}</p>}
                    {data.patient.bloodGroup && <p className="text-xs text-muted-foreground">Groupe sanguin: {data.patient.bloodGroup}</p>}
                  </div>
                )}
                {data.doctor && (
                  <div>
                    <p className="text-muted-foreground">Médecin</p>
                    <p className="font-medium">Dr. {data.doctor.firstname} {data.doctor.lastname}</p>
                    {data.doctor.specialty && <p className="text-xs text-muted-foreground">{data.doctor.specialty}</p>}
                  </div>
                )}
              </div>
              <Separator />
            </>
          )}

          {data.sections.map((section, i) => (
            <div key={i} className="space-y-2">
              <p className="text-sm font-semibold">{section.title}</p>
              {renderContent(section.content)}
            </div>
          ))}
        </div>

        <DialogFooter className="flex-row flex-wrap gap-2 sm:flex-nowrap">
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Imprimer
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportPDF} disabled={exporting === 'pdf'}>
            {exporting === 'pdf' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileDown className="mr-2 h-4 w-4" />}
            PDF
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportExcel} disabled={exporting === 'excel'}>
            {exporting === 'excel' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileSpreadsheet className="mr-2 h-4 w-4" />}
            Excel
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportDOCX} disabled={exporting === 'docx'}>
            {exporting === 'docx' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
            DOCX
          </Button>
          {onNavigate && (
            <Button size="sm" onClick={onNavigate}>
              Voir le détail complet
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
