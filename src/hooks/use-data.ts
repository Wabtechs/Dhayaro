import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import type { ClinicalCase, UserRole } from '@/types';

function getToken(): string {
  return localStorage.getItem('dhayaro_token') || '';
}

interface RoleDashboardResponse {
  role: string
  stats: Record<string, number>
  charts: Record<string, Array<{ name: string; value: number }>>
}

function toCamelCase(key: string): string {
  return key.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}

const OUTCOME_MAP: Record<string, string> = {
  PENDING: 'draft',
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
      if (key === 'outcomeStatus') {
        val = OUTCOME_MAP[String(val)] || 'active';
        key = 'status';
      }
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
      if (key === 'role' && typeof val === 'string') {
        val = val.toLowerCase();
      }
      if (key === 'bloodGroup') { key = 'bloodType'; }
      if (key === 'patientUuid') { key = 'medicalRecordNumber'; }
      if (key === 'resource') { key = 'entity'; }
      if (key === 'resourceId') { key = 'entityId'; }
      if (key === 'isRead') { key = 'read'; }

      return [key, val] as const;
    });

    const result: Record<string, unknown> = {};
    for (const [k, v] of entries) {
      result[k] = v;
    }

    if (!result.title && result.diagnosis) { result.title = result.diagnosis; }
    if (!Array.isArray(result.symptoms)) { result.symptoms = []; }
    if (!Array.isArray(result.tags)) { result.tags = []; }

    if (result.firstName && result.lastName && !result.name) {
      result.name = `${result.firstName} ${result.lastName}`;
    }

    if (result.patientFirstname && result.patientLastname && !result.patientName) {
      result.patientName = `${result.patientFirstname} ${result.patientLastname}`;
    }

    if (result.doctorFirstname && result.doctorLastname && !result.doctorName) {
      result.doctorName = `${result.doctorFirstname} ${result.doctorLastname}`;
    }

    if (result.details && typeof result.details === 'object' && !Array.isArray(result.details)) {
      const d = result.details as Record<string, unknown>;
      result.details = Object.entries(d).map(([k, v]) => `${k}: ${v}`).join(', ');
    }

    if (!result.facility && result.facilityId) {
      result.facility = result.facilityId;
    }

    return result;
  }
  return obj;
}

const OUTCOME_TO_STATUS: Record<string, string> = {
  PENDING: 'draft',
  IN_PROGRESS: 'active',
  SUCCESS: 'resolved',
  FAILURE: 'archived',
}

function transformClinicalCase(obj: unknown): unknown {
  if (Array.isArray(obj)) return obj.map(transformClinicalCase);
  if (obj !== null && typeof obj === 'object' && !(obj instanceof Date)) {
    const result = transformKeys(obj) as Record<string, unknown>;
    if ('doctorId' in result) {
      result.assignedDoctorId = result.doctorId;
      delete result.doctorId;
    }
    if ('provisionalDiagnosis' in result) {
      result.diagnosis = result.provisionalDiagnosis;
      delete result.provisionalDiagnosis;
    }
    if (result.status === undefined) {
      const outcome = (result.outcomeStatus as string) || 'PENDING';
      result.status = OUTCOME_TO_STATUS[outcome] || 'draft';
    }
    if (result.priority === 'urgent') result.priority = 'critical';
    return result;
  }
  return obj;
}

async function fetchData<T>(endpoint: string, facilityOverride?: string): Promise<T> {
  const token = getToken();
  const activeFacility = facilityOverride ?? (typeof window !== 'undefined' ? localStorage.getItem('dhayaro_active_facility') : null);
  const sep = endpoint.includes('?') ? '&' : '?';
  const url = activeFacility ? `${endpoint}${sep}facilityId=${activeFacility}` : endpoint;
  const raw = await api.get<unknown>(url, token);
  return transformKeys(raw) as T;
}

