import logging
import sys
from pathlib import Path

def setup_logging():
    # Create logs directory if it doesn't exist
    log_dir = Path("logs")
    log_dir.mkdir(exist_ok=True)
    
    # Define formatter
    formatter = logging.Formatter(
        "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    )
    
    # File Handler
    file_handler = logging.FileHandler(log_dir / "hyperfocus.log")
    file_handler.setFormatter(formatter)
    
    # Stream Handler (Console)
    stream_handler = logging.StreamHandler(sys.stdout)
    stream_handler.setFormatter(formatter)
    
    # Root Logger
    logger = logging.getLogger()
    logger.setLevel(logging.INFO)
    logger.addHandler(file_handler)
    logger.addHandler(stream_handler)
    
    # Uvicorn access log
    logging.getLogger("uvicorn.access").handlers = [stream_handler, file_handler]
