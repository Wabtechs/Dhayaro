import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/services/api'

function getToken(): string {
  return localStorage.getItem('dhayaro_token') || ''
}

function toCamelCase(key: string): string {
  return key.replace(/_([a-z])/g, (_, c) => c.toUpperCase())
}

function transformKeys<T>(obj: unknown): T {
  if (Array.isArray(obj)) return obj.map(transformKeys) as T
  if (obj !== null && typeof obj === 'object' && !(obj instanceof Date)) {
    const entries = Object.entries(obj as Record<string, unknown>).map(([k, v]) => [toCamelCase(k), transformKeys(v)] as const)
    const result: Record<string, unknown> = {}
    for (const [k, v] of entries) result[k] = v
    return result as T
  }
  return obj as T
}

async function fetchData<T>(endpoint: string, facilityOverride?: string): Promise<T> {
  const token = getToken()
  const activeFacility = facilityOverride ?? (typeof window !== 'undefined' ? localStorage.getItem('dhayaro_active_facility') : null)
  const sep = endpoint.includes('?') ? '&' : '?'
  const url = activeFacility ? `${endpoint}${sep}facilityId=${activeFacility}` : endpoint
  const raw = await api.get<unknown>(url, token)
  return transformKeys<T>(raw)
}

const EQUIPMENT_KEYS = ['equipment', 'supplies'] as const

function invalidateAll(queryClient: ReturnType<typeof useQueryClient>, keys: string[]) {
  for (const k of keys) {
    queryClient.invalidateQueries({ queryKey: [k] })
  }
}

export function useEquipmentDashboard() {
  return useQuery({
    queryKey: ['equipment', 'dashboard'],
    queryFn: () => fetchData<Record<string, unknown>>('/equipment/dashboard'),
    staleTime: 30000,
    refetchInterval: 60000,
  })
}

export function useEquipmentReports(type = 'inventory') {
  return useQuery({
    queryKey: ['equipment', 'reports', type],
    queryFn: () => fetchData<Record<string, unknown>>(`/equipment/reports?type=${type}`),
    staleTime: 30000,
  })
}

export function useEquipmentCategories(params?: string) {
  return useQuery({
    queryKey: ['equipment-categories', params],
    queryFn: () => fetchData<{ items: unknown[]; total: number }>(`/equipment/categories${params ? '?' + params : '?size=100'}`),
  })
}

export function useEquipmentCategoryDetail(id: string) {
  return useQuery({
    queryKey: ['equipment-category', id],
    queryFn: () => fetchData<unknown>(`/equipment/categories/${id}`),
    enabled: !!id,
  })
}

export function useEquipmentItems(params?: string) {
  return useQuery({
    queryKey: ['equipment-items', params],
    queryFn: () => fetchData<{ items: unknown[]; total: number; page: number; size: number }>(`/equipment/items${params ? '?' + params : ''}`),
  })
}

export function useEquipmentItemDetail(id: string) {
  return useQuery({
    queryKey: ['equipment-item', id],
    queryFn: () => fetchData<unknown>(`/equipment/items/${id}`),
    enabled: !!id,
  })
}

export function useEquipmentLocations(params?: string) {
  return useQuery({
    queryKey: ['equipment-locations', params],
    queryFn: () => fetchData<{ items: unknown[]; total: number }>(`/equipment/locations${params ? '?' + params : '?size=100'}`),
  })
}

export function useEquipmentAssignments(params?: string) {
  return useQuery({
    queryKey: ['equipment-assignments', params],
    queryFn: () => fetchData<{ items: unknown[]; total: number }>(`/equipment/assignments${params ? '?' + params : ''}`),
  })
}

export function useEquipmentDocuments(params?: string) {
  return useQuery({
    queryKey: ['equipment-documents', params],
    queryFn: () => fetchData<{ items: unknown[]; total: number }>(`/equipment/documents${params ? '?' + params : ''}`),
  })
}

export function useEquipmentMaintenance(params?: string) {
  return useQuery({
    queryKey: ['equipment-maintenance', params],
    queryFn: () => fetchData<{ items: unknown[]; total: number }>(`/equipment/maintenance${params ? '?' + params : ''}`),
  })
}

export function useEquipmentIncidents(params?: string) {
  return useQuery({
    queryKey: ['equipment-incidents', params],
    queryFn: () => fetchData<{ items: unknown[]; total: number }>(`/equipment/incidents${params ? '?' + params : ''}`),
  })
}

export function useEquipmentWarranties(params?: string) {
  return useQuery({
    queryKey: ['equipment-warranties', params],
    queryFn: () => fetchData<{ items: unknown[]; total: number }>(`/equipment/warranties${params ? '?' + params : ''}`),
  })
}

export function useEquipmentBookings(params?: string) {
  return useQuery({
    queryKey: ['equipment-bookings', params],
    queryFn: () => fetchData<{ items: unknown[]; total: number }>(`/equipment/bookings${params ? '?' + params : ''}`),
  })
}

