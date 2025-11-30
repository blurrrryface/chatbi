from typing import Any, List
from typing_extensions import Literal

from langchain_core.messages import SystemMessage, BaseMessage, ToolMessage, AIMessage, HumanMessage
from langchain_core.runnables import RunnableConfig
from langchain_core.pydantic_v1 import BaseModel, Field

from langgraph.graph import StateGraph, END, START
from langgraph.types import Command
from langgraph.prebuilt import ToolNode

from copilotkit import CopilotKitState
from copilotkit.langgraph import copilotkit_emit_state,copilotkit_customize_config


from util.models import llm
from util.tools import get_weather, search_indicate, search_metadata, get_current_time, get_priviledge
from util.contract import handle_tool_completion, handle_tool_call_emission

class AgentState(CopilotKitState):
    tools: List[Any]
    tool_status: str
    active_tool: dict # { "name": str, "args": dict, "status": str, "result": str }
    intent: str
    generated_sql: str = ""
    time_list: List[str] = []
    indicator_list: List[str] = []
    priviledge: str = "" # 行权限
    widgets: List[dict] = []

backend_tools = [
    get_weather,
    search_indicate,
    search_metadata,
    get_current_time,
    get_priviledge
]

# Extract tool names from backend_tools for comparison
backend_tool_names = [tool.name for tool in backend_tools]

class IntentSchema(BaseModel):
    intent: Literal["general_agent", "data_query", "direct_answer"] = Field(
        description="The user's intent. 'general_agent' for general tasks, 'data_query' for data analysis/querying, 'direct_answer' for simple Q&A without tools."
    )

def get_executed_tools_in_turn(messages: List[BaseMessage]) -> List[str]:
    """Get the list of tools executed in the current turn (since last human message)."""
    executed = []
    for msg in reversed(messages):
        if isinstance(msg, HumanMessage):
            break
        if isinstance(msg, ToolMessage):
             executed.append(msg.name)
    return executed

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
    config = copilotkit_customize_config(
        config,
        emit_messages=False, # if you want to disable message streaming #
        emit_tool_calls=False # if you want to disable tool call streaming #
    )

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
        executed_tools = get_executed_tools_in_turn(state["messages"])
        
        if "search_indicate" not in executed_tools:
             current_tools = [search_indicate]
             system_content = """You are a report engineer processing a data query.
             Your goal is to generate a SQL query, but first you must understand the indicators requested.
             
             STEP 1: Identify Indicators.
             You MUST use the 'search_indicate' tool to look up the indicators mentioned in the user's request.
             
             Rules:
             1. Do NOT answer the user's question directly yet.
             2. Do NOT say you cannot answer.
             3. You MUST call the 'search_indicate' tool.
             """
        elif "search_metadata" not in executed_tools:
             current_tools = [search_indicate, search_metadata]
             system_content = """You are a report engineer processing a data query.
             You have identified the indicators. Now you must locate them in the database.
             
             STEP 2: Search Metadata.
             You MUST use the 'search_metadata' tool to find the table structures and fields corresponding to the indicators.
             
             Rules:
             1. Do NOT answer the user's question directly yet.
             2. Do NOT say you cannot answer.
             3. You MUST call the 'search_metadata' tool.
             """
        else:
            # For data queries, we focus on kb_chat as per instructions
            current_tools = [search_indicate, search_metadata, get_current_time, get_priviledge]
            system_content = f"""你是一个报表工程师,你的目标输出则是完整的sql语句。
            You can use the following tools to answer the user's question: {', '.join([t.name for t in current_tools])}.
            
            IMPORTANT: Before generating the final SQL, you MUST call the 'approve_query_parameters' tool to ask the user to confirm the indicators, time range, and row privilege.
            Only after you receive the result from 'approve_query_parameters' should you generate the final SQL.

            When calling 'approve_query_parameters', you MUST provide:
            - indicators: The list of indicators identified from the user query. Ideally, these should be present in the search results.
            - candidate_indicators: Extract the names of ALL indicators found in the 'search_indicate' tool output and pass them as a list.
            - start_time: The start date of the query range (YYYY-MM-DD) inferred from the user query.
            - end_time: The end date of the query range (YYYY-MM-DD) inferred from the user query.
            - row_privilege: The privilege string.

            Once you have the final SQL, you MUST use the 'show_sql' tool to display it on the dashboard. 
            Pass the generated SQL to the 'show_sql' tool.

            完整的sql语句应该包含下面的几个元素：
            1. 指标列表：根据用户的问题，提取出所有涉及的指标。
            2. 时间列表：根据用户的问题，提取出所有涉及的时间范围。
            3. 行权限：根据用户的权限，添加到sql语句中。
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
    # Combine tools: existing bound tools + backend tools + frontend tools (from copilotkit state)
    all_tools = [
        *state.get("tools", []), 
        *current_tools,
        *state.get("copilotkit", {}).get("actions", [])
    ]
    
    if all_tools:
        model_with_tools = model.bind_tools(
            all_tools,
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
    
    # We only route to the backend tool node if the tool is one that the backend can execute.
    # Frontend tools (like approve_query_parameters) should NOT be routed to tool_node.
    if route_to_tool_node(response, backend_tool_names):
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

