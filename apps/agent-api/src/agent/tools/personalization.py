"""Personalization memory tools (read / upsert / delete)."""

from __future__ import annotations

from langchain_core.runnables import RunnableConfig
from langchain_core.tools import tool

from ...services.personalization import PersonalizationService


def build_personalization_tools(personalization: PersonalizationService):
    @tool
    async def personalization_upsert(updates: dict[str, str], config: RunnableConfig) -> str:
        """Store stable user facts or preferences for future conversations.

        Use this whenever the user shares something durable that should be remembered later.
        Required argument:
        - `updates`: a non-empty object mapping string keys to string values.
        Never call this tool with empty arguments.
        Valid call shape:
        - {"updates": {"diet_preference": "vegetarian"}}
        - {"updates": {"subject_interest": "toan hoc"}}
        - {"updates": {"preferred_name": "An"}}

        Invalid call shape:
        - {}
        - {"updates": {}}

        Examples:
        - updates={"diet_preference": "vegetarian"}
        - updates={"subject_interest": "toan hoc"}
        - updates={"preferred_name": "An"}
        Never say you remembered something unless this tool succeeds.
        """
        user_id = (config.get("configurable") or {}).get("user_id", "")
        return await personalization.upsert(user_id, updates)

    @tool
    async def personalization_delete(keys: str | list[str], config: RunnableConfig) -> str:
        """Delete one or more remembered personalization keys for the current user.

        Use this when the user asks to forget, remove, or clear a saved preference/fact.
        Required argument:
        - `keys`: a non-empty string or list of strings.
        Never call this tool with empty arguments.
        Valid call shapes:
        - {"keys": "diet_preference"}
        - {"keys": ["diet_preference", "preferred_name"]}
        Never say you deleted memory unless this tool succeeds.
        """
        user_id = (config.get("configurable") or {}).get("user_id", "")
        return await personalization.delete(user_id, keys)

    return [personalization_upsert, personalization_delete]
