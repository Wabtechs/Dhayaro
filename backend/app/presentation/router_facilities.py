from uuid import UUID
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.domain.models import User, Facility, AuditLog
from app.domain.enums import UserRole
from app.application.schemas import FacilityCreate, FacilityUpdate, FacilityResponse, PaginatedResponse
from app.infrastructure.repositories import FacilityRepository, AuditLogRepository
from app.deps import require_role
from app.application.exceptions import NotFoundException, ConflictException

router = APIRouter(prefix="/facilities", tags=["Facilities"])


@router.get("", response_model=PaginatedResponse[FacilityResponse])
async def list_facilities(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.DOCTOR, UserRole.RESEARCHER)),
    db: AsyncSession = Depends(get_db),
):
    facility_repo = FacilityRepository(Facility, db)
    items, total = await facility_repo.get_all(page=page, size=size)
    pages = (total + size - 1) // size

    return PaginatedResponse(
        items=[FacilityResponse.model_validate(f) for f in items],
        total=total,
        page=page,
        size=size,
        pages=pages,
    )


@router.post("", response_model=FacilityResponse, status_code=201)
async def create_facility(
    data: FacilityCreate,
    current_user: User = Depends(require_role(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    facility_repo = FacilityRepository(Facility, db)
    existing = await facility_repo.get_by_code(data.code)
    if existing:
        raise ConflictException("Facility code already exists")

    facility = await facility_repo.create(**data.model_dump())

    audit_repo = AuditLogRepository(AuditLog, db)
    await audit_repo.create(
        user_id=current_user.id,
        facility_id=facility.id,
        action="CREATE",
        resource="facility",
        resource_id=str(facility.id),
    )

    return facility


@router.get("/{facility_id}")
async def get_facility(
    facility_id: UUID,
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.DOCTOR, UserRole.RESEARCHER)),
    db: AsyncSession = Depends(get_db),
):
    facility_repo = FacilityRepository(Facility, db)
    result = await facility_repo.get_with_stats(facility_id)
    if not result:
        raise NotFoundException("Facility not found")

    return {
        "facility": FacilityResponse.model_validate(result["facility"]),
        "stats": result["stats"],
    }


@router.put("/{facility_id}", response_model=FacilityResponse)
async def update_facility(
    facility_id: UUID,
    data: FacilityUpdate,
    current_user: User = Depends(require_role(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    facility_repo = FacilityRepository(Facility, db)
    facility = await facility_repo.update(facility_id, **data.model_dump(exclude_unset=True))
    if not facility:
        raise NotFoundException("Facility not found")

    audit_repo = AuditLogRepository(AuditLog, db)
    await audit_repo.create(
        user_id=current_user.id,
        facility_id=facility.id,
        action="UPDATE",
        resource="facility",
        resource_id=str(facility.id),
    )

    return facility


@router.delete("/{facility_id}")
async def delete_facility(
    facility_id: UUID,
    current_user: User = Depends(require_role(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    facility_repo = FacilityRepository(Facility, db)
    facility = await facility_repo.update(facility_id, is_active=False)
    if not facility:
        raise NotFoundException("Facility not found")

    audit_repo = AuditLogRepository(AuditLog, db)
    await audit_repo.create(
        user_id=current_user.id,
        facility_id=facility.id,
        action="DELETE",
        resource="facility",
        resource_id=str(facility_id),
    )

    return {"message": "Facility deactivated successfully"}