export function useDashboardData() {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      try {
        const token = getToken();
        const activeFacility = typeof window !== 'undefined' ? localStorage.getItem('dhayaro_active_facility') : null;
        const ff = activeFacility ? `?facilityId=${activeFacility}` : '';
        const [rawStats, rawCases, rawPatients, rawFacilities] = await Promise.all([
          api.get<unknown>(`/clinical-cases/stats${ff}`, token).catch(() => null),
          api.get<unknown>(`/clinical-cases?page=1&size=100${ff}`, token).catch(() => null),
          api.get<unknown>(`/patients${ff}`, token).catch(() => null),
          api.get<unknown>(`/facilities${ff}`, token).catch(() => null),
        ]);
        const apiStats = transformKeys(rawStats) as { total?: number; pending?: number; inProgress?: number; success?: number; failure?: number } | null;
        const cases = transformClinicalCase(rawCases) as { items: ClinicalCase[]; total: number } | null;
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

export function useRoleDashboardData(userRole?: UserRole) {
  return useQuery({
    queryKey: ['role-dashboard', userRole],
    staleTime: 30000,
    gcTime: 60000,
    refetchInterval: 60000,
    queryFn: async () => {
      try {
        const data = await fetchData<RoleDashboardResponse>('/dashboard/stats');
        return data;
      } catch {
        return {
          role: userRole || 'admin',
          stats: {} as Record<string, number>,
          charts: {} as Record<string, Array<{ name: string; value: number }>>,
        } as RoleDashboardResponse;
      }
    },
  });
}

export function useClinicalCasesData(params?: string) {
  return useQuery({
    queryKey: ['clinical-cases', params],
    queryFn: async () => {
      const raw = await fetchData<{ items: unknown[]; total: number }>(`/clinical-cases${params ? '?' + params : '?size=100'}`, undefined);
      return { items: raw.items.map(transformClinicalCase) as ClinicalCase[], total: raw.total };
    },
  });
}

export function usePatientsData(facilityId?: string, params?: string) {
  const queryParams = params || ''
  return useQuery({
    queryKey: ['patients', facilityId, queryParams],
    queryFn: () => fetchData<{ items: unknown[]; total: number; page: number; size: number }>(`/patients${queryParams ? '?' + queryParams : ''}`, facilityId),
  });
}

export function useFacilitiesData(params?: string) {
  return useQuery({
    queryKey: ['facilities', params],
    queryFn: () => fetchData<{ items: unknown[]; total: number }>(`/facilities${params ? '?' + params : ''}`),
    staleTime: 60000,
    gcTime: 120000,
  });
}

export function useUsersData(facilityId?: string, page = 1, size = 50, search = '') {
  const searchParam = search ? `&search=${encodeURIComponent(search)}` : ''
  return useQuery({
    queryKey: ['users', facilityId, page, size, search],
    queryFn: () => fetchData<{ items: unknown[]; total: number }>(`/users?page=${page}&size=${size}${searchParam}`, facilityId),
  });
}

export function useAuditData(params?: string) {
  return useQuery({
    queryKey: ['audit', params],
    queryFn: () => fetchData<{ items: unknown[]; total: number }>(`/audit${params ? '?' + params : ''}`),
  });
}

export function useSyncData(page = 1, size = 10, status = '') {
  const params = [`page=${page}`, `size=${size}`, ...(status ? [`status=${status}`] : [])].join('&')
  return useQuery({
    queryKey: ['sync', page, size, status],
    queryFn: () => fetchData<{ items: unknown[]; total: number; pendingCount: number; syncedCount: number; failedCount: number }>(`/sync/pull?${params}`),
  });
}

export function useNotificationsData(page = 1, size = 20) {
  return useQuery({
    queryKey: ['notifications', page, size],
    queryFn: () => fetchData<{ items: unknown[]; total: number; unreadCount: number }>(`/notifications?page=${page}&size=${size}`),
    staleTime: 30 * 1000,
    gcTime: 120 * 1000,
    refetchInterval: 60 * 1000,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (ids: string[]) => {
      const token = getTokenFromStorage();
      return api.post<unknown>('/notifications/read', { ids }, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const token = getTokenFromStorage();
      return api.post<unknown>('/notifications/read', { all: true }, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useTreatmentsData() {
  return useQuery({
    queryKey: ['treatments'],
    queryFn: async () => {
      const data = await fetchData<{ items: unknown[]; total: number }>('/treatments');
      return data;
    },
  });
}

export function useStudiesData() {
  return useQuery({
    queryKey: ['studies'],
    queryFn: async () => {
      const raw = await fetchData<{ items: unknown[]; total: number }>('/clinical-cases');
      const resolved = raw.items.filter((c: unknown) => (c as Record<string, unknown>).status === 'resolved');
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
    queryFn: () => fetchData<unknown>(`/clinical-cases/${id}`).then(transformClinicalCase),
    enabled: !!id,
  });
}

export function useCaseNotes(id: string) {
  return useQuery({
    queryKey: ['clinical-case-notes', id],
    queryFn: () => fetchData<{ items: unknown[]; total: number }>(`/clinical-cases/${id}/notes`),
    enabled: !!id,
  });
}

export function useAddCaseNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, content }: { id: string; content: string }) => {
      const token = getTokenFromStorage();
      return api.post<unknown>(`/clinical-cases/${id}/notes`, { content }, token);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['clinical-case-notes', variables.id] });
    },
  });
}

export function useFacilityDetail(id: string) {
  return useQuery({
    queryKey: ['facility', id],
    queryFn: () => fetchData<unknown>(`/facilities/${id}`),
    enabled: !!id,
  });
}

function getTokenFromStorage() {
  return getToken();
}

export function useUpdatePatient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Record<string, unknown> }) => {
      const token = getTokenFromStorage();
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
      const token = getTokenFromStorage();
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
      const token = getTokenFromStorage();
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
      const token = getTokenFromStorage();
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
      const token = getTokenFromStorage();
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
      const token = getTokenFromStorage();
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
      const token = getTokenFromStorage();
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
      const token = getTokenFromStorage();
      return api.delete<unknown>(`/users/${id}`, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

export function useDoctorsData(params?: string) {
  return useQuery({
    queryKey: ['doctors', params],
    queryFn: () => fetchData<{ items: unknown[]; total: number }>(`/users${params ? '?' + params : ''}`),
  });
}

export function useDoctorDetail(id: string) {
  return useQuery({
    queryKey: ['doctor', id],
    queryFn: () => fetchData<unknown>(`/users/${id}`),
    enabled: !!id,
  });
}

export function useCreateDoctor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const token = getTokenFromStorage();
      return api.post<unknown>('/users', data, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctors'] });
    },
  });
}

