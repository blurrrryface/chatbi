from settings import settings
import json
import urllib.request
import urllib.error
from langchain.tools import tool

@tool
def get_weather(location: str):
    """
    Get the weather for a given location.
    """
    import time
    time.sleep(2)
    result = f"The weather for {location} is 70 degrees."
    return result


# 指标含义查询工具
@tool
def search_indicate(question: str):
    """
    指标含义查询工具
    参数:
        question: 指标名称
    """
    result = kb_chat(question=f"指标含义查询: {question}",file_name="知识库建模 - 指标定义表.csv",top_n=5)
    return result


@tool
def get_current_time() -> str:
    """
    获取当前时间
    """
    import time
    return time.strftime("%Y-%m-%d %H:%M:%S", time.localtime())

@tool
def get_priviledge() -> str:
    """
    获取当前用户权限
    """
    return "dept_name='共享技术部'"

@tool
def search_metadata(question: str):
    """
    元数据查询工具
    参数:
        question: 问题描述
    """
    result = kb_chat(question=f"元数据查询: {question}",file_name="知识库建模 - 表结构元信息表.csv",top_n=1)
    return result

def kb_chat(question: str, file_name: str = "",top_n: int = 5) -> str:
    """
    检索知识库获得相关的知识.
    参数:
        question: 问题描述
        file_name: 可选参数，指定知识库文件名称
        top_n: 可选参数，指定返回的前 N 个结果
    """
    url = settings.KB_API_URL
    payload = json.dumps({"question": question, "file_name": file_name, "top_n": top_n}).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=payload,
        headers={"accept": "application/json", "Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=20) as res:
            result = res.read().decode("utf-8")
            return result
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
    result = f"执行SQL查询: {sql}"
    return result