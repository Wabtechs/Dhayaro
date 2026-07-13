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

async function fetchWithFallback<T>(endpoint: string, mockData: T): Promise<T> {
  try {
    const token = getToken();
    const data = await api.get<T>(endpoint, token);
    return data;
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
        const [stats, cases, patients, facilities] = await Promise.all([
          api.get<{
            total_cases: number;
            total_patients: number;
            total_facilities: number;
            resolution_rate: number;
          }>('/clinical-cases/stats', token).catch(() => null),
          api.get<{ items: ClinicalCase[]; total: number }>('/clinical-cases?page=1&size=5', token).catch(() => null),
          api.get<{ total: number }>('/patients', token).catch(() => null),
          api.get<{ total: number }>('/facilities', token).catch(() => null),
        ]);
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
