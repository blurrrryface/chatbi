
from typing import Any, List
from typing_extensions import Literal
from fastapi import FastAPI
from contextlib import asynccontextmanager
from copilotkit import LangGraphAGUIAgent
from ag_ui_langgraph import add_langgraph_fastapi_endpoint
from langgraph.checkpoint.sqlite.aio import AsyncSqliteSaver
import aiosqlite
from agent import workflow
import uvicorn
import warnings

warnings.filterwarnings("ignore", module=r"pydantic\._internal\._generate_schema")


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
    uvicorn.run(app, host="0.0.0.0", port=8123)