export function useUpdateDoctor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Record<string, unknown> }) => {
      const token = getTokenFromStorage();
      return api.put<unknown>(`/users/${id}`, data, token);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['doctors'] });
      queryClient.invalidateQueries({ queryKey: ['doctor', variables.id] });
    },
  });
}

export function useDeleteDoctor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const token = getTokenFromStorage();
      return api.delete<unknown>(`/users/${id}`, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctors'] });
    },
  });
}

export function useConsultationsData(params?: string) {
  return useQuery({
    queryKey: ['consultations', params],
    queryFn: () => fetchData<{ items: unknown[]; total: number }>(`/consultations${params ? '?' + params : ''}`),
  });
}

export function useConsultationDetail(id: string) {
  return useQuery({
    queryKey: ['consultation', id],
    queryFn: () => fetchData<unknown>(`/consultations/${id}`),
    enabled: !!id,
  });
}

export function useCreateConsultation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const token = getTokenFromStorage();
      return api.post<unknown>('/consultations', data, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consultations'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useUpdateConsultation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Record<string, unknown> }) => {
      const token = getTokenFromStorage();
      return api.put<unknown>(`/consultations/${id}`, data, token);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['consultations'] });
      queryClient.invalidateQueries({ queryKey: ['consultation', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useDeleteConsultation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const token = getTokenFromStorage();
      return api.delete<unknown>(`/consultations/${id}`, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consultations'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useQueueDetail(id: string) {
  return useQuery({ queryKey: ['queue', id], queryFn: () => fetchData<unknown>(`/queue/${id}`), enabled: !!id });
}
export function useCreateQueue() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const token = getTokenFromStorage();
      return api.post<unknown>('/queue', data, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['queue'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
export function useUpdateQueue() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Record<string, unknown> }) => {
      const token = getTokenFromStorage();
      return api.put<unknown>(`/queue/${id}`, data, token);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['queue'] });
      queryClient.invalidateQueries({ queryKey: ['queue', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
export function useDeleteQueue() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const token = getTokenFromStorage();
      return api.delete<unknown>(`/queue/${id}`, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['queue'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useDiagnosticDetail(id: string) {
  return useQuery({ queryKey: ['diagnostic', id], queryFn: () => fetchData<unknown>(`/diagnostics/${id}`), enabled: !!id });
}
export function useCreateDiagnostic() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const token = getTokenFromStorage();
      return api.post<unknown>('/diagnostics', data, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['diagnostics'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
export function useUpdateDiagnostic() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Record<string, unknown> }) => {
      const token = getTokenFromStorage();
      return api.put<unknown>(`/diagnostics/${id}`, data, token);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['diagnostics'] });
      queryClient.invalidateQueries({ queryKey: ['diagnostic', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
export function useDeleteDiagnostic() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const token = getTokenFromStorage();
      return api.delete<unknown>(`/diagnostics/${id}`, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['diagnostics'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useDiseaseDetail(id: string) {
  return useQuery({ queryKey: ['disease', id], queryFn: () => fetchData<unknown>(`/diseases/${id}`), enabled: !!id });
}
export function useCreateDisease() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const token = getTokenFromStorage();
      return api.post<unknown>('/diseases', data, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['diseases'] });
    },
  });
}
export function useUpdateDisease() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Record<string, unknown> }) => {
      const token = getTokenFromStorage();
      return api.put<unknown>(`/diseases/${id}`, data, token);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['diseases'] });
      queryClient.invalidateQueries({ queryKey: ['disease', variables.id] });
    },
  });
}
export function useDeleteDisease() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const token = getTokenFromStorage();
      return api.delete<unknown>(`/diseases/${id}`, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['diseases'] });
    },
  });
}

