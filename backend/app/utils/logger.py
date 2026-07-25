import logging
import sys
import json
from datetime import datetime
from contextvars import ContextVar

request_id_var: ContextVar[str] = ContextVar("request_id", default="")
correlation_id_var: ContextVar[str] = ContextVar("correlation_id", default="")

class JSONFormatter(logging.Formatter):
    def format(self, record):
        log_obj = {
            "timestamp": datetime.fromtimestamp(record.created).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }
        
        req_id = request_id_var.get()
        if req_id:
            log_obj["request_id"] = req_id
            
        corr_id = correlation_id_var.get()
        if corr_id:
            log_obj["correlation_id"] = corr_id

        if hasattr(record, "request_id"):
            log_obj["request_id"] = record.request_id
        if hasattr(record, "metadata"):
            log_obj["metadata"] = record.metadata
        if record.exc_info:
            log_obj["exception"] = self.formatException(record.exc_info)
        return json.dumps(log_obj)

def setup_logger():
    logger = logging.getLogger("foretrace")
    logger.setLevel(logging.INFO)
    
    if not logger.handlers:
        handler = logging.StreamHandler(sys.stdout)
        handler.setFormatter(JSONFormatter())
        logger.addHandler(handler)
        
    return logger

logger = setup_logger()
