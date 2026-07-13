from uuid import UUID
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.domain.models import User, AuditLog
from app.domain.enums import UserRole
from app.application.schemas import AuditLogResponse, PaginatedResponse
from app.infrastructure.repositories import AuditLogRepository
from app.deps import require_role

router = APIRouter(prefix="/audit", tags=["Audit Logs"])


@router.get("/stats")
async def get_audit_stats(
    current_user: User = Depends(require_role(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    audit_repo = AuditLogRepository(AuditLog, db)
    stats = await audit_repo.get_stats()
    return stats


@router.get("", response_model=PaginatedResponse[AuditLogResponse])
async def list_audit_logs(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    user_id: UUID | None = None,
    action: str | None = None,
    resource: str | None = None,
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.DOCTOR, UserRole.RESEARCHER)),
    db: AsyncSession = Depends(get_db),
):
    audit_repo = AuditLogRepository(AuditLog, db)

    if user_id:
        items, total = await audit_repo.get_by_user(user_id, page=page, size=size)
    elif resource:
        items, total = await audit_repo.get_by_resource(resource, page=page, size=size)
    else:
        filters = {}
        if action:
            filters["action"] = action
        items, total = await audit_repo.get_all(page=page, size=size, filters=filters)

    pages = (total + size - 1) // size

    return PaginatedResponse(
        items=[AuditLogResponse.model_validate(log) for log in items],
        total=total,
        page=page,
        size=size,
        pages=pages,
    )
