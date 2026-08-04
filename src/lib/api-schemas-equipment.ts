import { z } from 'zod'

export const EQUIPMENT_TYPES = ['BIOMEDICAL', 'MEDICAL', 'FURNITURE', 'IT', 'OTHER'] as const
export const EQUIPMENT_STATUSES = ['AVAILABLE', 'IN_USE', 'MAINTENANCE', 'BROKEN', 'RESERVED', 'OUT_OF_SERVICE', 'RETIRED', 'LOST'] as const
export const EQUIPMENT_STATES = ['NEW', 'GOOD', 'FAIR', 'POOR', 'CRITICAL'] as const
export const LOCATION_TYPES = ['FACILITY', 'BUILDING', 'FLOOR', 'DEPARTMENT', 'ROOM', 'POSITION'] as const
export const ASSIGNMENT_TYPES = ['DOCTOR', 'NURSE', 'TECHNICIAN', 'DEPARTMENT', 'SERVICE', 'OTHER'] as const
export const MAINTENANCE_TYPES = ['PREVENTIVE', 'CORRECTIVE', 'INSPECTION', 'CALIBRATION', 'VALIDATION', 'REVISION'] as const
export const MAINTENANCE_STATUSES = ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'OVERDUE'] as const
export const MAINTENANCE_TASK_STATUSES = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED'] as const
export const INCIDENT_STATUSES = ['OPEN', 'IN_PROGRESS', 'ON_HOLD', 'RESOLVED', 'CLOSED'] as const
export const INCIDENT_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT', 'CRITICAL'] as const
export const BOOKING_STATUSES = ['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'] as const
export const WARRANTY_STATUSES = ['ACTIVE', 'EXPIRED', 'CLAIMED'] as const
export const EQUIPMENT_DOC_CATEGORIES = ['INVOICE', 'CONTRACT', 'WARRANTY', 'MANUAL', 'REPORT', 'CERTIFICATE', 'PHOTO', 'OTHER'] as const
export const SUPPLY_CATEGORIES = ['GLOVES', 'SYRINGES', 'COMPRESSES', 'MASKS', 'REAGENTS', 'CATHETERS', 'IV_BAGS', 'PERFUSION', 'SUTURES', 'BANDAGES', 'DISINFECTANTS', 'OTHER'] as const
export const STOCK_MOVEMENT_TYPES = ['RECEIPT', 'ISSUE', 'TRANSFER_IN', 'TRANSFER_OUT', 'ADJUSTMENT', 'RETURN', 'EXPIRED', 'MANUAL'] as const
export const PO_STATUSES = ['DRAFT', 'SUBMITTED', 'ORDERED', 'PARTIAL', 'RECEIVED', 'CANCELLED'] as const
export const EQUIPMENT_AUDIT_TYPES = ['INVENTORY', 'STATUS_CHECK', 'REGULATORY', 'QUALITY', 'SAFETY'] as const

const optUuid = z.union([z.uuid(), z.literal(''), z.null()]).nullish()
const optStr = z.union([z.string(), z.literal(''), z.null()]).nullish()
const optDate = z.union([z.string(), z.literal(''), z.null()]).nullish()
const optNum = z.union([z.number(), z.string(), z.literal(''), z.null()]).nullish()
const optBool = z.union([z.boolean(), z.null()]).nullish()

function toNum(v: string | number | null | undefined): number | null {
  if (v === null || v === undefined || v === '') return null
  const n = typeof v === 'number' ? v : Number(v)
  return Number.isFinite(n) ? n : null
}

export function normalizeNum(value: unknown): number | null {
  return toNum(value as string | number | null | undefined)
}

export function normalizeStr(value: unknown): string | null {
  if (value === null || value === undefined || value === '') return null
  return String(value)
}

export function normalizeDate(value: unknown): string | null {
  if (value === null || value === undefined || value === '') return null
  const s = String(value)
  const d = new Date(s)
  return Number.isNaN(d.getTime()) ? null : s
}

// EQUIPMENT CATEGORY

export const equipmentCategoryCreateSchema = z.object({
  name: z.string().min(1),
  parentId: optUuid,
  icon: optStr,
  color: optStr,
  description: optStr,
  isActive: optBool,
  facilityId: optUuid,
})

export const equipmentCategoryUpdateSchema = equipmentCategoryCreateSchema.partial()

// MEDICAL EQUIPMENT

