from functools import lru_cache
from pydantic_settings import BaseSettings,SettingsConfigDict


class Settings(BaseSettings):
    gemini_api_key: str 
    tavily_api_key: str

    mongodb_url: str
    mongodb_db:  str

    qdrant_url:        str
    qdrant_collection: str 

    jwt_secret:         str 
    jwt_algorithm:      str
    jwt_expire_minutes: int

    app_env:      str 
    cors_origins: str
    
    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore"
    )


    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",")]


@lru_cache()
def get_settings() -> Settings:
    return Settings()