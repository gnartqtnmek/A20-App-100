from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    app_name: str = "Brainio LMS"
    cors_origins: List[str] = ["http://localhost:3000"]

settings = Settings()
