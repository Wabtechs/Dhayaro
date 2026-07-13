from uuid import UUID
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.domain.models import User, AuditLog
from app.domain.enums import UserRole
from app.application.schemas import UserCreate, UserUpdate, UserResponse, PaginatedResponse
from app.infrastructure.repositories import UserRepository, AuditLogRepository
from app.infrastructure.security import get_password_hash
from app.deps import get_current_user, require_role, get_facility_scope
from app.application.exceptions import NotFoundException, ConflictException

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("", response_model=PaginatedResponse[UserResponse])
async def list_users(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    facility_id: UUID | None = None,
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.DOCTOR, UserRole.RESEARCHER)),
    db: AsyncSession = Depends(get_db),
):
    user_repo = UserRepository(User, db)
    filters = {}
    if facility_id:
        filters["facility_id"] = facility_id

    items, total = await user_repo.get_all(page=page, size=size, filters=filters)
    pages = (total + size - 1) // size

    return PaginatedResponse(
        items=[UserResponse.model_validate(u) for u in items],
        total=total,
        page=page,
        size=size,
        pages=pages,
    )


@router.post("", response_model=UserResponse, status_code=201)
async def create_user(
    data: UserCreate,
    current_user: User = Depends(require_role(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    user_repo = UserRepository(User, db)
    existing = await user_repo.get_by_email(data.email)
    if existing:
        raise ConflictException("Email already registered")

    user = await user_repo.create(
        facility_id=data.facility_id,
        firstname=data.firstname,
        lastname=data.lastname,
        email=data.email,
        password_hash=get_password_hash(data.password),
        role=data.role,
    )

    audit_repo = AuditLogRepository(AuditLog, db)
    await audit_repo.create(
        user_id=current_user.id,
        facility_id=current_user.facility_id,
        action="CREATE",
        resource="user",
        resource_id=str(user.id),
    )

    return user


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: UUID,
    current_user: User = Depends(require_role(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    user_repo = UserRepository(User, db)
    user = await user_repo.get_by_id(user_id)
    if not user:
        raise NotFoundException("User not found")
    return user


@router.put("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: UUID,
    data: UserUpdate,
    current_user: User = Depends(require_role(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    user_repo = UserRepository(User, db)
    update_data = data.model_dump(exclude_unset=True)

    if "password" in update_data:
        update_data["password_hash"] = get_password_hash(update_data.pop("password"))

    user = await user_repo.update(user_id, **update_data)
    if not user:
        raise NotFoundException("User not found")

    audit_repo = AuditLogRepository(AuditLog, db)
    await audit_repo.create(
        user_id=current_user.id,
        facility_id=current_user.facility_id,
        action="UPDATE",
        resource="user",
        resource_id=str(user.id),
    )

    return user


@router.delete("/{user_id}")
async def delete_user(
    user_id: UUID,
    current_user: User = Depends(require_role(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    user_repo = UserRepository(User, db)
    user = await user_repo.update(user_id, is_active=False)
    if not user:
        raise NotFoundException("User not found")

    audit_repo = AuditLogRepository(AuditLog, db)
    await audit_repo.create(
        user_id=current_user.id,
        facility_id=current_user.facility_id,
        action="DELETE",
        resource="user",
        resource_id=str(user_id),
    )

    return {"message": "User deactivated successfully"}
