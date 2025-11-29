from typing import Any, List
from typing_extensions import Literal

from langchain_core.messages import SystemMessage, BaseMessage, ToolMessage, AIMessage
from langchain_core.runnables import RunnableConfig
from langchain_core.pydantic_v1 import BaseModel, Field

from langgraph.graph import StateGraph, END, START
from langgraph.types import Command
from langgraph.prebuilt import ToolNode

from copilotkit import CopilotKitState
from copilotkit.langgraph import copilotkit_emit_state

from models import llm
from tools import get_weather, kb_chat
from utils import handle_tool_completion, handle_tool_call_emission

class AgentState(CopilotKitState):
    tools: List[Any]
    tool_status: str
    active_tool: dict # { "name": str, "args": dict, "status": str, "result": str }
    intent: str

backend_tools = [
    get_weather,
    kb_chat
]

# Extract tool names from backend_tools for comparison
backend_tool_names = [tool.name for tool in backend_tools]

class IntentSchema(BaseModel):
    intent: Literal["general_agent", "data_query", "direct_answer"] = Field(
        description="The user's intent. 'general_agent' for general tasks, 'data_query' for data analysis/querying, 'direct_answer' for simple Q&A without tools."
    )

async def intent_node(state: AgentState, config: RunnableConfig):
    system_msg = SystemMessage(content="""
    You are an intent classifier. Analyze the user's latest request and categorize it into one of the following:
    - general_agent: For general questions that might need tools like weather or general knowledge.
    - data_query: For questions specifically about data, numbers, statistics, or querying the knowledge base for data.
    - direct_answer: For greetings, small talk, or questions that can be answered directly from context without external tools.
    """)
    
    messages = [system_msg] + state["messages"]
    
    classifier = llm.with_structured_output(IntentSchema)
    result = await classifier.ainvoke(messages, config)
    
    return {"intent": result.intent}

async def chat_node(state: AgentState, config: RunnableConfig) -> Command[Literal["tool_node", "__end__"]]:

    # Handle tool completion state
    await handle_tool_completion(state, config)

    intent = state.get("intent", "general_agent")
    
    # Determine tools and system message based on intent
    current_tools = []
    system_content = ""

    if intent == "direct_answer":
        current_tools = []
        system_content = "You are a helpful assistant. Answer the user's question directly based on the context."
    elif intent == "data_query":
        # For data queries, we focus on kb_chat as per instructions
        current_tools = [kb_chat]
        system_content = f"""You are a data analysis assistant. 
        You can use the following tools to answer the user's question: kb_chat.
        当你用户的问题可能是和数据查询相关，根据用户的问题，调用kb_chat工具来获取相关知识进一步的判断和回答。
        你不能在不调用工具的前提下就拒绝回答用户的问题。
        """
    else: # general_agent
        current_tools = backend_tools
        system_content = f"""You are a helpful assistant.
        You can use the following tools to answer the user's question: {', '.join([t.name for t in current_tools])}.
        """

    # 1. Define the model
    model = llm

    # 2. Bind the tools to the model
    model_with_tools = model
    if current_tools or state.get("tools"):
        model_with_tools = model.bind_tools(
            [
                *state.get("tools", []), # bind tools defined by ag-ui
                *current_tools,
            ],
            parallel_tool_calls=False,
        )

    # 3. Define the system message
    system_message = SystemMessage(content=system_content)

    # 4. Run the model to generate a response
    response = await model_with_tools.ainvoke([
        system_message,
        *state["messages"],
    ], config)

    # only route to tool node if tool is not in the tools list
    # We use backend_tool_names for global check, or should we check against current_tools?
    # The route_to_tool_node function logic should match the tools bound.
    # However, ToolNode has ALL backend_tools.
    
    allowed_tool_names = [t.name for t in current_tools]
    
    if route_to_tool_node(response, allowed_tool_names):
        print("routing to tool node")
        
        # Emit running state
        await handle_tool_call_emission(response, config, backend_tool_names)
        
        return Command(
            goto="tool_node",
            update={
                "messages": [response],
            }
        )

    # 5. We've handled all tool calls, so we can end the graph.
    return Command(
        goto=END,
        update={
            "messages": [response],
        }
    )

def route_to_tool_node(response: BaseMessage, allowed_tool_names: List[str]):
    """
    Route to tool node if any tool call in the response matches an allowed backend tool name.
    """
    tool_calls = getattr(response, "tool_calls", None)
    if not tool_calls:
        return False

    for tool_call in tool_calls:
        if tool_call.get("name") in allowed_tool_names:
            return True
    return False

# Define the workflow graph
workflow = StateGraph(AgentState)
workflow.add_node("intent_node", intent_node)
workflow.add_node("chat_node", chat_node)
workflow.add_node("tool_node", ToolNode(tools=backend_tools))

workflow.add_edge(START, "intent_node")
workflow.add_edge("intent_node", "chat_node")
workflow.add_edge("tool_node", "chat_node")