export function useTreatmentDetail(id: string) {
  return useQuery({ queryKey: ['treatment', id], queryFn: () => fetchData<unknown>(`/treatments/${id}`), enabled: !!id });
}
export function useCreateTreatment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const token = getTokenFromStorage();
      return api.post<unknown>('/treatments', data, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['treatments-list'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
export function useUpdateTreatment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Record<string, unknown> }) => {
      const token = getTokenFromStorage();
      return api.put<unknown>(`/treatments/${id}`, data, token);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['treatments-list'] });
      queryClient.invalidateQueries({ queryKey: ['treatment', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
export function useDeleteTreatment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const token = getTokenFromStorage();
      return api.delete<unknown>(`/treatments/${id}`, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['treatments-list'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useLabCategoriesData() {
  return useQuery({
    queryKey: ['lab-categories'],
    queryFn: () => fetchData<{ items: unknown[] }>('/lab/categories'),
  });
}

export function useLabExamDetail(id: string) {
  return useQuery({ queryKey: ['lab-exam', id], queryFn: () => fetchData<unknown>(`/lab/exams/${id}`), enabled: !!id });
}
export function useCreateLabExam() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const token = getTokenFromStorage();
      return api.post<unknown>('/lab/exams', data, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lab-exams'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
export function useUpdateLabExam() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Record<string, unknown> }) => {
      const token = getTokenFromStorage();
      return api.put<unknown>(`/lab/exams/${id}`, data, token);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['lab-exams'] });
      queryClient.invalidateQueries({ queryKey: ['lab-exam', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
export function useDeleteLabExam() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const token = getTokenFromStorage();
      return api.delete<unknown>(`/lab/exams/${id}`, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lab-exams'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useDocumentDetail(id: string) {
  return useQuery({ queryKey: ['document', id], queryFn: () => fetchData<unknown>(`/documents/${id}`), enabled: !!id });
}
export function useCreateDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const token = getTokenFromStorage();
      return api.post<unknown>('/documents', data, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
export function useUpdateDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Record<string, unknown> }) => {
      const token = getTokenFromStorage();
      return api.put<unknown>(`/documents/${id}`, data, token);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      queryClient.invalidateQueries({ queryKey: ['document', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
export function useDeleteDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const token = getTokenFromStorage();
      return api.delete<unknown>(`/documents/${id}`, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useArchiveDetail(id: string) {
  return useQuery({ queryKey: ['archive', id], queryFn: () => fetchData<unknown>(`/archives/${id}`), enabled: !!id });
}
export function useCreateArchive() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const token = getTokenFromStorage();
      return api.post<unknown>('/archives', data, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['archives'] });
    },
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

export function useSettings() {
  return useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const token = getToken();
      return api.get<{ preferences: Record<string, unknown> }>('/settings', token);
    },
  });
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (preferences: Record<string, unknown>) => {
      const token = getTokenFromStorage();
      return api.put<unknown>('/settings', { preferences }, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
  });
}

export function useCareEpisodesData(params?: string) {
  return useQuery({
    queryKey: ['care-episodes', params],
    queryFn: () => fetchData<{ items: unknown[]; total: number }>(`/care-episodes${params ? '?' + params : ''}`),
  });
}

export function useCareEpisodeDetail(id: string) {
  return useQuery({ queryKey: ['care-episode', id], queryFn: () => fetchData<unknown>(`/care-episodes/${id}`), enabled: !!id });
}

export function useCreateCareEpisode() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const token = getTokenFromStorage();
      return api.post<unknown>('/care-episodes', data, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['care-episodes'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useUpdateCareEpisode() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Record<string, unknown> }) => {
      const token = getTokenFromStorage();
      return api.put<unknown>(`/care-episodes/${id}`, data, token);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['care-episodes'] });
      queryClient.invalidateQueries({ queryKey: ['care-episode', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useArchiveCareEpisode() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const token = getTokenFromStorage();
      return api.post<unknown>(`/care-episodes/${id}/archive`, {}, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['care-episodes'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['clinical-knowledge-base'] });
      queryClient.invalidateQueries({ queryKey: ['disease-statistics'] });
    },
  });
}

export function useRestoreCareEpisode() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const token = getTokenFromStorage();
      return api.patch<unknown>(`/care-episodes/${id}/restore`, {}, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['care-episodes'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['clinical-knowledge-base'] });
      queryClient.invalidateQueries({ queryKey: ['disease-statistics'] });
    },
  });
}

