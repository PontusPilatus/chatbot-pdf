import structlog
import logging
import sys
from datetime import datetime
from pathlib import Path

# Create logs directory if it doesn't exist
LOGS_DIR = Path("logs")
LOGS_DIR.mkdir(exist_ok=True)

# Configure standard logging
logging.basicConfig(
    level=logging.INFO,
    format="%(message)s",
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler(f"logs/app_{datetime.now().strftime('%Y%m%d')}.log")
    ]
)

# Configure structlog
structlog.configure(
    processors=[
        structlog.contextvars.merge_contextvars,
        structlog.processors.add_log_level,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.JSONRenderer()
    ],
    wrapper_class=structlog.make_filtering_bound_logger(logging.INFO),
    context_class=dict,
    logger_factory=structlog.PrintLoggerFactory(),
    cache_logger_on_first_use=True,
)

# Create logger instance
logger = structlog.get_logger()

def log_error(error: Exception, context: dict = None):
    """Log an error with additional context."""
    error_context = {
        "error_type": type(error).__name__,
        "error_message": str(error),
        "timestamp": datetime.now().isoformat()
    }
    if context:
        error_context.update(context)
    logger.error("error_occurred", **error_context)

def log_info(message: str, context: dict = None):
    """Log an info message with additional context."""
    info_context = {
        "timestamp": datetime.now().isoformat()
    }
    if context:
        info_context.update(context)
    logger.info(message, **info_context)

def log_warning(message: str, context: dict = None):
    """Log a warning message with additional context."""
    warning_context = {
        "timestamp": datetime.now().isoformat()
    }
    if context:
        warning_context.update(context)
    logger.warning(message, **warning_context) 