"""Agent runtime built on LangGraph StateGraph with full async support."""

from __future__ import annotations

import logging
import uuid
from dataclasses import dataclass
from typing import Any, AsyncIterator, Sequence

from langchain_core.messages import AIMessage, BaseMessage, HumanMessage, SystemMessage, ToolMessage
from langchain_core.runnables import RunnableConfig
from langgraph.graph import END, StateGraph
from langgraph.graph.message import MessagesState
from langgraph.prebuilt import ToolNode

from ..infra.llm import create_llm
from ..infra.settings import Settings
from ..services.personalization import PersonalizationService
from ..services.context_builder import PromptContextBuilder
from ..services.rag import RAGService
from .prompts import SYSTEM_PROMPT_TEMPLATE
from .tools import build_tools

logger = logging.getLogger(__name__)


class AgentState(MessagesState):
    prompt_context: str


@dataclass
class AgentRunResult:
    run_id: str
    generated_messages: list[BaseMessage]
    assistant_message: str
    tool_trace_summary: list[str]


def _build_graph(tools: list, checkpointer: Any):
    tool_node = ToolNode(tools, handle_tool_errors=True)

    async def call_model(state: AgentState, config: RunnableConfig) -> dict:
        configurable = config.get("configurable") or {}
        llm = create_llm(
            provider=configurable.get("model_provider"),
            model_name=configurable.get("model_name"),
        )
        prompt_context = (state.get("prompt_context") or "").strip()
        system_content = SYSTEM_PROMPT_TEMPLATE.format(
            prompt_context_block=prompt_context or "No additional stored context is available."
        )
        messages = [SystemMessage(content=system_content)] + list(state["messages"])
        response = None
        async for chunk in llm.bind_tools(tools).astream(messages):
            response = chunk if response is None else response + chunk
        return {"messages": [response]}

    def should_continue(state: AgentState) -> str:
        last = state["messages"][-1]
        return "tools" if getattr(last, "tool_calls", None) else END

    graph = StateGraph(AgentState)
    graph.add_node("agent", call_model)
    graph.add_node("tools", tool_node)
    graph.set_entry_point("agent")
    graph.add_conditional_edges("agent", should_continue, {"tools": "tools", END: END})
    graph.add_edge("tools", "agent")
    return graph.compile(checkpointer=None)