export function useClinicalKnowledgeBaseData(params?: string) {
  return useQuery({
    queryKey: ['clinical-knowledge-base', params],
    queryFn: () => fetchData<{ items: unknown[]; total: number }>(`/clinical-knowledge-base${params ? '?' + params : ''}`),
  });
}

export function useDiseaseStatisticsData(params?: string) {
  return useQuery({
    queryKey: ['disease-statistics', params],
    queryFn: () => fetchData<{ items: unknown[]; total: number }>(`/disease-statistics${params ? '?' + params : ''}`),
  });
}

export interface DiseaseTreatmentHistoryData {
  disease: {
    id: string | null
    code: string | null
    name: string
    category: string | null
    severity: string | null
  } | null
  stats: {
    totalTreatments: number
    totalPatients: number
    totalDoctors: number
    totalMedications: number
    statusDistribution: Record<string, number>
    outcomeDistribution: Record<string, number>
    monthlyTrend: { month: string; count: number }[]
  }
  byDisease: {
    diseaseId: string | null
    diseaseCode: string | null
    diseaseName: string
    treatments: number
    patients: number
  }[]
  byDoctor: {
    doctorId: string | null
    doctorName: string
    treatments: number
    patients: number
    methods: { description: string; count: number }[]
    medications: { name: string; count: number }[]
    statusDistribution: Record<string, number>
    outcomeDistribution: Record<string, number>
  }[]
  timeline: {
    treatmentId: string
    startDate: string
    endDate?: string
    createdAt: string
    description: string
    status: string
    outcome?: string
    notes?: string
    patientId?: string
    patientName?: string
    patientDossier?: string
    doctorId?: string
    doctorName?: string
    diseaseId?: string
    diseaseCode?: string
    diseaseName?: string
    medications: {
      name: string
      category?: string
      dosage?: string
      frequency?: string
      duration?: string
      instructions?: string
    }[]
  }[]
  page: number
  size: number
  total: number
}