export const medicalEquipmentCreateSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  type: z.enum(EQUIPMENT_TYPES).default('BIOMEDICAL'),
  qrCode: optStr,
  barcode: optStr,
  description: optStr,
  categoryId: optUuid,
  subCategoryId: optUuid,
  manufacturer: optStr,
  brand: optStr,
  model: optStr,
  serialNumber: optStr,
  purchaseDate: optDate,
  purchasePrice: optNum,
  currency: optStr,
  warrantyMonths: optNum,
  lifecycleYears: optNum,
  state: z.enum(EQUIPMENT_STATES).default('NEW'),
  status: z.enum(EQUIPMENT_STATUSES).default('AVAILABLE'),
  photo: optStr,
  responsibleUserId: optUuid,
  locationId: optUuid,
  building: optStr,
  floor: optStr,
  department: optStr,
  room: optStr,
  position: optStr,
  commissioningDate: optDate,
  retirementDate: optDate,
  comments: optStr,
  facilityId: optUuid,
})

export const medicalEquipmentUpdateSchema = medicalEquipmentCreateSchema.partial()

// LOCATION

export const equipmentLocationCreateSchema = z.object({
  type: z.enum(LOCATION_TYPES).default('DEPARTMENT'),
  name: z.string().min(1),
  parentId: optUuid,
  building: optStr,
  floor: optStr,
  department: optStr,
  room: optStr,
  position: optStr,
  code: optStr,
  description: optStr,
  isActive: optBool,
  facilityId: optUuid,
})

export const equipmentLocationUpdateSchema = equipmentLocationCreateSchema.partial()

// ASSIGNMENT

export const equipmentAssignmentCreateSchema = z.object({
  equipmentId: z.string().min(1),
  assignedToType: z.enum(ASSIGNMENT_TYPES).default('DEPARTMENT'),
  assignedToId: optUuid,
  assignedToName: optStr,
  department: optStr,
  startedAt: optDate,
  endedAt: optDate,
  notes: optStr,
  facilityId: optUuid,
})

export const equipmentAssignmentUpdateSchema = equipmentAssignmentCreateSchema.partial()

// DOCUMENT

export const equipmentDocumentCreateSchema = z.object({
  equipmentId: z.string().min(1),
  title: z.string().min(1),
  category: z.enum(EQUIPMENT_DOC_CATEGORIES).default('OTHER'),
  filePath: optStr,
  fileType: optStr,
  fileSize: optNum,
  description: optStr,
  facilityId: optUuid,
})

export const equipmentDocumentUpdateSchema = equipmentDocumentCreateSchema.partial()

// MAINTENANCE

export const equipmentMaintenanceCreateSchema = z.object({
  equipmentId: z.string().min(1),
  maintenanceType: z.enum(MAINTENANCE_TYPES).default('PREVENTIVE'),
  status: z.enum(MAINTENANCE_STATUSES).default('SCHEDULED'),
  scheduledDate: optDate,
  startedAt: optDate,
  completedAt: optDate,
  technicianUserId: optUuid,
  technicianName: optStr,
  company: optStr,
  cost: optNum,
  currency: optStr,
  durationHours: optNum,
  priority: z.enum(INCIDENT_PRIORITIES).default('MEDIUM'),
  report: optStr,
  photos: z.array(z.string()).nullish(),
  partsReplaced: z.array(z.object({ name: z.string(), quantity: z.number(), cost: z.number().nullish() })).nullish(),
  signature: optStr,
  notes: optStr,
  facilityId: optUuid,
})

export const equipmentMaintenanceUpdateSchema = equipmentMaintenanceCreateSchema.partial()

// MAINTENANCE TASK

export const maintenanceTaskCreateSchema = z.object({
  maintenanceId: z.string().min(1),
  title: z.string().min(1),
  description: optStr,
  status: z.enum(MAINTENANCE_TASK_STATUSES).default('PENDING'),
  facilityId: optUuid,
})

export const maintenanceTaskUpdateSchema = maintenanceTaskCreateSchema.partial()

// INCIDENT

export const equipmentIncidentCreateSchema = z.object({
  equipmentId: z.string().min(1),
  title: z.string().min(1),
  description: optStr,
  priority: z.enum(INCIDENT_PRIORITIES).default('MEDIUM'),
  status: z.enum(INCIDENT_STATUSES).default('OPEN'),
  reportedByUserId: optUuid,
  assignedToUserId: optUuid,
  resolutionNotes: optStr,
  rootCause: optStr,
  cost: optNum,
  facilityId: optUuid,
})

export const equipmentIncidentUpdateSchema = equipmentIncidentCreateSchema.partial()

// WARRANTY

export const equipmentWarrantyCreateSchema = z.object({
  equipmentId: z.string().min(1),
  supplierId: optUuid,
  startDate: optDate,
  endDate: z.string().min(1),
  status: z.enum(WARRANTY_STATUSES).default('ACTIVE'),
  coverage: optStr,
  terms: optStr,
  cost: optNum,
  notes: optStr,
  facilityId: optUuid,
})

export const equipmentWarrantyUpdateSchema = equipmentWarrantyCreateSchema.partial()

// BOOKING

