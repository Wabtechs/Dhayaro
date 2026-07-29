import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return '—'
  const d = new Date(date)
  if (isNaN(d.getTime())) return '—'
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Africa/Lubumbashi',
  }).format(d)
}

export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return '—'
  const d = new Date(date)
  if (isNaN(d.getTime())) return '—'
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Africa/Lubumbashi',
  }).format(d)
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('fr-FR').format(num)
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

const statusLabelMap: Record<string, string> = {
  draft: 'Brouillon',
  active: 'Actif',
  in_review: 'En Revu',
  resolved: 'Résolu',
  archived: 'Archivé',
  pending: 'En attente',
  synced: 'Synchronisé',
  failed: 'Échoué',
}

const statusColorMap: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  active: 'bg-blue-100 text-blue-800',
  in_review: 'bg-yellow-100 text-yellow-800',
  resolved: 'bg-green-100 text-green-800',
  archived: 'bg-purple-100 text-purple-800',
  pending: 'bg-orange-100 text-orange-800',
  synced: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
}

const roleLabelMap: Record<string, string> = {
  admin: 'Admin',
  doctor: 'Médecin',
  nurse: 'Infirmier',
  super_admin: 'Super Admin',
  receptionist: 'Réceptionniste',
  specialist: 'Spécialiste',
  laboratory: 'Laborantin',
  pharmacist: 'Pharmacien',
  accountant: 'Comptable',
  archivist: 'Archiviste',
  patient: 'Patient',
  ADMIN: 'Admin',
  DOCTOR: 'Médecin',
  NURSE: 'Infirmier',
  SUPER_ADMIN: 'Super Admin',
  RECEPTIONIST: 'Réceptionniste',
  SPECIALIST: 'Spécialiste',
  LABORATORY: 'Laborantin',
  PHARMACIST: 'Pharmacien',
  ACCOUNTANT: 'Comptable',
  ARCHIVIST: 'Archiviste',
  PATIENT: 'Patient',
}

export function getStatusLabel(status: string): string {
  return statusLabelMap[status] || status
}

export function getStatusColor(status: string): string {
  return statusColorMap[status] || 'bg-gray-100 text-gray-700'
}

export function getRoleLabel(role: string): string {
  return roleLabelMap[role] || role
}
