import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import type { ClinicalCase } from '@/types';

function getToken(): string {
  return localStorage.getItem('dhayaro_token') || '';
}

function toCamelCase(key: string): string {
  return key.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}

const OUTCOME_MAP: Record<string, string> = {
  PENDING: 'active',
  IN_PROGRESS: 'active',
  SUCCESS: 'resolved',
  FAILURE: 'archived',
};

const STATUS_LABELS: Record<string, string> = {
  draft: 'Brouillon',
  active: 'Actif',
  in_review: 'En revue',
  resolved: 'Résolu',
  archived: 'Archivé',
};

const ROLE_MAP: Record<string, string> = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  RECEPTIONIST: 'receptionist',
  DOCTOR: 'doctor',
  SPECIALIST: 'specialist',
  LABORATORY: 'laboratory',
  PHARMACIST: 'pharmacist',
  NURSE: 'nurse',
  ACCOUNTANT: 'accountant',
  ARCHIVIST: 'archivist',
};

const FACILITY_TYPE_MAP: Record<string, string> = {
  HOSPITAL: 'hospital',
  CLINIC: 'clinic',
  LABORATORY: 'laboratory',
  PHARMACY: 'pharmacy',
};

function transformKeys(obj: unknown): unknown {
  if (Array.isArray(obj)) return obj.map(transformKeys);
  if (obj !== null && typeof obj === 'object' && !(obj instanceof Date)) {
    const entries = Object.entries(obj as Record<string, unknown>).map(([k, v]) => {
      let key = toCamelCase(k);
      let val = transformKeys(v);

      if (key === 'symptomsJson' && val && typeof val === 'object') {
        const d = val as Record<string, unknown>;
        val = d.description ? String(d.description).split(',').map((s: string) => s.trim()) : [];
        key = 'symptoms';
      }
      if (key === 'provisionalDiagnosis') { key = 'diagnosis'; }
      if (key === 'outcomeStatus') {
        val = OUTCOME_MAP[String(val)] || 'active';
        key = 'status';
      }
      if (key === 'doctorId') { key = 'assignedDoctorId'; }
      if (key === 'tagsJson' && val && typeof val === 'object') {
        const d = val as Record<string, unknown>;
        val = Array.isArray(d.tags) ? d.tags : [];
        key = 'tags';
      }
      if (key === 'facilityType') {
        val = FACILITY_TYPE_MAP[String(val)] || String(val).toLowerCase();
        key = 'type';
      }
      if (key === 'firstname') { key = 'firstName'; }
      if (key === 'lastname') { key = 'lastName'; }
      if (key === 'facilityId') { key = 'facilityId'; }
      if (key === 'role' && typeof val === 'string') {
        val = ROLE_MAP[val] || val.toLowerCase();
      }
      if (key === 'sex' && typeof val === 'string') {
        val = val.toLowerCase();
        key = 'gender';
      }
      if (key === 'bloodGroup') { key = 'bloodType'; }
      if (key === 'patientUuid') { key = 'medicalRecordNumber'; }
      if (key === 'resource') { key = 'entity'; }
      if (key === 'resourceId') { key = 'entityId'; }
      if (key === 'userId') { key = 'userId'; }
      if (key === 'ipAddress') { key = 'ipAddress'; }

      return [key, val] as const;
    });

    const result: Record<string, unknown> = {};
    for (const [k, v] of entries) {
      result[k] = v;
    }

    if (!result.title && result.diagnosis) { result.title = result.diagnosis; }
    if (!result.description && result.diagnosis) { result.description = result.diagnosis; }
    if (!result.priority) { result.priority = 'medium'; }
    if (!Array.isArray(result.symptoms)) { result.symptoms = []; }
    if (!Array.isArray(result.tags)) { result.tags = []; }

    if (result.firstname && result.lastname && !result.name) {
      result.name = `${result.firstname} ${result.lastname}`;
    }

    if (result.firstName && result.lastName && !result.name) {
      result.name = `${result.firstName} ${result.lastName}`;
    }

    if (result.details && typeof result.details === 'object' && !Array.isArray(result.details)) {
      const d = result.details as Record<string, unknown>;
      result.details = Object.entries(d).map(([k, v]) => `${k}: ${v}`).join(', ');
    }

    if (!result.type && FACILITY_TYPE_MAP[result.facilityType as string]) {
      result.type = FACILITY_TYPE_MAP[result.facilityType as string];
    }

    if (!result.gender && result.sex) {
      result.gender = String(result.sex).toLowerCase();
    }

    if (!result.bloodType && result.bloodGroup) {
      result.bloodType = result.bloodGroup;
    }

    if (!result.medicalRecordNumber && result.patientUuid) {
      result.medicalRecordNumber = result.patientUuid;
    }

    if (!result.entity && result.resource) {
      result.entity = result.resource;
    }

    if (!result.entityId && result.resourceId) {
      result.entityId = result.resourceId;
    }

    if (!result.facility && result.facilityId) {
      result.facility = result.facilityId;
    }

    return result;
  }
  return obj;
}

