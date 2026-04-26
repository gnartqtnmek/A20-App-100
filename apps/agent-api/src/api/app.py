"""FastAPI application factory and lifespan wiring."""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI

from ..agent.runtime import AgentRuntimeService
from ..infra.db import Database, set_database
from ..infra.settings import get_settings
from ..services.conversation import ConversationService
from ..services.message_loader import MessageLoader
from ..services.personalization import PersonalizationService
from ..services.context_builder import PromptContextBuilder
from ..services.rag import RAGService
from ..services.summary import SummaryService
from .deps import AppContainer
from .routes.conversations import router as conversations_router
from .routes.health import router as health_router
from .routes.debug import router as debug_router

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    database = Database(settings.database_url)
    await database.open()
    set_database(database)

    conversations = ConversationService(database)
    personalization = PersonalizationService(database)
    summaries = SummaryService(database)
    rag = RAGService(database, settings)
    message_loader = MessageLoader(database)
    
    prompt_context_builder = PromptContextBuilder(
        personalization=personalization,
        summaries=summaries,
    )
    
    agent_runtime = AgentRuntimeService(
        settings=settings,
        message_loader=message_loader,
        prompt_context_builder=prompt_context_builder,
        personalization=personalization,
        rag=rag,
    )

    app.state.container = AppContainer(
        database=database,
        conversations=conversations,
        personalization=personalization,
        summaries=summaries,
        rag=rag,
        agent_runtime=agent_runtime,
    )
    yield

    await database.close()


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(title=settings.app_name, lifespan=lifespan)
    app.include_router(health_router)
    app.include_router(conversations_router)
    app.include_router(debug_router)
    return app


app = create_app()
