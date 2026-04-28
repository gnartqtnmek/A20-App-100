"""LangChain LLM factory.

Supports multiple providers via the same interface. Choose via LLM_PROVIDER:
  - "openai"    → ChatOpenAI (works with any OpenAI-compatible endpoint)
  - "anthropic" → ChatAnthropic
  - "ollama"    → ChatOllama (local models)
"""
from __future__ import annotations

from functools import lru_cache
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from langchain_core.language_models import BaseChatModel


def get_chat_model(*, streaming: bool = False) -> "BaseChatModel":
    """Return a configured LangChain chat model."""
    from app.core.config import get_settings

    s = get_settings()

    if s.llm_provider == "anthropic":
        from langchain_anthropic import ChatAnthropic

        return ChatAnthropic(
            model=s.llm_model,
            api_key=s.llm_api_key,
            temperature=s.llm_temperature,
            max_tokens=s.llm_max_tokens,
            streaming=streaming,
        )

    if s.llm_provider == "ollama":
        from langchain_ollama import ChatOllama

        return ChatOllama(
            model=s.llm_model,
            base_url=s.llm_base_url,
            temperature=s.llm_temperature,
        )

    # Default: OpenAI / OpenAI-compatible
    from langchain_openai import ChatOpenAI

    return ChatOpenAI(
        model=s.llm_model,
        api_key=s.llm_api_key,
        base_url=s.llm_base_url or None,
        temperature=s.llm_temperature,
        max_tokens=s.llm_max_tokens,
        streaming=streaming,
    )


@lru_cache(maxsize=1)
def get_chat_model_cached() -> "BaseChatModel":
    """Non-streaming model cached for reuse (e.g. summarisation)."""
    return get_chat_model(streaming=False)
