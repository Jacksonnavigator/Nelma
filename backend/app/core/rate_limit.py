from collections import defaultdict, deque
from datetime import timedelta

from fastapi import Request, status

from app.core.config import get_settings
from app.core.exceptions import AppException
from app.core.security import utc_now

_buckets: dict[str, deque[float]] = defaultdict(deque)
# Drop idle buckets now and then so many one-off clients cannot grow memory without bound.
_PRUNE_EVERY = 1000
_MAX_WINDOW_SECONDS = 24 * 3600
_calls = 0


def _too_many() -> AppException:
    return AppException("RATE_LIMITED", "Too many attempts. Please wait a moment and try again.", status.HTTP_429_TOO_MANY_REQUESTS)


def _prune(now: float) -> None:
    cutoff = now - _MAX_WINDOW_SECONDS
    for key in [key for key, bucket in _buckets.items() if not bucket or bucket[-1] < cutoff]:
        del _buckets[key]


def hit(key: str, limit: int, window_seconds: int) -> None:
    """Count one attempt against key, raising 429 once limit attempts fall inside the window."""
    global _calls
    if not get_settings().rate_limit_enabled:
        return
    now = utc_now().timestamp()
    _calls += 1
    if _calls % _PRUNE_EVERY == 0:
        _prune(now)
    bucket = _buckets[key]
    cutoff = now - timedelta(seconds=window_seconds).total_seconds()
    while bucket and bucket[0] < cutoff:
        bucket.popleft()
    if len(bucket) >= limit:
        raise _too_many()
    bucket.append(now)


def is_limited(key: str, limit: int, window_seconds: int) -> bool:
    """Whether key has already used up its attempts, without counting a new one."""
    if not get_settings().rate_limit_enabled:
        return False
    cutoff = utc_now().timestamp() - window_seconds
    bucket = _buckets.get(key)
    return bool(bucket) and sum(1 for moment in bucket if moment >= cutoff) >= limit


def clear(key: str) -> None:
    _buckets.pop(key, None)


def rate_limit(scope: str, limit: int, window_seconds: int):
    async def dependency(request: Request) -> None:
        from app.api.dependencies import client_ip

        hit(f"{scope}:{client_ip(request) or 'unknown'}", limit, window_seconds)

    return dependency
