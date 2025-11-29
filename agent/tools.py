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

@tool
def kb_chat(question: str, file_name: str = "") -> str:
    """
    检索知识库获得相关的知识.
    """
    url = settings.KB_API_URL
    payload = json.dumps({"question": question, "file_name": file_name}).encode("utf-8")
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