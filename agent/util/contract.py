from typing import List
from langchain_core.messages import ToolMessage, AIMessage
from langchain_core.runnables import RunnableConfig
from copilotkit.langgraph import copilotkit_emit_state

async def handle_tool_completion(state: dict, config: RunnableConfig):
    """
    Handle tool completion state and emit copilotkit state.
    """
    if state["messages"] and isinstance(state["messages"][-1], ToolMessage):
        tool_message = state["messages"][-1]
        # Find the corresponding tool call in the previous AIMessage
        for message in reversed(state["messages"][:-1]):
            if isinstance(message, AIMessage) and message.tool_calls:
                found = False
                for tool_call in message.tool_calls:
                    if tool_call["id"] == tool_message.tool_call_id:
                        await copilotkit_emit_state(
                            config,
                            {
                                "active_tool": {
                                    "id": tool_call["id"],
                                    "name": tool_call["name"],
                                    "args": tool_call["args"],
                                    "status": "done",
                                    "result": tool_message.content
                                }
                            }
                        )
                        found = True
                        break
                if found:
                    break

async def handle_tool_call_emission(response: AIMessage, config: RunnableConfig, backend_tool_names: List[str]):
    """
    Emit running state for tool calls.
    """
    if hasattr(response, "tool_calls") and response.tool_calls:
        for tool_call in response.tool_calls:
            if tool_call["name"] in backend_tool_names:
                await copilotkit_emit_state(
                    config,
                    {
                        "active_tool": {
                            "id": tool_call["id"],
                            "name": tool_call["name"],
                            "args": tool_call["args"],
                            "status": "running"
                        }
                    }
                )
