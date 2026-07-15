import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import type { ClinicalCase } from '@/types';
import {
  mockClinicalCases,
  mockPatients,
  mockFacilities,
  mockUsers,
  mockAuditEntries,
  mockChartData,
  mockSyncQueue,
  mockNotifications,
  mockTreatments,
  mockStudies,
} from '@/lib/mock-data';

function getToken(): string {
  return localStorage.getItem('medinsight_token') || '';
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
  ADMIN: 'admin',
  DOCTOR: 'doctor',
  RESEARCHER: 'researcher',
  NURSE: 'nurse',
  VIEWER: 'viewer',
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

async function fetchWithFallback<T>(endpoint: string, mockData: T): Promise<T> {
  try {
    const token = getToken();
    const raw = await api.get<unknown>(endpoint, token);
    return transformKeys(raw) as T;
  } catch {
    return mockData;
  }
}

async function fetchDetailWithFallback<T extends { id?: string }>(
  endpoint: string,
  mockArray: T[],
  id: string,
): Promise<T> {
  try {
    const token = getToken();
    const raw = await api.get<unknown>(endpoint, token);
    return transformKeys(raw) as T;
  } catch {
    const match = mockArray.find((item) => (item as Record<string, unknown>).id === id)
    if (!match) throw new Error('Not found')
    return match
  }
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

        const totalCases = apiStats?.total ?? cases?.items?.length ?? mockClinicalCases.length;
        const totalPatients = patients?.total ?? mockPatients.length;
        const totalFacilities = facilities?.total ?? mockFacilities.length;
        const successCount = apiStats?.success ?? 0;
        const resolutionRate = totalCases > 0 ? Math.round((successCount / totalCases) * 100) : 78;

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
            total_cases: mockClinicalCases.length,
            total_patients: mockPatients.length,
            total_facilities: mockFacilities.length,
            resolution_rate: 78,
          },
          recentCases: mockClinicalCases.slice(0, 5),
          patientMap: Object.fromEntries(mockPatients.map((p) => [p.id, `${p.firstName} ${p.lastName}`])),
          facilityMap: Object.fromEntries(mockFacilities.map((f) => [f.id, f.name])),
          chartData: mockChartData,
        };
      }
    },
  });
}

export function useClinicalCasesData() {
  return useQuery({
    queryKey: ['clinical-cases'],
    queryFn: () => fetchWithFallback('/clinical-cases', { items: mockClinicalCases, total: mockClinicalCases.length }),
  });
}

export function usePatientsData() {
  return useQuery({
    queryKey: ['patients'],
    queryFn: () => fetchWithFallback('/patients', { items: mockPatients, total: mockPatients.length }),
  });
}

export function useFacilitiesData() {
  return useQuery({
    queryKey: ['facilities'],
    queryFn: () => fetchWithFallback('/facilities', { items: mockFacilities, total: mockFacilities.length }),
  });
}

export function useUsersData() {
  return useQuery({
    queryKey: ['users'],
    queryFn: () => fetchWithFallback('/users', { items: mockUsers, total: mockUsers.length }),
  });
}

export function useAuditData() {
  return useQuery({
    queryKey: ['audit'],
    queryFn: () => fetchWithFallback('/audit', { items: mockAuditEntries, total: mockAuditEntries.length }),
  });
}

export function useSyncData() {
  return useQuery({
    queryKey: ['sync'],
    queryFn: () => fetchWithFallback('/sync/pull', { items: mockSyncQueue, total: mockSyncQueue.length }),
  });
}

export function useNotificationsData() {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: async () => mockNotifications,
  });
}

export function useTreatmentsData() {
  return useQuery({
    queryKey: ['treatments'],
    queryFn: async () => mockTreatments,
  });
}

export function useStudiesData() {
  return useQuery({
    queryKey: ['studies'],
    queryFn: async () => mockStudies,
  });
}

export function usePatientDetail(id: string) {
  return useQuery({
    queryKey: ['patient', id],
    queryFn: () => fetchDetailWithFallback(`/patients/${id}`, mockPatients as unknown as { id?: string }[], id),
    enabled: !!id,
  });
}

export function useClinicalCaseDetail(id: string) {
  return useQuery({
    queryKey: ['clinical-case', id],
    queryFn: () => fetchDetailWithFallback(`/clinical-cases/${id}`, mockClinicalCases as unknown as { id?: string }[], id),
    enabled: !!id,
  });
}

export function useFacilityDetail(id: string) {
  return useQuery({
    queryKey: ['facility', id],
    queryFn: () => fetchDetailWithFallback(`/facilities/${id}`, mockFacilities as unknown as { id?: string }[], id),
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
