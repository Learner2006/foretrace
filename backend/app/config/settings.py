from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import model_validator
from typing import Optional

class Settings(BaseSettings):
    groq_api_key: str
    frontend_url: str = "http://localhost:5173"
    api_key: str = "demo_token"
    admin_api_key: str = "demo_admin_token"
    env: str = "dev"  # dev, staging, prod
    redis_url: Optional[str] = None
    disable_demo_data: bool = False
    sentry_dsn: Optional[str] = None

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    @model_validator(mode='after')
    def validate_prod_secrets(self) -> 'Settings':
        if self.env == "prod":
            if self.api_key == "demo_token":
                raise ValueError("In production, API_KEY must be set to a secure value and cannot be 'demo_token'.")
            if self.admin_api_key == "demo_admin_token":
                raise ValueError("In production, ADMIN_API_KEY must be set to a secure value and cannot be 'demo_admin_token'.")
        return self

settings = Settings()

