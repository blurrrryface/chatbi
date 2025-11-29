from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    OPENAI_API_KEY: str
    OPENAI_MODEL_NAME: str = "qwen3-235b-a22b-instruct-2507"
    OPENAI_BASE_URL: str = "https://www.DMXAPI.cn/v1"
    
    KB_API_URL: str = "http://127.0.0.1:18888/api/v1/chat"
    
    CHECKPOINTS_DB_PATH: str = "./db/checkpoints.db"
    
    MLFLOW_TRACKING_URI: str = "http://localhost:5000"
    SERVER_HOST: str = "0.0.0.0"
    SERVER_PORT: int = 8123

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

settings = Settings()
