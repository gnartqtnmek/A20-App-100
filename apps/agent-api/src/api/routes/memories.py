"""Memory routes."""

from __future__ import annotations

import math

from fastapi import APIRouter, Depends, HTTPException, Query, Request

from ..auth import AuthUser, get_current_user
from ..deps import get_container
from ..schemas import MemoryItemResponse, PaginatedMemoriesResponse

router = APIRouter()


@router.get("/memories", response_model=PaginatedMemoriesResponse)
async def list_memories(
    request: Request,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    memory_type: str | None = Query(None, alias="type"),
    current_user: AuthUser = Depends(get_current_user),
):
    container = get_container(request)
    total, rows, by_type = await container.memories.list_memories(
        current_user.id,
        page=page,
        limit=limit,
        memory_type=memory_type,
    )
    items = [MemoryItemResponse.model_validate(row) for row in rows]
    pages = max(1, math.ceil(total / limit)) if total else 1
    return PaginatedMemoriesResponse(
        items=items,
        total=total,
        by_type=by_type,
        page=page,
        limit=limit,
        pages=pages,
        has_next=page < pages,
        has_prev=page > 1,
    )


@router.get("/memories/my", response_model=PaginatedMemoriesResponse)
async def list_my_memories(
    request: Request,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    memory_type: str | None = Query(None, alias="type"),
    current_user: AuthUser = Depends(get_current_user),
):
    return await list_memories(
        request=request,
        page=page,
        limit=limit,
        memory_type=memory_type,
        current_user=current_user,
    )


@router.delete("/memories/{memory_id}", status_code=204)
async def delete_memory(
    memory_id: str,
    request: Request,
    current_user: AuthUser = Depends(get_current_user),
):
    container = get_container(request)
    deleted = await container.memories.delete_memory(current_user.id, memory_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Memory not found")
    return None


@router.delete("/memories")
async def delete_all_memories(
    request: Request,
    current_user: AuthUser = Depends(get_current_user),
):
    container = get_container(request)
    deleted_count = await container.memories.delete_all_memories(current_user.id)
    return {"deleted_count": deleted_count}