export function useEquipmentSuppliers(params?: string) {
  return useQuery({
    queryKey: ['equipment-suppliers', params],
    queryFn: () => fetchData<{ items: unknown[]; total: number }>(`/equipment/suppliers${params ? '?' + params : '?size=100'}`),
  })
}

export function useEquipmentAudits(params?: string) {
  return useQuery({
    queryKey: ['equipment-audits', params],
    queryFn: () => fetchData<{ items: unknown[]; total: number }>(`/equipment/audits${params ? '?' + params : ''}`),
  })
}

export function useEquipmentLogs(params?: string) {
  return useQuery({
    queryKey: ['equipment-logs', params],
    queryFn: () => fetchData<{ items: unknown[]; total: number; page: number; size: number }>(`/equipment/logs${params ? '?' + params : ''}`),
  })
}

export function useSpareParts(params?: string) {
  return useQuery({
    queryKey: ['spare-parts', params],
    queryFn: () => fetchData<{ items: unknown[]; total: number }>(`/equipment/spare-parts${params ? '?' + params : ''}`),
  })
}

export function useSuppliesItems(params?: string) {
  return useQuery({
    queryKey: ['supplies-items', params],
    queryFn: () => fetchData<{ items: unknown[]; total: number; page: number; size: number }>(`/supplies/items${params ? '?' + params : ''}`),
  })
}

export function useSupplyItemDetail(id: string) {
  return useQuery({
    queryKey: ['supply-item', id],
    queryFn: () => fetchData<unknown>(`/supplies/items/${id}`),
    enabled: !!id,
  })
}

export function useSuppliesBatches(params?: string) {
  return useQuery({
    queryKey: ['supplies-batches', params],
    queryFn: () => fetchData<{ items: unknown[]; total: number }>(`/supplies/batches${params ? '?' + params : ''}`),
  })
}

export function useSuppliesStock(params?: string) {
  return useQuery({
    queryKey: ['supplies-stock', params],
    queryFn: () => fetchData<Record<string, unknown>>(`/supplies/stock${params ? '?' + params : ''}`),
    staleTime: 30000,
    refetchInterval: 60000,
  })
}

export function useStockMovements(params?: string) {
  return useQuery({
    queryKey: ['stock-movements', params],
    queryFn: () => fetchData<{ items: unknown[]; total: number; page: number; size: number }>(`/supplies/movements${params ? '?' + params : ''}`),
  })
}

export function usePurchaseOrders(params?: string) {
  return useQuery({
    queryKey: ['purchase-orders', params],
    queryFn: () => fetchData<{ items: unknown[]; total: number; page: number; size: number }>(`/supplies/orders${params ? '?' + params : ''}`),
  })
}

export function usePurchaseOrderDetail(id: string) {
  return useQuery({
    queryKey: ['purchase-order', id],
    queryFn: () => fetchData<unknown>(`/supplies/orders/${id}`),
    enabled: !!id,
  })
}

function createHook<TData, TArgs extends unknown[]>(
  keys: string[],
  mutationFn: (args: TArgs, token: string) => Promise<TData>,
) {
  return () => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: (args: TArgs) => {
        const token = getToken()
        return mutationFn(args, token)
      },
      onSuccess: () => invalidateAll(queryClient, keys),
    })
  }
}

const makePost = (path: string) => (args: [Record<string, unknown>], token: string) => api.post<unknown>(path, args[0], token)
const makePut = (pathPrefix: string) => (args: [string, Record<string, unknown>], token: string) => api.put<unknown>(`${pathPrefix}/${args[0]}`, args[1], token)
const makeDelete = (pathPrefix: string) => (args: [string], token: string) => api.delete<unknown>(`${pathPrefix}/${args[0]}`, token)

export const useCreateEquipmentCategory = createHook(EQUIPMENT_KEYS as unknown as string[], makePost('/equipment/categories'))
export const useUpdateEquipmentCategory = createHook(EQUIPMENT_KEYS as unknown as string[], makePut('/equipment/categories'))
export const useDeleteEquipmentCategory = createHook(EQUIPMENT_KEYS as unknown as string[], makeDelete('/equipment/categories'))

export const useCreateEquipmentItem = createHook(EQUIPMENT_KEYS as unknown as string[], makePost('/equipment/items'))
export const useUpdateEquipmentItem = createHook(EQUIPMENT_KEYS as unknown as string[], makePut('/equipment/items'))
export const useDeleteEquipmentItem = createHook(EQUIPMENT_KEYS as unknown as string[], makeDelete('/equipment/items'))

export const useCreateEquipmentLocation = createHook(EQUIPMENT_KEYS as unknown as string[], makePost('/equipment/locations'))
export const useUpdateEquipmentLocation = createHook(EQUIPMENT_KEYS as unknown as string[], makePut('/equipment/locations'))
export const useDeleteEquipmentLocation = createHook(EQUIPMENT_KEYS as unknown as string[], makeDelete('/equipment/locations'))

