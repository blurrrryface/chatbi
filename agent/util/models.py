from langchain_openai import ChatOpenAI
from settings import settings

llm = ChatOpenAI(
        model=settings.OPENAI_MODEL_NAME,
        base_url=settings.OPENAI_BASE_URL,
        api_key=settings.OPENAI_API_KEY,
    )