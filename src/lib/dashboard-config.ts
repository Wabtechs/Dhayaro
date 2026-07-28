import type { UserRole } from '@/types'

export interface DashboardStatCard {
  key: string
  title: string
  iconName: string
  statKey: string
  href: string
  color: string
}

export interface DashboardQuickAction {
  label: string
  iconName: string
  href: string
  color: string
}

export interface DashboardChart {
  type: 'area' | 'pie' | 'bar'
  title: string
  description: string
  dataKey: string
}

export interface DashboardActivityColumn {
  key: string
  label: string
}

export interface DashboardConfig {
  statsCards: DashboardStatCard[]
  quickActions: DashboardQuickAction[]
  charts: DashboardChart[]
  recentActivityTitle: string
  recentActivityLink: string
  recentActivityLinkLabel: string
  activityColumns: DashboardActivityColumn[]
}

const RECEPTIONIST_CONFIG: DashboardConfig = {
  statsCards: [
    { key: 'queue', title: 'File d\'attente', iconName: 'ListOrdered', statKey: 'queueWaiting', href: '/queue', color: 'bg-orange-500/10 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400' },
    { key: 'patients', title: 'Patients enregistrés', iconName: 'UserRound', statKey: 'totalPatients', href: '/patients', color: 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400' },
    { key: 'consultations', title: 'Consultations aujourd\'hui', iconName: 'Stethoscope', statKey: 'consultationsToday', href: '/consultations', color: 'bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400' },
    { key: 'episodes', title: 'Épisodes de soins', iconName: 'ClipboardList', statKey: 'totalEpisodes', href: '/care-episodes', color: 'bg-violet-500/10 text-violet-600 dark:bg-violet-500/20 dark:text-violet-400' },
  ],
  quickActions: [
    { label: 'File d\'attente', iconName: 'ListOrdered', href: '/queue', color: 'text-orange-500' },
    { label: 'Nouveau patient', iconName: 'UserPlus', href: '/patients', color: 'text-emerald-500' },
    { label: 'Consultations', iconName: 'Stethoscope', href: '/consultations', color: 'text-blue-500' },
    { label: 'Documents', iconName: 'FileText', href: '/documents', color: 'text-purple-500' },
  ],
  charts: [
    { type: 'area', title: 'Admissions par Mois', description: 'Évolution mensuelle des admissions', dataKey: 'consultationsByMonth' },
    { type: 'pie', title: 'Répartition par Priorité', description: 'Distribution des entrées en file d\'attente', dataKey: 'queueByPriority' },
  ],
  recentActivityTitle: 'Dernières Admissions',
  recentActivityLink: '/queue',
  recentActivityLinkLabel: 'Voir la file',
  activityColumns: [
    { key: 'ticket', label: 'Ticket' },
    { key: 'patient', label: 'Patient' },
    { key: 'priority', label: 'Priorité' },
    { key: 'status', label: 'Statut' },
    { key: 'date', label: 'Heure d\'arrivée' },
  ],
}

const DOCTOR_CONFIG: DashboardConfig = {
  statsCards: [
    { key: 'consultations', title: 'Consultations', iconName: 'Stethoscope', statKey: 'totalConsultations', href: '/consultations', color: 'bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400' },
    { key: 'patients', title: 'Patients', iconName: 'UserRound', statKey: 'totalPatients', href: '/patients', color: 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400' },
    { key: 'diagnostics', title: 'Diagnostics', iconName: 'Brain', statKey: 'totalDiagnostics', href: '/diagnostics', color: 'bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400' },
    { key: 'lab', title: 'Examens labo', iconName: 'TestTubes', statKey: 'labExamsPending', href: '/laboratory', color: 'bg-teal-500/10 text-teal-600 dark:bg-teal-500/20 dark:text-teal-400' },
  ],
  quickActions: [
    { label: 'Consultations', iconName: 'Stethoscope', href: '/consultations', color: 'text-blue-500' },
    { label: 'Patients', iconName: 'UserRound', href: '/patients', color: 'text-emerald-500' },
    { label: 'Diagnostics', iconName: 'Brain', href: '/diagnostics', color: 'text-amber-500' },
    { label: 'Prescriptions', iconName: 'Pill', href: '/treatments', color: 'text-red-500' },
  ],
  charts: [
    { type: 'area', title: 'Consultations par Mois', description: 'Évolution mensuelle de vos consultations', dataKey: 'consultationsByMonth' },
    { type: 'pie', title: 'Répartition par Statut', description: 'Distribution de vos consultations', dataKey: 'consultationsByStatus' },
  ],
  recentActivityTitle: 'Consultations Récentes',
  recentActivityLink: '/consultations',
  recentActivityLinkLabel: 'Voir tout',
  activityColumns: [
    { key: 'consultation', label: 'Consultation' },
    { key: 'patient', label: 'Patient' },
    { key: 'diagnosis', label: 'Diagnostic' },
    { key: 'status', label: 'Statut' },
    { key: 'date', label: 'Date' },
  ],
}

const NURSE_CONFIG: DashboardConfig = {
  statsCards: [
    { key: 'hospitalized', title: 'Hospitalisés', iconName: 'BedDouble', statKey: 'hospitalizedPatients', href: '/care-episodes', color: 'bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400' },
    { key: 'treatments', title: 'Traitements à administrer', iconName: 'Pill', statKey: 'treatmentsPending', href: '/treatments', color: 'bg-red-500/10 text-red-600 dark:bg-red-500/20 dark:text-red-400' },
    { key: 'queue', title: 'File d\'attente', iconName: 'ListOrdered', statKey: 'queueWaiting', href: '/queue', color: 'bg-orange-500/10 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400' },
    { key: 'episodes', title: 'Épisodes actifs', iconName: 'ClipboardList', statKey: 'activeEpisodes', href: '/care-episodes', color: 'bg-violet-500/10 text-violet-600 dark:bg-violet-500/20 dark:text-violet-400' },
  ],
  quickActions: [
    { label: 'Hospitalisés', iconName: 'BedDouble', href: '/care-episodes', color: 'text-blue-500' },
    { label: 'Traitements', iconName: 'Pill', href: '/treatments', color: 'text-red-500' },
    { label: 'File d\'attente', iconName: 'ListOrdered', href: '/queue', color: 'text-orange-500' },
    { label: 'Patients', iconName: 'UserRound', href: '/patients', color: 'text-emerald-500' },
  ],
  charts: [
    { type: 'area', title: 'Épisodes par Mois', description: 'Évolution mensuelle des épisodes de soins', dataKey: 'episodesByMonth' },
    { type: 'pie', title: 'Statut des Épisodes', description: 'Distribution des épisodes de soins', dataKey: 'episodesByStatus' },
  ],
  recentActivityTitle: 'Soins Récents',
  recentActivityLink: '/care-episodes',
  recentActivityLinkLabel: 'Voir tout',
  activityColumns: [
    { key: 'episode', label: 'Épisode' },
    { key: 'patient', label: 'Patient' },
    { key: 'status', label: 'Statut' },
    { key: 'admitDate', label: 'Date d\'admission' },
  ],
}

const LABORATORY_CONFIG: DashboardConfig = {
  statsCards: [
    { key: 'pending', title: 'Examens en attente', iconName: 'Clock', statKey: 'labExamsPending', href: '/laboratory', color: 'bg-orange-500/10 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400' },
    { key: 'inProgress', title: 'En cours', iconName: 'Loader', statKey: 'labExamsInProgress', href: '/laboratory', color: 'bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400' },
    { key: 'completed', title: 'Complétés', iconName: 'CheckCircle', statKey: 'labExamsCompleted', href: '/laboratory', color: 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400' },
    { key: 'validated', title: 'Validés', iconName: 'ShieldCheck', statKey: 'labExamsValidated', href: '/laboratory', color: 'bg-violet-500/10 text-violet-600 dark:bg-violet-500/20 dark:text-violet-400' },
  ],
  quickActions: [
    { label: 'Examens en attente', iconName: 'Clock', href: '/laboratory', color: 'text-orange-500' },
    { label: 'Résultats', iconName: 'FileCheck', href: '/laboratory', color: 'text-emerald-500' },
    { label: 'Catégories', iconName: 'FolderOpen', href: '/laboratory', color: 'text-blue-500' },
    { label: 'Documents', iconName: 'FileText', href: '/documents', color: 'text-purple-500' },
  ],
  charts: [
    { type: 'area', title: 'Examens par Mois', description: 'Évolution mensuelle des examens de laboratoire', dataKey: 'labExamsByMonth' },
    { type: 'pie', title: 'Répartition par Statut', description: 'Distribution des examens selon leur statut', dataKey: 'labExamsByStatus' },
  ],
  recentActivityTitle: 'Examens Récents',
  recentActivityLink: '/laboratory',
  recentActivityLinkLabel: 'Voir tout',
  activityColumns: [
    { key: 'exam', label: 'Examen' },
    { key: 'patient', label: 'Patient' },
    { key: 'doctor', label: 'Médecin prescripteur' },
    { key: 'status', label: 'Statut' },
    { key: 'date', label: 'Date' },
  ],
}

const PHARMACIST_CONFIG: DashboardConfig = {
  statsCards: [
    { key: 'prescriptions', title: 'Prescriptions en attente', iconName: 'ClipboardList', statKey: 'prescriptionsPending', href: '/treatments', color: 'bg-orange-500/10 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400' },
    { key: 'dispensed', title: 'Délivrés aujourd\'hui', iconName: 'CheckCircle', statKey: 'prescriptionsDispensedToday', href: '/treatments', color: 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400' },
    { key: 'treatments', title: 'Traitements actifs', iconName: 'Pill', statKey: 'activeTreatments', href: '/treatments', color: 'bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400' },
    { key: 'medications', title: 'Médicaments', iconName: 'Package', statKey: 'totalMedications', href: '/diseases', color: 'bg-violet-500/10 text-violet-600 dark:bg-violet-500/20 dark:text-violet-400' },
  ],
  quickActions: [
    { label: 'Prescriptions', iconName: 'ClipboardList', href: '/treatments', color: 'text-orange-500' },
    { label: 'Traitements', iconName: 'Pill', href: '/treatments', color: 'text-blue-500' },
    { label: 'Maladies', iconName: 'BookOpen', href: '/diseases', color: 'text-emerald-500' },
    { label: 'Documents', iconName: 'FileText', href: '/documents', color: 'text-purple-500' },
  ],
  charts: [
    { type: 'area', title: 'Prescriptions par Mois', description: 'Évolution mensuelle des prescriptions', dataKey: 'treatmentsByMonth' },
    { type: 'pie', title: 'Statut des Traitements', description: 'Distribution des traitements', dataKey: 'treatmentsByStatus' },
  ],
  recentActivityTitle: 'Prescriptions Récentes',
  recentActivityLink: '/treatments',
  recentActivityLinkLabel: 'Voir tout',
  activityColumns: [
    { key: 'treatment', label: 'Traitement' },
    { key: 'patient', label: 'Patient' },
    { key: 'status', label: 'Statut' },
    { key: 'date', label: 'Date' },
  ],
}

const SPECIALIST_CONFIG: DashboardConfig = {
  statsCards: [
    { key: 'consultations', title: 'Consultations spécialisées', iconName: 'Stethoscope', statKey: 'totalConsultations', href: '/consultations', color: 'bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400' },
    { key: 'patients', title: 'Patients', iconName: 'UserRound', statKey: 'totalPatients', href: '/patients', color: 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400' },
    { key: 'diagnostics', title: 'Diagnostics validés', iconName: 'Brain', statKey: 'validatedDiagnostics', href: '/diagnostics', color: 'bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400' },
    { key: 'lab', title: 'Examens labo', iconName: 'TestTubes', statKey: 'labExamsTotal', href: '/laboratory', color: 'bg-teal-500/10 text-teal-600 dark:bg-teal-500/20 dark:text-teal-400' },
  ],
  quickActions: [
    { label: 'Consultations', iconName: 'Stethoscope', href: '/consultations', color: 'text-indigo-500' },
    { label: 'Diagnostics', iconName: 'Brain', href: '/diagnostics', color: 'text-amber-500' },
    { label: 'Protocoles', iconName: 'BookMarked', href: '/protocols', color: 'text-emerald-500' },
    { label: 'Connaissances', iconName: 'Lightbulb', href: '/knowledge-base', color: 'text-purple-500' },
  ],
  charts: [
    { type: 'area', title: 'Consultations par Mois', description: 'Évolution de vos consultations spécialisées', dataKey: 'consultationsByMonth' },
    { type: 'pie', title: 'Diagnostics par Type', description: 'Distribution des types de diagnostics', dataKey: 'diagnosticsByType' },
  ],
  recentActivityTitle: 'Consultations Récentes',
  recentActivityLink: '/consultations',
  recentActivityLinkLabel: 'Voir tout',
  activityColumns: [
    { key: 'consultation', label: 'Consultation' },
    { key: 'patient', label: 'Patient' },
    { key: 'diagnosis', label: 'Diagnostic' },
    { key: 'status', label: 'Statut' },
    { key: 'date', label: 'Date' },
  ],
}

const ADMIN_CONFIG: DashboardConfig = {
  statsCards: [
    { key: 'users', title: 'Utilisateurs', iconName: 'Users', statKey: 'totalUsers', href: '/users', color: 'bg-purple-500/10 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400' },
    { key: 'patients', title: 'Patients', iconName: 'UserRound', statKey: 'totalPatients', href: '/patients', color: 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400' },
    { key: 'consultations', title: 'Consultations', iconName: 'Stethoscope', statKey: 'totalConsultations', href: '/consultations', color: 'bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400' },
    { key: 'resolution', title: 'Taux de Résolution', iconName: 'TrendingUp', statKey: 'resolutionRate', href: '/reports', color: 'bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400' },
  ],
  quickActions: [
    { label: 'Utilisateurs', iconName: 'Users', href: '/users', color: 'text-purple-500' },
    { label: 'Patients', iconName: 'UserRound', href: '/patients', color: 'text-emerald-500' },
    { label: 'Consultations', iconName: 'Stethoscope', href: '/consultations', color: 'text-blue-500' },
    { label: 'Paramètres', iconName: 'Settings', href: '/settings', color: 'text-gray-500' },
  ],
  charts: [
    { type: 'area', title: 'Activité par Mois', description: 'Évolution mensuelle de l\'activité', dataKey: 'consultationsByMonth' },
    { type: 'pie', title: 'Répartition par Statut', description: 'Distribution des cas', dataKey: 'casesByStatus' },
  ],
  recentActivityTitle: 'Activité Récente',
  recentActivityLink: '/audit',
  recentActivityLinkLabel: 'Journal d\'audit',
  activityColumns: [
    { key: 'action', label: 'Action' },
    { key: 'entity', label: 'Entité' },
    { key: 'user', label: 'Utilisateur' },
    { key: 'date', label: 'Date' },
  ],
}

const SUPER_ADMIN_CONFIG: DashboardConfig = {
  statsCards: [
    { key: 'facilities', title: 'Établissements', iconName: 'Building2', statKey: 'totalFacilities', href: '/facilities', color: 'bg-violet-500/10 text-violet-600 dark:bg-violet-500/20 dark:text-violet-400' },
    { key: 'users', title: 'Utilisateurs', iconName: 'Users', statKey: 'totalUsers', href: '/users', color: 'bg-purple-500/10 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400' },
    { key: 'patients', title: 'Patients', iconName: 'UserRound', statKey: 'totalPatients', href: '/patients', color: 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400' },
    { key: 'consultations', title: 'Consultations', iconName: 'Stethoscope', statKey: 'totalConsultations', href: '/consultations', color: 'bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400' },
  ],
  quickActions: [
    { label: 'Établissements', iconName: 'Building2', href: '/facilities', color: 'text-violet-500' },
    { label: 'Utilisateurs', iconName: 'Users', href: '/users', color: 'text-purple-500' },
    { label: 'Paramètres', iconName: 'Settings', href: '/settings', color: 'text-gray-500' },
    { label: 'Audit', iconName: 'Shield', href: '/audit', color: 'text-red-500' },
  ],
  charts: [
    { type: 'area', title: 'Activité Globale par Mois', description: 'Évolution mensuelle de l\'activité globale', dataKey: 'consultationsByMonth' },
    { type: 'pie', title: 'Répartition par Établissement', description: 'Distribution des cas par établissement', dataKey: 'casesByFacility' },
  ],
  recentActivityTitle: 'Activité Système',
  recentActivityLink: '/audit',
  recentActivityLinkLabel: 'Journal d\'audit',
  activityColumns: [
    { key: 'action', label: 'Action' },
    { key: 'entity', label: 'Entité' },
    { key: 'user', label: 'Utilisateur' },
    { key: 'facility', label: 'Établissement' },
    { key: 'date', label: 'Date' },
  ],
}

const ACCOUNTANT_CONFIG: DashboardConfig = {
  statsCards: [
    { key: 'consultations', title: 'Consultations', iconName: 'Stethoscope', statKey: 'totalConsultations', href: '/consultations', color: 'bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400' },
    { key: 'patients', title: 'Patients', iconName: 'UserRound', statKey: 'totalPatients', href: '/patients', color: 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400' },
    { key: 'lab', title: 'Examens labo', iconName: 'TestTubes', statKey: 'labExamsTotal', href: '/laboratory', color: 'bg-teal-500/10 text-teal-600 dark:bg-teal-500/20 dark:text-teal-400' },
    { key: 'reports', title: 'Rapports', iconName: 'BarChart3', statKey: 'totalReports', href: '/reports', color: 'bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400' },
  ],
  quickActions: [
    { label: 'Rapports', iconName: 'BarChart3', href: '/reports', color: 'text-amber-500' },
    { label: 'Consultations', iconName: 'Stethoscope', href: '/consultations', color: 'text-blue-500' },
    { label: 'Patients', iconName: 'UserRound', href: '/patients', color: 'text-emerald-500' },
    { label: 'Analytics', iconName: 'TrendingUp', href: '/analytics', color: 'text-purple-500' },
  ],
  charts: [
    { type: 'area', title: 'Activité par Mois', description: 'Évolution mensuelle', dataKey: 'consultationsByMonth' },
    { type: 'pie', title: 'Répartition par Statut', description: 'Distribution des cas', dataKey: 'casesByStatus' },
  ],
  recentActivityTitle: 'Activité Récente',
  recentActivityLink: '/reports',
  recentActivityLinkLabel: 'Voir rapports',
  activityColumns: [
    { key: 'consultation', label: 'Consultation' },
    { key: 'patient', label: 'Patient' },
    { key: 'status', label: 'Statut' },
    { key: 'date', label: 'Date' },
  ],
}

const ARCHIVIST_CONFIG: DashboardConfig = {
  statsCards: [
    { key: 'archives', title: 'Archives', iconName: 'Archive', statKey: 'totalArchives', href: '/archives', color: 'bg-gray-500/10 text-gray-600 dark:bg-gray-500/20 dark:text-gray-400' },
    { key: 'documents', title: 'Documents', iconName: 'FileText', statKey: 'totalDocuments', href: '/documents', color: 'bg-purple-500/10 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400' },
    { key: 'consultations', title: 'Consultations', iconName: 'Stethoscope', statKey: 'totalConsultations', href: '/consultations', color: 'bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400' },
    { key: 'episodes', title: 'Épisodes archivés', iconName: 'ClipboardList', statKey: 'archivedEpisodes', href: '/care-episodes', color: 'bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400' },
  ],
  quickActions: [
    { label: 'Archives', iconName: 'Archive', href: '/archives', color: 'text-gray-500' },
    { label: 'Documents', iconName: 'FileText', href: '/documents', color: 'text-purple-500' },
    { label: 'Consultations', iconName: 'Stethoscope', href: '/consultations', color: 'text-blue-500' },
    { label: 'Épisodes', iconName: 'ClipboardList', href: '/care-episodes', color: 'text-amber-500' },
  ],
  charts: [
    { type: 'area', title: 'Archives par Mois', description: 'Évolution mensuelle des archivages', dataKey: 'archivesByMonth' },
    { type: 'pie', title: 'Types d\'Archives', description: 'Distribution par type d\'entité', dataKey: 'archivesByType' },
  ],
  recentActivityTitle: 'Archives Récentes',
  recentActivityLink: '/archives',
  recentActivityLinkLabel: 'Voir tout',
  activityColumns: [
    { key: 'title', label: 'Titre' },
    { key: 'entity', label: 'Type' },
    { key: 'date', label: 'Date' },
  ],
}

const PATIENT_CONFIG: DashboardConfig = {
  statsCards: [
    { key: 'documents', title: 'Documents', iconName: 'FileText', statKey: 'totalDocuments', href: '/documents', color: 'bg-purple-500/10 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400' },
    { key: 'notifications', title: 'Notifications', iconName: 'Bell', statKey: 'unreadNotifications', href: '/notifications', color: 'bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400' },
  ],
  quickActions: [
    { label: 'Documents', iconName: 'FileText', href: '/documents', color: 'text-purple-500' },
    { label: 'Notifications', iconName: 'Bell', href: '/notifications', color: 'text-blue-500' },
  ],
  charts: [],
  recentActivityTitle: 'Notifications Récentes',
  recentActivityLink: '/notifications',
  recentActivityLinkLabel: 'Voir tout',
  activityColumns: [
    { key: 'title', label: 'Titre' },
    { key: 'message', label: 'Message' },
    { key: 'date', label: 'Date' },
  ],
}

const ROLE_DASHBOARD_MAP: Record<UserRole, DashboardConfig> = {
  super_admin: SUPER_ADMIN_CONFIG,
  admin: ADMIN_CONFIG,
  receptionist: RECEPTIONIST_CONFIG,
  doctor: DOCTOR_CONFIG,
  specialist: SPECIALIST_CONFIG,
  laboratory: LABORATORY_CONFIG,
  pharmacist: PHARMACIST_CONFIG,
  nurse: NURSE_CONFIG,
  accountant: ACCOUNTANT_CONFIG,
  archivist: ARCHIVIST_CONFIG,
  patient: PATIENT_CONFIG,
}

export function getDashboardConfig(role: UserRole): DashboardConfig {
  return ROLE_DASHBOARD_MAP[role] ?? ADMIN_CONFIG
}
