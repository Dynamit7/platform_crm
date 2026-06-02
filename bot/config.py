import os
import sys
from pathlib import Path
from typing import List, Union, Optional

from pydantic import SecretStr, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    Application settings for SmartEdu Bot.
    Handles environment variables and .env file loading with automatic coercion.
    """
    
    # --- Mandatory Settings ---
    BOT_TOKEN: SecretStr

    # --- Database Configuration ---
    # Defaulting to local SQLite for easier deployment and testing
    # For production: postgresql+asyncpg://user:pass@host:5432/dbname
    DATABASE_URL: str = "sqlite+aiosqlite:///./education_center.db"
    
    # --- Administrator Settings ---
    # Can be a single ID (int) or a list [123, 456] / 123, 456
    ADMIN_IDS: List[int] = []

    # --- Project Environment ---
    ENVIRONMENT: str = "production"
    TZ: str = "Asia/Tashkent"
    DEBUG: bool = False
    LOG_LEVEL: str = "INFO"
    
    # --- API Integration ---
    API_URL: str = "http://127.0.0.1:8000/api/bot"

    # --- ЮKassa Settings (Payments) ---
    YOOKASSA_SHOP_ID: str = ""
    YOOKASSA_SECRET_KEY: SecretStr = SecretStr("")
    PAYMENT_RETURN_URL: str = "https://tiluser.org"

    # --- Notification Settings ---
    CHANNEL_ID: Optional[str] = None
    NOTIFY_CHANNEL: bool = True

    # --- Pydantic Configuration ---
    model_config = SettingsConfigDict(
        # Robust pathing to .env (project root)
        env_file=os.path.join(Path(__file__).parent.parent, ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False
    )

    @field_validator("ADMIN_IDS", mode="before")
    @classmethod
    def validate_admin_ids(cls, v: Union[int, str, List[int]]) -> List[int]:
        """
        Coerces input into a list of integers. 
        Handles: "123", 123, [123, 456], "123, 456"
        """
        if isinstance(v, int):
            return [v]
        if isinstance(v, str):
            if v.startswith("[") and v.endswith("]"):
                import json
                try:
                    return json.loads(v)
                except json.JSONDecodeError:
                    pass
            # Handle comma-separated string "1, 2, 3"
            return [int(x.strip()) for x in v.split(",") if x.strip().isdigit()]
        return v

    @field_validator("DATABASE_URL")
    @classmethod
    def validate_database_url(cls, v: str) -> str:
        """Ensures SQLite uses the aiosqlite driver and absolute path."""
        if v.startswith("sqlite://") and not v.startswith("sqlite+aiosqlite://"):
            v = v.replace("sqlite://", "sqlite+aiosqlite://")
            
        if "sqlite" in v and "///./" in v and v.count("/") < 5:
            # Resolve to absolute path in web/ subdirectory
            project_root = (Path(__file__).parent.parent / 'web').absolute().as_posix()
            v = v.replace("///./", f"///{project_root}/")
        return v

    @property
    def is_development(self) -> bool:
        """Returns True if running in development mode."""
        return self.ENVIRONMENT.lower() == "development" or self.DEBUG


def load_config() -> Settings:
    """
    Safe entry point to load configuration with clear error messages.
    """
    try:
        return Settings()
    except Exception as e:
        print("\n" + "!" * 60)
        print(" CRITICAL ERROR: BOT CONFIGURATION FAILED")
        print("!" * 60)
        print(f"\nDetails:\n{e}\n")
        print("-" * 60)
        print("POSSIBLE FIXES:")
        print("1. Ensure BOT_TOKEN is set in your .env file.")
        print("2. Check ADMIN_IDS format (must be a number or a list like [1, 2]).")
        print("3. Check for syntax errors in your .env file.")
        print("!" * 60 + "\n")
        sys.exit(1)


# Singleton instance shared across the bot
config = load_config()