export function useDiseaseTreatmentHistoryData(params?: string) {
  return useQuery({
    queryKey: ['disease-treatment-history', params],
    queryFn: () => fetchData<DiseaseTreatmentHistoryData>(`/disease-treatment-history${params ? '?' + params : ''}`),
  });
}

export function useTherapeuticProtocolsData(params?: string) {
  return useQuery({
    queryKey: ['therapeutic-protocols', params],
    queryFn: () => fetchData<{ items: unknown[]; total: number }>(`/therapeutic-protocols${params ? '?' + params : ''}`),
  });
}

export function useTherapeuticProtocolDetail(id: string) {
  return useQuery({ queryKey: ['therapeutic-protocol', id], queryFn: () => fetchData<unknown>(`/therapeutic-protocols/${id}`), enabled: !!id });
}

export function useCreateTherapeuticProtocol() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const token = getTokenFromStorage();
      return api.post<unknown>('/therapeutic-protocols', data, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['therapeutic-protocols'] });
    },
  });
}

export function useUpdateTherapeuticProtocol() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Record<string, unknown> }) => {
      const token = getTokenFromStorage();
      return api.put<unknown>(`/therapeutic-protocols/${id}`, data, token);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['therapeutic-protocols'] });
      queryClient.invalidateQueries({ queryKey: ['therapeutic-protocol', variables.id] });
    },
  });
}

export function useSubmitTriage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      queueId: string
      patientId: string
      priority: string
      assignedDoctorId: string
      vitalSigns: Record<string, unknown>
      motif: string
      notes?: string
    }) => {
      const token = getTokenFromStorage();
      const results: Record<string, unknown>[] = [];

      const queueUpdate = await api.put<unknown>(`/queue/${data.queueId}`, {
        priority: data.priority,
        assignedDoctorId: data.assignedDoctorId,
        status: 'WITH_DOCTOR',
        notes: data.notes,
      }, token);
      results.push(queueUpdate as Record<string, unknown>);

      const consultation = await api.post<unknown>('/consultations', {
        patientId: data.patientId,
        doctorId: data.assignedDoctorId,
        motif: data.motif,
        vitalSigns: data.vitalSigns,
        notes: data.notes,
      }, token);
      results.push(consultation as Record<string, unknown>);

      return results;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['queue'] });
      queryClient.invalidateQueries({ queryKey: ['consultations'] });
      queryClient.invalidateQueries({ queryKey: ['care-episodes'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useDispenseTreatment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, queueId }: { id: string; queueId?: string }) => {
      const token = getTokenFromStorage();
      const result = await api.post<unknown>('/pharmacy/dispense', {
        treatmentId: id,
        queueId,
      }, token);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['treatments-list'] });
      queryClient.invalidateQueries({ queryKey: ['queue'] });
      queryClient.invalidateQueries({ queryKey: ['prescriptions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['patient-history'] });
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });
}

export function useDeleteTherapeuticProtocol() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const token = getTokenFromStorage();
      return api.delete<unknown>(`/therapeutic-protocols/${id}`, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['therapeutic-protocols'] });
    },
  });
}

export function useCareCoveragesData(params?: string) {
  return useQuery({
    queryKey: ['care-coverages', params],
    queryFn: () => fetchData<{ items: unknown[]; total: number }>(`/care-coverages${params ? '?' + params : ''}`),
  });
}

