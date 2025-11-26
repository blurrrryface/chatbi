from typing import Any, List
from typing_extensions import Literal
from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, BaseMessage
from langchain_core.runnables import RunnableConfig
from langchain.tools import tool
from langgraph.graph import StateGraph, END
from langgraph.types import Command
from langgraph.graph import MessagesState
from langgraph.prebuilt import ToolNode

from fastapi import FastAPI
from contextlib import asynccontextmanager
# from langgraph.checkpoint.postgres.aio import AsyncPostgresSaver
from langgraph.checkpoint.sqlite.aio import AsyncSqliteSaver
from langgraph.checkpoint.memory import MemorySaver
import sqlite3
import asyncio
import aiosqlite
from copilotkit import LangGraphAGUIAgent
from ag_ui_langgraph import add_langgraph_fastapi_endpoint

from dotenv import load_dotenv
import os
import json
import urllib.request
import urllib.error
# Load environment variables from .env file
load_dotenv()

class AgentState(MessagesState):

    proverbs: List[str] = []
    tools: List[Any]
    # your_custom_agent_state: str = ""

@tool
def get_weather(location: str):
    """
    Get the weather for a given location.
    """
    return f"The weather for {location} is 70 degrees."

@tool
def kb_chat(question: str, file_name: str = "") -> str:
    """
    检索知识库获得相关的知识.
    """
    url = os.getenv("KB_API_URL", "http://127.0.0.1:18888/api/v1/chat")
    payload = json.dumps({"question": question, "file_name": file_name}).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=payload,
        headers={"accept": "application/json", "Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=20) as res:
            return res.read().decode("utf-8")
    except urllib.error.HTTPError as e:
        try:
            body = e.read().decode("utf-8")
        except Exception:
            body = ""
        return json.dumps({"error": {"code": e.code, "reason": e.reason}, "body": body}, ensure_ascii=False)
    except urllib.error.URLError as e:
        return json.dumps({"error": {"reason": str(e)}}, ensure_ascii=False)


@tool
def db_query(sql: str) -> str:
    """
    执行数据库查询.
    """
    return f"执行SQL查询: {sql}"


backend_tools = [
    get_weather,
    kb_chat
]

# Extract tool names from backend_tools for comparison
backend_tool_names = [tool.name for tool in backend_tools]


async def chat_node(state: AgentState, config: RunnableConfig) -> Command[Literal["tool_node", "__end__"]]:

    # 1. Define the model
    model = ChatOpenAI(
        model="qwen3-235b-a22b-instruct-2507",
        base_url="https://www.DMXAPI.cn/v1",
        api_key=os.getenv("OPENAI_API_KEY"),
    )

    # 2. Bind the tools to the model
    model_with_tools = model.bind_tools(
        [
            *state.get("tools", []), # bind tools defined by ag-ui
            *backend_tools,
            # your_tool_here
        ],

        parallel_tool_calls=False,
    )

    # 3. Define the system message by which the chat model will be run
    system_message = SystemMessage(
        content=f"""You are a helpful assistant. The current proverbs are {state.get('proverbs', [])}.
        You can use the following tools to answer the user's question: {', '.join(backend_tool_names)}.
        当你设计数据查询相关的任务，你需要根据用户的问题，调用kb_chat工具来获取相关知识，才能做进一步的判断和回答。
        """
    )

    # 4. Run the model to generate a response
    response = await model_with_tools.ainvoke([
        system_message,
        *state["messages"],
    ], config)

    # only route to tool node if tool is not in the tools list
    if route_to_tool_node(response):
        print("routing to tool node")
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

def route_to_tool_node(response: BaseMessage):
    """
    Route to tool node if any tool call in the response matches a backend tool name.
    """
    tool_calls = getattr(response, "tool_calls", None)
    if not tool_calls:
        return False

    for tool_call in tool_calls:
        if tool_call.get("name") in backend_tool_names:
            return True
    return False

# Define the workflow graph
workflow = StateGraph(AgentState)
workflow.add_node("chat_node", chat_node)
workflow.add_node("tool_node", ToolNode(tools=backend_tools))
workflow.add_edge("tool_node", "chat_node")
workflow.set_entry_point("chat_node")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # 1. 建立异步数据库连接
    async with aiosqlite.connect("./db/checkpoints.db") as conn:
        # 2. 初始化异步 Checkpointer
        checkpointer = AsyncSqliteSaver(conn)
        
        # 3. 确保数据库表已创建 (AsyncSqliteSaver 需要这一步)
        await checkpointer.setup()
        
        # 4. 编译 Graph
        graph = workflow.compile(checkpointer=checkpointer)
        
        # 5. 初始化 Agent 并注册路由
        # 注意：我们在应用启动时动态添加路由
        agent = LangGraphAGUIAgent(
            name="simple_agent",
            description="Simple agent.",
            graph=graph, 
        )
        
        add_langgraph_fastapi_endpoint(
            app=app,
            agent=agent,
            path="/agents/simple_agent"
        )
        yield
        # 应用关闭时，连接会自动通过 async with 关闭
# --- 修改 3: 将 lifespan 传递给 FastAPI ---
app = FastAPI(lifespan=lifespan)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8123)