async function fetchData<T>(endpoint: string): Promise<T> {
  const token = getToken();
  const raw = await api.get<unknown>(endpoint, token);
  return transformKeys(raw) as T;
}

export function useDashboardData() {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      try {
        const token = getToken();
        const [rawStats, rawCases, rawPatients, rawFacilities] = await Promise.all([
          api.get<unknown>('/clinical-cases/stats', token).catch(() => null),
          api.get<unknown>('/clinical-cases?page=1&size=100', token).catch(() => null),
          api.get<unknown>('/patients', token).catch(() => null),
          api.get<unknown>('/facilities', token).catch(() => null),
        ]);
        const apiStats = transformKeys(rawStats) as { total?: number; pending?: number; inProgress?: number; success?: number; failure?: number } | null;
        const cases = transformKeys(rawCases) as { items: ClinicalCase[]; total: number } | null;
        const patients = transformKeys(rawPatients) as { total?: number } | null;
        const facilities = transformKeys(rawFacilities) as { total?: number } | null;

        const totalCases = apiStats?.total ?? cases?.items?.length ?? 0;
        const totalPatients = patients?.total ?? 0;
        const totalFacilities = facilities?.total ?? 0;
        const successCount = apiStats?.success ?? 0;
        const resolutionRate = totalCases > 0 ? Math.round((successCount / totalCases) * 100) : 0;

        const patientItems = (patients as unknown as { items?: Array<{ id: string; firstName?: string; lastName?: string; name?: string }> })?.items || [];
        const facilityItems = (facilities as unknown as { items?: Array<{ id: string; name: string }> })?.items || [];
        const patientMap = Object.fromEntries(patientItems.map((p) => [p.id, p.firstName && p.lastName ? `${p.firstName} ${p.lastName}` : p.name || '—']));
        const facilityMap = Object.fromEntries(facilityItems.map((f) => [f.id, f.name]));

        const allCases = cases?.items || [];
        const recentCases = allCases.slice(0, 5);

        const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
        const casesByMonthMap = new Map<string, number>();
        monthNames.forEach(m => casesByMonthMap.set(m, 0));
        allCases.forEach(c => {
          const date = new Date(c.createdAt);
          if (!isNaN(date.getTime())) {
            const month = monthNames[date.getMonth()];
            casesByMonthMap.set(month, (casesByMonthMap.get(month) || 0) + 1);
          }
        });
        const casesByMonth = monthNames.map(name => ({ name, value: casesByMonthMap.get(name) || 0 }));

        const statusCounts = new Map<string, number>();
        allCases.forEach(c => {
          const label = STATUS_LABELS[c.status] || c.status;
          statusCounts.set(label, (statusCounts.get(label) || 0) + 1);
        });
        const casesByStatus = Array.from(statusCounts.entries()).map(([name, value]) => ({ name, value })).filter(item => item.value > 0);

        return {
          stats: {
            total_cases: totalCases,
            total_patients: totalPatients,
            total_facilities: totalFacilities,
            resolution_rate: resolutionRate,
          },
          recentCases,
          patientMap,
          facilityMap,
          chartData: {
            casesByMonth,
            casesByStatus,
          },
        };
      } catch {
        return {
          stats: {
            total_cases: 0,
            total_patients: 0,
            total_facilities: 0,
            resolution_rate: 0,
          },
          recentCases: [],
          patientMap: {},
          facilityMap: {},
          chartData: {
            casesByMonth: [],
            casesByStatus: [],
          },
        };
      }
    },
  });
}

export function useClinicalCasesData() {
  return useQuery({
    queryKey: ['clinical-cases'],
    queryFn: () => fetchData<{ items: ClinicalCase[]; total: number }>('/clinical-cases'),
  });
}

export function usePatientsData() {
  return useQuery({
    queryKey: ['patients'],
    queryFn: () => fetchData<{ items: unknown[]; total: number }>('/patients'),
  });
}

export function useFacilitiesData() {
  return useQuery({
    queryKey: ['facilities'],
    queryFn: () => fetchData<{ items: unknown[]; total: number }>('/facilities'),
  });
}

export function useUsersData() {
  return useQuery({
    queryKey: ['users'],
    queryFn: () => fetchData<{ items: unknown[]; total: number }>('/users'),
  });
}

export function useAuditData() {
  return useQuery({
    queryKey: ['audit'],
    queryFn: () => fetchData<{ items: unknown[]; total: number }>('/audit'),
  });
}

export function useSyncData() {
  return useQuery({
    queryKey: ['sync'],
    queryFn: () => fetchData<{ items: unknown[]; total: number }>('/sync/pull'),
  });
}