export function usePartnerCompaniesData(params?: string) {
  return useQuery({
    queryKey: ['partner-companies', params],
    queryFn: () => fetchData<{ items: unknown[]; total: number }>(`/partner-companies${params ? '?' + params : ''}`),
  });
}

export function usePartnerPatientsData(params?: string) {
  return useQuery({
    queryKey: ['partner-patients', params],
    queryFn: () => fetchData<{ items: unknown[]; total: number }>(`/partner-patients${params ? '?' + params : ''}`),
  });
}

export function usePatientHistoryData(params?: string) {
  return useQuery({
    queryKey: ['patient-history', params],
    queryFn: () => fetchData<{ items: unknown[]; total: number }>(`/patient-history${params ? '?' + params : ''}`),
  });
}

export function useNotificationPreferencesData(params?: string) {
  return useQuery({
    queryKey: ['notification-preferences', params],
    queryFn: () => fetchData<{ items: unknown[]; total: number }>(`/notification-preferences${params ? '?' + params : ''}`),
  });
}

export function useBillingCodesData(params?: string) {
  return useQuery({
    queryKey: ['billing-codes', params],
    queryFn: () => fetchData<{ items: unknown[]; total: number }>(`/billing-codes${params ? '?' + params : ''}`),
  });
}

export function useInvoicesData(params?: string) {
  return useQuery({
    queryKey: ['invoices', params],
    queryFn: () => fetchData<{ items: unknown[]; total: number }>(`/invoices${params ? '?' + params : ''}`),
  });
}

export function useInvoiceDetail(id?: string) {
  return useQuery({
    queryKey: ['invoice', id],
    queryFn: () => fetchData<unknown>(`/invoices/${id}`),
    enabled: !!id,
  });
}

export function usePaymentsData(params?: string) {
  return useQuery({
    queryKey: ['payments', params],
    queryFn: () => fetchData<{ items: unknown[]; total: number }>(`/payments${params ? '?' + params : ''}`),
  });
}

export function useCreateInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: unknown) => {
      const token = getTokenFromStorage();
      return api.post<unknown>('/invoices', data, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useCreatePayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: unknown) => {
      const token = getTokenFromStorage();
      return api.post<unknown>('/payments', data, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useBedsData(params?: string) {
  return useQuery({
    queryKey: ['beds', params],
    queryFn: () =>
      fetchData<{ items: unknown[]; total: number; page: number; size: number }>(
        `/hospitalization/beds${params ? '?' + params : ''}`,
      ),
  });
}

export function useBedDetail(id?: string) {
  return useQuery({
    queryKey: ['bed', id],
    queryFn: () => fetchData<any>(`/hospitalization/beds/${id}`),
    enabled: !!id,
  });
}

export function useCreateBed() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: unknown) => {
      const token = getTokenFromStorage();
      return api.post<unknown>('/hospitalization/beds', data, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['beds'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useUpdateBed() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: unknown }) => {
      const token = getTokenFromStorage();
      return api.put<unknown>(`/hospitalization/beds/${id}`, data, token);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['beds'] });
      queryClient.invalidateQueries({ queryKey: ['bed', variables.id] });
    },
  });
}

export function useDeleteBed() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const token = getTokenFromStorage();
      return api.delete<unknown>(`/hospitalization/beds/${id}`, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['beds'] });
    },
  });
}

export function useAssignBed() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: unknown }) => {
      const token = getTokenFromStorage();
      return api.post<unknown>(`/hospitalization/beds/${id}/assign`, data, token);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['beds'] });
      queryClient.invalidateQueries({ queryKey: ['bed', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['patient-history'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useReleaseBed() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const token = getTokenFromStorage();
      return api.post<unknown>(`/hospitalization/beds/${id}/release`, {}, token);
    },
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ['beds'] });
      queryClient.invalidateQueries({ queryKey: ['bed', id] });
      queryClient.invalidateQueries({ queryKey: ['patient-history'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => fetchData<RoleDashboardResponse>('/dashboard/stats'),
    staleTime: 30_000,
  });
}