class AgentRuntimeService:
    def __init__(
        self,
        *,
        settings: Settings,
        message_loader,
        prompt_context_builder: PromptContextBuilder,
        personalization: PersonalizationService,
        rag: RAGService,
    ):
        self.settings = settings
        self.message_loader = message_loader
        self.prompt_context_builder = prompt_context_builder
        tools = build_tools(personalization, rag)
        self.agent = _build_graph(tools, checkpointer=None)

    def _make_config(
        self,
        *,
        user_id: str,
        model_provider: str | None,
        model_name: str | None,
    ) -> dict:
        return {
            "recursion_limit": self.settings.max_agent_steps,
            "configurable": {
                "user_id": user_id,
                "model_provider": model_provider or self.settings.llm_provider,
                "model_name": model_name or self.settings.default_model,
            },
        }

    async def invoke(
        self,
        *,
        user_id: str,
        conversation_id: str,
        content: str,
        model_provider: str | None = None,
        model_name: str | None = None,
    ) -> AgentRunResult:
        run_id = str(uuid.uuid4())
        config = self._make_config(
            user_id=user_id,
            model_provider=model_provider,
            model_name=model_name,
        )
        
        # Load chat history from conversations table
        history = await self.message_loader.load_history(conversation_id, user_id)
        prompt_context = await self.prompt_context_builder.build(user_id, conversation_id)
        
        # Build initial state with history + new message
        initial_state = {
            "messages": history + [HumanMessage(content=content)],
            "prompt_context": prompt_context,
        }

        result = await self.agent.ainvoke(initial_state, config)

        # Calculate generated messages by comparing lengths
        current_messages = list(result["messages"])
        generated_messages = list(current_messages[len(history) + 1:])
        assistant_message = self._extract_assistant_message(generated_messages)
        tool_trace_summary = self._summarize_tool_trace(generated_messages)
        return AgentRunResult(
            run_id=run_id,
            generated_messages=generated_messages,
            assistant_message=assistant_message,
            tool_trace_summary=tool_trace_summary,
        )

    async def stream(
        self,
        *,
        user_id: str,
        conversation_id: str,
        content: str,
        model_provider: str | None = None,
        model_name: str | None = None,
    ) -> AsyncIterator[dict[str, Any]]:
        """Stream agent output using LangGraph's `stream_mode="messages"`.

        Yields event dicts:
        - {"type": "chunk", "text": str, "metadata": dict} for each token chunk
        - {"type": "tool_call", "name": str, "args": dict} when the agent invokes a tool
        - {"type": "tool_result", "name": str, "content": str} when a tool returns
        - {"type": "final", "result": AgentRunResult} once at the end
        """
        run_id = str(uuid.uuid4())
        config = self._make_config(
            user_id=user_id,
            model_provider=model_provider,
            model_name=model_name,
        )
        
        # Load chat history from conversations table
        history = await self.message_loader.load_history(conversation_id, user_id)
        prompt_context = await self.prompt_context_builder.build(user_id, conversation_id)
        
        # Build initial state with history + new message
        initial_state = {
            "messages": history + [HumanMessage(content=content)],
            "prompt_context": prompt_context,
        }

        # Track all messages during streaming
        # Note: stream_mode="messages" streams message CHUNKS, not complete messages
        # We need to merge chunks into complete messages before saving
        all_chunks: list[BaseMessage] = []
        emitted_tool_calls: set[str] = set()
        async for chunk, metadata in self.agent.astream(
            initial_state,
            config,
            stream_mode="messages",
        ):
            all_chunks.append(chunk)
            
            if isinstance(chunk, ToolMessage):
                yield {
                    "type": "tool_result",
                    "name": getattr(chunk, "name", None) or "tool",
                    "content": _chunk_text(chunk),
                }
                continue

            has_tool_call = False
            for tool_call in getattr(chunk, "tool_calls", None) or []:
                call_id = tool_call.get("id") or tool_call.get("name", "")
                if call_id in emitted_tool_calls:
                    continue
                emitted_tool_calls.add(call_id)
                has_tool_call = True
                yield {
                    "type": "tool_call",
                    "name": tool_call.get("name", "unknown_tool"),
                    "args": tool_call.get("args", {}) or {},
                }
            if has_tool_call:
                continue

            text = _chunk_text(chunk)
            if text:
                yield {"type": "chunk", "text": text, "metadata": metadata or {}}

        # Merge chunks into complete messages
        # Group chunks by message ID and merge them
        generated_messages = self._merge_message_chunks(all_chunks, history)
        
        assistant_message = self._extract_assistant_message(generated_messages)
        tool_trace_summary = self._summarize_tool_trace(generated_messages)
        yield {
            "type": "final",
            "result": AgentRunResult(
                run_id=run_id,
                generated_messages=generated_messages,
                assistant_message=assistant_message,
                tool_trace_summary=tool_trace_summary,
            ),
        }

    @staticmethod
    def _merge_message_chunks(chunks: list[BaseMessage], history: list[BaseMessage]) -> list[BaseMessage]:
        """Merge AIMessageChunk objects into complete AIMessage objects.
        
        stream_mode="messages" streams message chunks, not complete messages.
        This method merges consecutive chunks with the same ID into single messages.
        
        Args:
            chunks: List of message chunks from stream
            history: History messages to skip
            
        Returns:
            List of complete messages in correct order
        """
        from langchain_core.messages import AIMessage
        
        result: list[BaseMessage] = []
        current_ai_chunk = None
        current_ai_id = None
        
        for chunk in chunks:
            # Skip HumanMessage (user message already saved)
            if isinstance(chunk, HumanMessage):
                continue
            
            # ToolMessage - save any pending AI chunk first, then add tool message
            if isinstance(chunk, ToolMessage):
                if current_ai_chunk is not None:
                    # Convert accumulated AIMessageChunk to AIMessage
                    ai_message = AIMessage(
                        content=current_ai_chunk.content,
                        additional_kwargs=getattr(current_ai_chunk, "additional_kwargs", {}),
                        response_metadata=getattr(current_ai_chunk, "response_metadata", {}),
                        id=current_ai_id,
                        tool_calls=getattr(current_ai_chunk, "tool_calls", []),
                    )
                    result.append(ai_message)
                    current_ai_chunk = None
                    current_ai_id = None
                
                # Add tool message
                result.append(chunk)
                continue
            
            # AIMessageChunk - merge with previous chunk if same ID, otherwise start new
            if hasattr(chunk, "__class__") and "Chunk" in chunk.__class__.__name__:
                chunk_id = getattr(chunk, "id", None)
                
                if chunk_id == current_ai_id and current_ai_chunk is not None:
                    # Same ID - merge with current chunk
                    current_ai_chunk = current_ai_chunk + chunk
                else:
                    # Different ID - save previous chunk and start new
                    if current_ai_chunk is not None:
                        ai_message = AIMessage(
                            content=current_ai_chunk.content,
                            additional_kwargs=getattr(current_ai_chunk, "additional_kwargs", {}),
                            response_metadata=getattr(current_ai_chunk, "response_metadata", {}),
                            id=current_ai_id,
                            tool_calls=getattr(current_ai_chunk, "tool_calls", []),
                        )
                        result.append(ai_message)
                    
                    current_ai_chunk = chunk
                    current_ai_id = chunk_id
        
        # Don't forget the last AI chunk
        if current_ai_chunk is not None:
            ai_message = AIMessage(
                content=current_ai_chunk.content,
                additional_kwargs=getattr(current_ai_chunk, "additional_kwargs", {}),
                response_metadata=getattr(current_ai_chunk, "response_metadata", {}),
                id=current_ai_id,
                tool_calls=getattr(current_ai_chunk, "tool_calls", []),
            )
            result.append(ai_message)
        
        return result

    @staticmethod
    def _extract_assistant_message(messages: Sequence[BaseMessage]) -> str:
        for message in reversed(messages):
            if isinstance(message, AIMessage):
                tool_calls = getattr(message, "tool_calls", None) or []
                if tool_calls:
                    continue
                content = _flatten_message_content(message)
                if content:
                    return content

        for message in reversed(messages):
            if isinstance(message, AIMessage):
                content = _flatten_message_content(message)
                if content:
                    return content
        return "The agent completed without a final assistant message."

    @staticmethod
    def _summarize_tool_trace(messages: Sequence[BaseMessage]) -> list[str]:
        traces: list[str] = []
        for message in messages:
            if isinstance(message, AIMessage):
                for tool_call in getattr(message, "tool_calls", None) or []:
                    name = tool_call.get("name", "unknown_tool")
                    traces.append(f"assistant -> {name}")
            elif isinstance(message, ToolMessage):
                name = getattr(message, "name", None) or "tool"
                content = _flatten_message_content(message)
                excerpt = content[:120] + ("..." if len(content) > 120 else "")
                traces.append(f"{name} -> {excerpt}")
        return traces


def _chunk_text(message: BaseMessage) -> str:
    content = getattr(message, "content", None)
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        parts: list[str] = []
        for item in content:
            if isinstance(item, str):
                parts.append(item)
            elif isinstance(item, dict):
                text = item.get("text")
                if text:
                    parts.append(str(text))
        return "".join(parts)
    return ""


def _flatten_message_content(message: BaseMessage) -> str:
    content = message.content
    if isinstance(content, str):
        return content.strip()
    if isinstance(content, list):
        texts: list[str] = []
        for item in content:
            if isinstance(item, str):
                texts.append(item)
            elif isinstance(item, dict) and item.get("text"):
                texts.append(str(item["text"]))
            else:
                texts.append(str(item))
        return "\n".join(texts).strip()
    return str(content).strip()