export function useNotificationsData() {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: () => fetchData<{ items: unknown[]; total: number; unreadCount: number }>('/notifications'),
  });
}

export function useTreatmentsData() {
  return useQuery({
    queryKey: ['treatments'],
    queryFn: async () => {
      const data = await fetchData<{ items: ClinicalCase[]; total: number }>('/clinical-cases');
      const withTreatment = data.items.filter((c) => c.treatment);
      return { items: withTreatment, total: withTreatment.length };
    },
  });
}

export function useStudiesData() {
  return useQuery({
    queryKey: ['studies'],
    queryFn: async () => {
      const data = await fetchData<{ items: ClinicalCase[]; total: number }>('/clinical-cases');
      const resolved = data.items.filter((c) => c.status === 'resolved');
      return { items: resolved, total: resolved.length };
    },
  });
}

export function usePatientDetail(id: string) {
  return useQuery({
    queryKey: ['patient', id],
    queryFn: () => fetchData<unknown>(`/patients/${id}`),
    enabled: !!id,
  });
}

export function useClinicalCaseDetail(id: string) {
  return useQuery({
    queryKey: ['clinical-case', id],
    queryFn: () => fetchData<unknown>(`/clinical-cases/${id}`),
    enabled: !!id,
  });
}

export function useFacilityDetail(id: string) {
  return useQuery({
    queryKey: ['facility', id],
    queryFn: () => fetchData<unknown>(`/facilities/${id}`),
    enabled: !!id,
  });
}

function useToken() {
  return getToken();
}

export function useUpdatePatient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Record<string, unknown> }) => {
      const token = useToken();
      return api.put<unknown>(`/patients/${id}`, data, token);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      queryClient.invalidateQueries({ queryKey: ['patient', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useUpdateClinicalCase() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Record<string, unknown> }) => {
      const token = useToken();
      return api.put<unknown>(`/clinical-cases/${id}`, data, token);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['clinical-cases'] });
      queryClient.invalidateQueries({ queryKey: ['clinical-case', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useUpdateFacility() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Record<string, unknown> }) => {
      const token = useToken();
      return api.put<unknown>(`/facilities/${id}`, data, token);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['facilities'] });
      queryClient.invalidateQueries({ queryKey: ['facility', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Record<string, unknown> }) => {
      const token = useToken();
      return api.put<unknown>(`/users/${id}`, data, token);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['user', variables.id] });
    },
  });
}

export function useDeletePatient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const token = useToken();
      return api.delete<unknown>(`/patients/${id}`, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useDeleteClinicalCase() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const token = useToken();
      return api.delete<unknown>(`/clinical-cases/${id}`, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clinical-cases'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useDeleteFacility() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const token = useToken();
      return api.delete<unknown>(`/facilities/${id}`, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['facilities'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const token = useToken();
      return api.delete<unknown>(`/users/${id}`, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

export function useConsultationsData(params?: string) {
  return useQuery({
    queryKey: ['consultations', params],
    queryFn: () => fetchData<{ items: unknown[]; total: number }>(`/consultations${params ? '?' + params : ''}`),
  });
}

export function useDiagnosticsData(params?: string) {
  return useQuery({
    queryKey: ['diagnostics', params],
    queryFn: () => fetchData<{ items: unknown[]; total: number }>(`/diagnostics${params ? '?' + params : ''}`),
  });
}

export function useDiseasesData(params?: string) {
  return useQuery({
    queryKey: ['diseases', params],
    queryFn: () => fetchData<{ items: unknown[]; total: number }>(`/diseases${params ? '?' + params : ''}`),
  });
}

export function useTreatmentsListData(params?: string) {
  return useQuery({
    queryKey: ['treatments-list', params],
    queryFn: () => fetchData<{ items: unknown[]; total: number }>(`/treatments${params ? '?' + params : ''}`),
  });
}

export function useLabExamsData(params?: string) {
  return useQuery({
    queryKey: ['lab-exams', params],
    queryFn: () => fetchData<{ items: unknown[]; total: number }>(`/lab/exams${params ? '?' + params : ''}`),
  });
}

export function useQueueData(params?: string) {
  return useQuery({
    queryKey: ['queue', params],
    queryFn: () => fetchData<{ items: unknown[]; total: number }>(`/queue${params ? '?' + params : ''}`),
  });
}

export function useDocumentsData(params?: string) {
  return useQuery({
    queryKey: ['documents', params],
    queryFn: () => fetchData<{ items: unknown[]; total: number }>(`/documents${params ? '?' + params : ''}`),
  });
}

export function useArchivesData(params?: string) {
  return useQuery({
    queryKey: ['archives', params],
    queryFn: () => fetchData<{ items: unknown[]; total: number }>(`/archives${params ? '?' + params : ''}`),
  });
}
