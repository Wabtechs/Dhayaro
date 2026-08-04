export type EquipmentType = 'BIOMEDICAL' | 'MEDICAL' | 'FURNITURE' | 'IT' | 'OTHER'
export type EquipmentStatus = 'AVAILABLE' | 'IN_USE' | 'MAINTENANCE' | 'BROKEN' | 'RESERVED' | 'OUT_OF_SERVICE' | 'RETIRED' | 'LOST'
export type EquipmentState = 'NEW' | 'GOOD' | 'FAIR' | 'POOR' | 'CRITICAL'
export type LocationType = 'FACILITY' | 'BUILDING' | 'FLOOR' | 'DEPARTMENT' | 'ROOM' | 'POSITION'
export type AssignmentType = 'DOCTOR' | 'NURSE' | 'TECHNICIAN' | 'DEPARTMENT' | 'SERVICE' | 'OTHER'
export type MaintenanceType = 'PREVENTIVE' | 'CORRECTIVE' | 'INSPECTION' | 'CALIBRATION' | 'VALIDATION' | 'REVISION'
export type MaintenanceStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'OVERDUE'
export type MaintenanceTaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED'
export type IncidentStatus = 'OPEN' | 'IN_PROGRESS' | 'ON_HOLD' | 'RESOLVED' | 'CLOSED'
export type IncidentPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' | 'CRITICAL'
export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
export type WarrantyStatus = 'ACTIVE' | 'EXPIRED' | 'CLAIMED'
export type EquipmentDocCategory = 'INVOICE' | 'CONTRACT' | 'WARRANTY' | 'MANUAL' | 'REPORT' | 'CERTIFICATE' | 'PHOTO' | 'OTHER'
export type SupplyCategory = 'GLOVES' | 'SYRINGES' | 'COMPRESSES' | 'MASKS' | 'REAGENTS' | 'CATHETERS' | 'IV_BAGS' | 'PERFUSION' | 'SUTURES' | 'BANDAGES' | 'DISINFECTANTS' | 'OTHER'
export type StockMovementType = 'RECEIPT' | 'ISSUE' | 'TRANSFER_IN' | 'TRANSFER_OUT' | 'ADJUSTMENT' | 'RETURN' | 'EXPIRED' | 'MANUAL'
export type PoStatus = 'DRAFT' | 'SUBMITTED' | 'ORDERED' | 'PARTIAL' | 'RECEIVED' | 'CANCELLED'
export type EquipmentAuditType = 'INVENTORY' | 'STATUS_CHECK' | 'REGULATORY' | 'QUALITY' | 'SAFETY'

export interface EquipmentCategory {
  id: string
  facilityId?: string
  parentId?: string
  name: string
  icon?: string
  color?: string
  description?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  children?: EquipmentCategory[]
}

export interface MedicalEquipment {
  id: string
  facilityId?: string
  code: string
  qrCode?: string
  barcode?: string
  name: string
  description?: string
  type: EquipmentType
  categoryId?: string
  subCategoryId?: string
  categoryName?: string
  manufacturer?: string
  brand?: string
  model?: string
  serialNumber?: string
  purchaseDate?: string
  purchasePrice?: number
  currency?: string
  warrantyMonths?: number
  lifecycleYears?: number
  state: EquipmentState
  status: EquipmentStatus
  photo?: string
  responsibleUserId?: string
  responsibleUserName?: string
  locationId?: string
  building?: string
  floor?: string
  department?: string
  room?: string
  position?: string
  commissioningDate?: string
  retirementDate?: string
  comments?: string
  createdAt: string
  updatedAt: string
}

export interface EquipmentLocation {
  id: string
  facilityId?: string
  parentId?: string
  type: LocationType
  name: string
  building?: string
  floor?: string
  department?: string
  room?: string
  position?: string
  code?: string
  description?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  children?: EquipmentLocation[]
}

export interface EquipmentAssignment {
  id: string
  facilityId?: string
  equipmentId: string
  equipmentName?: string
  assignedToType: AssignmentType
  assignedToId?: string
  assignedToName?: string
  department?: string
  startedAt: string
  endedAt?: string
  notes?: string
  createdAt: string
}

export interface EquipmentDocument {
  id: string
  facilityId?: string
  equipmentId: string
  title: string
  category: EquipmentDocCategory
  filePath?: string
  fileType?: string
  fileSize?: number
  version: number
  description?: string
  createdAt: string
}

export interface EquipmentMaintenance {
  id: string
  facilityId?: string
  equipmentId: string
  equipmentName?: string
  equipmentCode?: string
  maintenanceType: MaintenanceType
  status: MaintenanceStatus
  scheduledDate?: string
  startedAt?: string
  completedAt?: string
  technicianUserId?: string
  technicianName?: string
  company?: string
  cost?: number
  currency?: string
  durationHours?: number
  priority: IncidentPriority
  report?: string
  photos?: string[]
  partsReplaced?: { name: string; quantity: number; cost?: number }[]
  signature?: string
  notes?: string
  createdAt: string
}

