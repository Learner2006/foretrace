import time
import logging
from enum import Enum
from typing import Callable, Any, Optional

logger = logging.getLogger("foretrace")

class CircuitState(Enum):
    CLOSED = "CLOSED"
    OPEN = "OPEN"
    HALF_OPEN = "HALF_OPEN"

class CircuitBreakerOpenException(Exception):
    pass

class CircuitBreaker:
    def __init__(self, name: str, failure_threshold: int = 3, recovery_time: float = 30.0, success_threshold: int = 2):
        self.name = name
        self.failure_threshold = failure_threshold
        self.recovery_time = recovery_time
        self.success_threshold = success_threshold
        
        self.state = CircuitState.CLOSED
        self.failure_count = 0
        self.success_count = 0
        self.last_failure_time = 0.0

    def record_success(self):
        if self.state == CircuitState.HALF_OPEN:
            self.success_count += 1
            logger.info(f"Circuit Breaker [{self.name}] HALF-OPEN success count: {self.success_count}/{self.success_threshold}")
            if self.success_count >= self.success_threshold:
                self.state = CircuitState.CLOSED
                self.failure_count = 0
                self.success_count = 0
                logger.info(f"Circuit Breaker [{self.name}] transition to CLOSED (recovered).")
        elif self.state == CircuitState.CLOSED:
            self.failure_count = 0

    def record_failure(self):
        self.failure_count += 1
        self.last_failure_time = time.time()
        logger.warning(f"Circuit Breaker [{self.name}] failure recorded. Count: {self.failure_count}/{self.failure_threshold}")
        if self.state in (CircuitState.CLOSED, CircuitState.HALF_OPEN):
            if self.failure_count >= self.failure_threshold:
                self.state = CircuitState.OPEN
                logger.error(f"Circuit Breaker [{self.name}] opened! Threshold of {self.failure_threshold} reached. Blocking requests for {self.recovery_time}s.")

    def check_state(self):
        if self.state == CircuitState.OPEN:
            if time.time() - self.last_failure_time > self.recovery_time:
                self.state = CircuitState.HALF_OPEN
                self.success_count = 0
                logger.info(f"Circuit Breaker [{self.name}] entering HALF-OPEN state. Testing recovery...")
            else:
                raise CircuitBreakerOpenException(f"Service {self.name} is temporarily unavailable due to open circuit breaker.")

    def __call__(self, func: Callable):
        async def wrapper(*args, **kwargs):
            self.check_state()
            try:
                res = await func(*args, **kwargs)
                self.record_success()
                return res
            except Exception as e:
                self.record_failure()
                raise e
        return wrapper
