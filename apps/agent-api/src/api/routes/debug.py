"""Debug routes for troubleshooting."""

from fastapi import APIRouter, Request, Query

from ..deps import get_container

router = APIRouter(prefix="/debug")


@router.get("/conversations/{conversation_id}/raw")
async def get_raw_messages(
    conversation_id: str,
    request: Request,
    user_id: str = Query(...),
):
    """Get raw messages from database for debugging."""
    container = get_container(request)
    
    # Get raw conversation data
    row = await container.database.fetch_one(
        "SELECT messages FROM conversations WHERE id = %s AND user_id = %s",
        (conversation_id, user_id)
    )
    
    if not row:
        return {"error": "Conversation not found"}
    
    return {
        "conversation_id": conversation_id,
        "messages": row.get("messages") or []
    }
