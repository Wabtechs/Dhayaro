import { useQuery } from '@tanstack/react-query';
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

export function useDashboardData() {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      try {
        const token = getToken();
        const [rawStats, rawCases, rawPatients, rawFacilities] = await Promise.all([
          api.get<unknown>('/clinical-cases/stats', token).catch(() => null),
          api.get<unknown>('/clinical-cases?page=1&size=5', token).catch(() => null),
          api.get<unknown>('/patients', token).catch(() => null),
          api.get<unknown>('/facilities', token).catch(() => null),
        ]);
        const stats = transformKeys(rawStats) as { total_cases: number; total_patients: number; total_facilities: number; resolution_rate: number } | null;
        const cases = transformKeys(rawCases) as { items: ClinicalCase[]; total: number } | null;
        const patients = transformKeys(rawPatients) as { total: number } | null;
        const facilities = transformKeys(rawFacilities) as { total: number } | null;
        return {
          stats: stats || {
            total_cases: mockClinicalCases.length,
            total_patients: mockPatients.length,
            total_facilities: mockFacilities.length,
            resolution_rate: 78,
          },
          recentCases: cases?.items || mockClinicalCases.slice(0, 5),
          totalPatients: patients?.total || mockPatients.length,
          totalFacilities: facilities?.total || mockFacilities.length,
          chartData: mockChartData,
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
          totalPatients: mockPatients.length,
          totalFacilities: mockFacilities.length,
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
