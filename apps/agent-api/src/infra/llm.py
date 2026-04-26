"""LangChain chat model factory."""

from __future__ import annotations

from .settings import get_settings


def create_llm(provider: str | None = None, model_name: str | None = None):
    """Create an unbound LangChain chat model for the configured provider."""
    settings = get_settings()
    provider = provider or settings.llm_provider
    model_name = model_name or settings.default_model

    if provider == "anthropic":
        if not settings.anthropic_api_key:
            raise ValueError("ANTHROPIC_API_KEY is not configured. Check your .env file")
        from langchain_anthropic import ChatAnthropic

        return ChatAnthropic(
            model=model_name,
            api_key=settings.anthropic_api_key,
            max_tokens=settings.default_max_tokens,
            streaming=True,
        )

    if provider == "openai_compatible":
        if not settings.openai_api_key:
            raise ValueError("OPENAI_API_KEY is not configured. Check your .env file")
        from langchain_openai import ChatOpenAI

        return ChatOpenAI(
            model=model_name,
            api_key=settings.openai_api_key,
            base_url=settings.openai_base_url or None,
            max_tokens=settings.default_max_tokens,
            streaming=True,
        )

    raise ValueError(
        f"Unknown LLM_PROVIDER: '{provider}'. Use 'anthropic' or 'openai_compatible'."
    )
