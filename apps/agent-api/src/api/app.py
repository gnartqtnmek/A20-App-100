"""FastAPI application factory and lifespan wiring."""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from ..agent.runtime import AgentRuntimeService
from ..infra.db import Database, set_database
from ..infra.settings import get_settings
from ..services.conversation import ConversationService
from ..services.lms import LMSService
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
    lms = LMSService(
        base_url=settings.lms_api_url,
        agent_service_token=settings.agent_service_token,
    )

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
        lms=lms,
    )

    app.state.container = AppContainer(
        database=database,
        conversations=conversations,
        personalization=personalization,
        summaries=summaries,
        rag=rag,
        lms=lms,
        agent_runtime=agent_runtime,
    )
    yield

    await lms.aclose()
    await database.close()


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(title=settings.app_name, lifespan=lifespan)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=False,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.include_router(health_router)
    app.include_router(conversations_router)
    app.include_router(debug_router)
    return app


app = create_app()