export interface MaintenanceTask {
  id: string
  facilityId?: string
  maintenanceId: string
  title: string
  description?: string
  status: MaintenanceTaskStatus
  completedAt?: string
  completedBy?: string
  createdAt: string
}

export interface EquipmentIncident {
  id: string
  facilityId?: string
  equipmentId: string
  equipmentName?: string
  equipmentCode?: string
  title: string
  description?: string
  priority: IncidentPriority
  status: IncidentStatus
  reportedByUserId?: string
  reportedByName?: string
  assignedToUserId?: string
  assignedToName?: string
  resolvedAt?: string
  resolutionNotes?: string
  rootCause?: string
  cost?: number
  createdAt: string
}

export interface EquipmentLog {
  id: string
  facilityId?: string
  equipmentId: string
  action: string
  details: Record<string, unknown>
  userId?: string
  userName?: string
  createdAt: string
}

export interface EquipmentWarranty {
  id: string
  facilityId?: string
  equipmentId: string
  equipmentName?: string
  supplierId?: string
  supplierName?: string
  startDate?: string
  endDate: string
  status: WarrantyStatus
  coverage?: string
  terms?: string
  cost?: number
  notes?: string
  createdAt: string
}

export interface EquipmentBooking {
  id: string
  facilityId?: string
  equipmentId: string
  equipmentName?: string
  bookedByUserId?: string
  assignedToName?: string
  assignedToId?: string
  purpose: string
  startTime: string
  endTime: string
  status: BookingStatus
  notes?: string
  createdAt: string
}

export interface EquipmentSupplier {
  id: string
  facilityId?: string
  code: string
  name: string
  contactPerson?: string
  phone?: string
  email?: string
  address?: string
  city?: string
  category?: string
  rating?: number
  isActive: boolean
  notes?: string
  createdAt: string
}

export interface EquipmentAudit {
  id: string
  facilityId?: string
  equipmentId: string
  equipmentName?: string
  auditType: EquipmentAuditType
  auditedByUserId?: string
  auditDate: string
  status: EquipmentState
  findings: { label: string; result: string; note?: string }[]
  nextAuditDate?: string
  notes?: string
  createdAt: string
}

export interface SparePart {
  id: string
  facilityId?: string
  code?: string
  sku?: string
  name: string
  categoryId?: string
  description?: string
  unit?: string
  manufacturer?: string
  supplierId?: string
  isActive: boolean
  quantity?: number
  minThreshold?: number
  createdAt: string
}

export interface MedicalSupply {
  id: string
  facilityId?: string
  name: string
  code?: string
  sku?: string
  category: SupplyCategory
  description?: string
  unit?: string
  minStock: number
  criticalStock: number
  price?: number
  currency?: string
  supplierId?: string
  supplierName?: string
  isActive: boolean
  stockQuantity?: number
  expiryDate?: string
  status?: 'ok' | 'low' | 'critical' | 'expired'
  createdAt: string
}

export interface SupplyBatch {
  id: string
  facilityId?: string
  supplyId: string
  supplyName?: string
  batchNumber?: string
  lotNumber?: string
  manufacturerDate?: string
  expiryDate?: string
  quantity: number
  receivedDate?: string
  supplierId?: string
  purchaseOrderId?: string
  createdAt: string
}

export interface StockMovement {
  id: string
  facilityId?: string
  supplyId: string
  supplyName?: string
  batchId?: string
  movementType: StockMovementType
  quantity: number
  unitCost?: number
  fromLocation?: string
  toLocation?: string
  reason?: string
  referenceId?: string
  createdAt: string
}

export interface PurchaseOrder {
  id: string
  facilityId?: string
  orderNumber: string
  supplierId?: string
  supplierName?: string
  orderDate: string
  expectedDate?: string
  receivedDate?: string
  status: PoStatus
  totalAmount?: number
  currency?: string
  notes?: string
  createdAt: string
  items?: PurchaseOrderItem[]
}

export interface PurchaseOrderItem {
  id: string
  facilityId?: string
  orderId: string
  itemType: string
  supplyId?: string
  sparePartId?: string
  equipmentId?: string
  description: string
  quantity: number
  unitPrice: number
  totalPrice: number
  receivedQuantity: number
  createdAt: string
}

export interface EquipmentDashboardStats {
  total: number
  available: number
  inUse: number
  maintenance: number
  broken: number
  reserved: number
  retired: number
  totalValue: number
  currency: string
  upcomingMaintenance: number
  expiringWarranties: { id: string; name: string; endDate: string; daysLeft: number; equipmentName: string }[]
  criticalSupplies: { id: string; name: string; stockQuantity: number; minStock: number }[]
  annualCost: number
  monthlyMaintenance: { name: string; value: number }[]
  statusDistribution: { name: string; value: number }[]
  categoryDistribution: { name: string; value: number }[]
  topEquipment: { name: string; code: string; maintenanceCount: number; cost: number; availability: number }[]
  incidentsByPriority: { name: string; value: number }[]
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  size: number
}
