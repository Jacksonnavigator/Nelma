from collections import defaultdict, deque
from datetime import timedelta

from fastapi import Request, status

from app.core.config import get_settings
from app.core.exceptions import AppException
from app.core.security import utc_now

_buckets: dict[str, deque[float]] = defaultdict(deque)


def rate_limit(scope: str, limit: int, window_seconds: int):
    async def dependency(request: Request) -> None:
        settings = get_settings()
        if not settings.rate_limit_enabled:
            return
        key = f"{scope}:{request.client.host if request.client else 'unknown'}"
        now = utc_now().timestamp()
        bucket = _buckets[key]
        cutoff = now - timedelta(seconds=window_seconds).total_seconds()
        while bucket and bucket[0] < cutoff:
            bucket.popleft()
        if len(bucket) >= limit:
            raise AppException(
                "RATE_LIMITED",
                "Too many attempts. Please wait a moment and try again.",
                status.HTTP_429_TOO_MANY_REQUESTS,
            )
        bucket.append(now)

    return dependency