export const equipmentBookingCreateSchema = z.object({
  equipmentId: z.string().min(1),
  bookedByUserId: optUuid,
  assignedToName: optStr,
  assignedToId: optUuid,
  purpose: z.string().min(1),
  startTime: z.string().min(1),
  endTime: z.string().min(1),
  status: z.enum(BOOKING_STATUSES).default('PENDING'),
  notes: optStr,
  facilityId: optUuid,
})

export const equipmentBookingUpdateSchema = equipmentBookingCreateSchema.partial()

// SUPPLIER

export const equipmentSupplierCreateSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  contactPerson: optStr,
  phone: optStr,
  email: optStr,
  address: optStr,
  city: optStr,
  category: optStr,
  rating: optNum,
  isActive: optBool,
  notes: optStr,
  facilityId: optUuid,
})

export const equipmentSupplierUpdateSchema = equipmentSupplierCreateSchema.partial()

// EQUIPMENT AUDIT

export const equipmentAuditCreateSchema = z.object({
  equipmentId: z.string().min(1),
  auditType: z.enum(EQUIPMENT_AUDIT_TYPES).default('STATUS_CHECK'),
  auditedByUserId: optUuid,
  auditDate: z.string().min(1),
  status: z.enum(EQUIPMENT_STATES).default('GOOD'),
  findings: z.array(z.object({ label: z.string(), result: z.string(), note: z.string().nullish() })).nullish(),
  nextAuditDate: optDate,
  notes: optStr,
  facilityId: optUuid,
})

export const equipmentAuditUpdateSchema = equipmentAuditCreateSchema.partial()

// SPARE PART

export const sparePartCreateSchema = z.object({
  name: z.string().min(1),
  code: optStr,
  sku: optStr,
  categoryId: optUuid,
  description: optStr,
  unit: optStr,
  manufacturer: optStr,
  supplierId: optUuid,
  quantity: optNum,
  minThreshold: optNum,
  unitCost: optNum,
  location: optStr,
  currency: optStr,
  isActive: optBool,
  facilityId: optUuid,
})

export const sparePartUpdateSchema = sparePartCreateSchema.partial()

// MEDICAL SUPPLY

export const medicalSupplyCreateSchema = z.object({
  name: z.string().min(1),
  code: optStr,
  sku: optStr,
  category: z.enum(SUPPLY_CATEGORIES).default('OTHER'),
  description: optStr,
  unit: optStr,
  minStock: optNum,
  criticalStock: optNum,
  price: optNum,
  currency: optStr,
  supplierId: optUuid,
  isActive: optBool,
  facilityId: optUuid,
})

export const medicalSupplyUpdateSchema = medicalSupplyCreateSchema.partial()

// SUPPLY BATCH

export const supplyBatchCreateSchema = z.object({
  supplyId: z.string().min(1),
  batchNumber: optStr,
  lotNumber: optStr,
  manufacturerDate: optDate,
  expiryDate: optDate,
  quantity: optNum,
  receivedDate: optDate,
  supplierId: optUuid,
  purchaseOrderId: optUuid,
  facilityId: optUuid,
})

export const supplyBatchUpdateSchema = supplyBatchCreateSchema.partial()

// STOCK MOVEMENT

export const stockMovementCreateSchema = z.object({
  supplyId: z.string().min(1),
  batchId: optUuid,
  movementType: z.enum(STOCK_MOVEMENT_TYPES),
  quantity: z.number(),
  unitCost: optNum,
  fromLocation: optStr,
  toLocation: optStr,
  reason: optStr,
  referenceId: optStr,
  facilityId: optUuid,
})

export const stockMovementUpdateSchema = stockMovementCreateSchema.partial()

// PURCHASE ORDER

export const purchaseOrderCreateSchema = z.object({
  supplierId: optUuid,
  orderDate: optDate,
  expectedDate: optDate,
  receivedDate: optDate,
  status: z.enum(PO_STATUSES).default('DRAFT'),
  totalAmount: optNum,
  currency: optStr,
  notes: optStr,
  items: z.array(z.object({
    itemType: z.string().default('supply'),
    supplyId: optUuid,
    sparePartId: optUuid,
    equipmentId: optUuid,
    description: z.string().min(1),
    quantity: z.number(),
    unitPrice: z.number().default(0),
    receivedQuantity: z.number().default(0),
  })).nullish(),
  facilityId: optUuid,
})

export const purchaseOrderUpdateSchema = purchaseOrderCreateSchema.partial()

// PURCHASE ORDER ITEM

export const purchaseOrderItemCreateSchema = z.object({
  orderId: z.string().min(1),
  itemType: z.string().default('supply'),
  supplyId: optUuid,
  sparePartId: optUuid,
  equipmentId: optUuid,
  description: z.string().min(1),
  quantity: z.number(),
  unitPrice: z.number().default(0),
  receivedQuantity: z.number().default(0),
  facilityId: optUuid,
})

export const purchaseOrderItemUpdateSchema = purchaseOrderItemCreateSchema.partial()
