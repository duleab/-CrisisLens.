import logging
import sys
from pathlib import Path
from ..core.config import settings

def setup_logging():
    """Setup application logging configuration"""
    
    # Create logs directory
    logs_dir = Path("logs")
    logs_dir.mkdir(exist_ok=True)
    
    # Configure logging format
    log_format = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    
    # Reconfigure sys.stdout for UTF-8 and replace errors on Windows
    if hasattr(sys.stdout, 'reconfigure'):
        try:
            sys.stdout.reconfigure(encoding='utf-8', errors='replace')
        except Exception:
            pass

    # Root logger configuration
    logging.basicConfig(
        level=getattr(logging, settings.LOG_LEVEL.upper()),
        format=log_format,
        handlers=[
            # Console handler
            logging.StreamHandler(sys.stdout),
            # File handler
            logging.FileHandler(logs_dir / "crisislens.log", mode="a", encoding="utf-8", errors="replace")
        ]
    )
    
    # Set specific logger levels
    logging.getLogger("uvicorn").setLevel(logging.INFO)
    logging.getLogger("fastapi").setLevel(logging.INFO)
    logging.getLogger("databases").setLevel(logging.WARNING)
    logging.getLogger("transformers").setLevel(logging.WARNING)
    logging.getLogger("torch").setLevel(logging.WARNING)
    
    # Application loggers
    logging.getLogger("app").setLevel(logging.DEBUG if settings.DEBUG else logging.INFO)
    
    logger = logging.getLogger(__name__)
    logger.info(f"[INFO] Logging initialized - Level: {settings.LOG_LEVEL}")
    
    return logger