export const useCreateEquipmentAssignment = createHook(EQUIPMENT_KEYS as unknown as string[], makePost('/equipment/assignments'))
export const useUpdateEquipmentAssignment = createHook(EQUIPMENT_KEYS as unknown as string[], makePut('/equipment/assignments'))
export const useDeleteEquipmentAssignment = createHook(EQUIPMENT_KEYS as unknown as string[], makeDelete('/equipment/assignments'))

export const useCreateEquipmentDocument = createHook(EQUIPMENT_KEYS as unknown as string[], makePost('/equipment/documents'))
export const useUpdateEquipmentDocument = createHook(EQUIPMENT_KEYS as unknown as string[], makePut('/equipment/documents'))
export const useDeleteEquipmentDocument = createHook(EQUIPMENT_KEYS as unknown as string[], makeDelete('/equipment/documents'))

export const useCreateEquipmentMaintenance = createHook(EQUIPMENT_KEYS as unknown as string[], makePost('/equipment/maintenance'))
export const useUpdateEquipmentMaintenance = createHook(EQUIPMENT_KEYS as unknown as string[], makePut('/equipment/maintenance'))
export const useDeleteEquipmentMaintenance = createHook(EQUIPMENT_KEYS as unknown as string[], makeDelete('/equipment/maintenance'))

export const useCreateEquipmentIncident = createHook(EQUIPMENT_KEYS as unknown as string[], makePost('/equipment/incidents'))
export const useUpdateEquipmentIncident = createHook(EQUIPMENT_KEYS as unknown as string[], makePut('/equipment/incidents'))
export const useDeleteEquipmentIncident = createHook(EQUIPMENT_KEYS as unknown as string[], makeDelete('/equipment/incidents'))

export const useCreateEquipmentWarranty = createHook(EQUIPMENT_KEYS as unknown as string[], makePost('/equipment/warranties'))
export const useUpdateEquipmentWarranty = createHook(EQUIPMENT_KEYS as unknown as string[], makePut('/equipment/warranties'))
export const useDeleteEquipmentWarranty = createHook(EQUIPMENT_KEYS as unknown as string[], makeDelete('/equipment/warranties'))

export const useCreateEquipmentBooking = createHook(EQUIPMENT_KEYS as unknown as string[], makePost('/equipment/bookings'))
export const useUpdateEquipmentBooking = createHook(EQUIPMENT_KEYS as unknown as string[], makePut('/equipment/bookings'))
export const useDeleteEquipmentBooking = createHook(EQUIPMENT_KEYS as unknown as string[], makeDelete('/equipment/bookings'))

export const useCreateEquipmentSupplier = createHook(EQUIPMENT_KEYS as unknown as string[], makePost('/equipment/suppliers'))
export const useUpdateEquipmentSupplier = createHook(EQUIPMENT_KEYS as unknown as string[], makePut('/equipment/suppliers'))
export const useDeleteEquipmentSupplier = createHook(EQUIPMENT_KEYS as unknown as string[], makeDelete('/equipment/suppliers'))

export const useCreateSparePart = createHook(EQUIPMENT_KEYS as unknown as string[], makePost('/equipment/spare-parts'))
export const useUpdateSparePart = createHook(EQUIPMENT_KEYS as unknown as string[], makePut('/equipment/spare-parts'))
export const useDeleteSparePart = createHook(EQUIPMENT_KEYS as unknown as string[], makeDelete('/equipment/spare-parts'))

export const useCreateSupplyItem = createHook(EQUIPMENT_KEYS as unknown as string[], makePost('/supplies/items'))
export const useUpdateSupplyItem = createHook(EQUIPMENT_KEYS as unknown as string[], makePut('/supplies/items'))
export const useDeleteSupplyItem = createHook(EQUIPMENT_KEYS as unknown as string[], makeDelete('/supplies/items'))

export const useCreateSupplyBatch = createHook(EQUIPMENT_KEYS as unknown as string[], makePost('/supplies/batches'))
export const useUpdateSupplyBatch = createHook(EQUIPMENT_KEYS as unknown as string[], makePut('/supplies/batches'))
export const useDeleteSupplyBatch = createHook(EQUIPMENT_KEYS as unknown as string[], makeDelete('/supplies/batches'))

export const useCreateStockMovement = createHook(EQUIPMENT_KEYS as unknown as string[], makePost('/supplies/movements'))
export const useUpdateStockMovement = createHook(EQUIPMENT_KEYS as unknown as string[], makePut('/supplies/movements'))
export const useDeleteStockMovement = createHook(EQUIPMENT_KEYS as unknown as string[], makeDelete('/supplies/movements'))

export const useCreatePurchaseOrder = createHook(EQUIPMENT_KEYS as unknown as string[], makePost('/supplies/orders'))
export const useUpdatePurchaseOrder = createHook(EQUIPMENT_KEYS as unknown as string[], makePut('/supplies/orders'))
export const useDeletePurchaseOrder = createHook(EQUIPMENT_KEYS as unknown as string[], makeDelete('/supplies/orders'))
