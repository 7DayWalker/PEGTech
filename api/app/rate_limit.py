"""
Minimal in-process rate limiter for public, unauthenticated endpoints.

This exists specifically for the public AI CSR chat endpoint
(docs/ai-integration-plan.md, section 1: "a per-session/per-IP rate limit
specifically on the public, unauthenticated CSR endpoint — the one
surface a bad actor could hit to run up your bill"). It's intentionally
a plain in-memory sliding window, not Redis-backed: this API runs as a
single uvicorn process on a single Railway replica (see api/Dockerfile),
so a per-process dict is sufficient and adds zero infrastructure. If this
service is ever scaled to multiple replicas, this stops being accurate
per-client (each replica tracks its own counts) and should move to a
shared store — noted here so that migration isn't a surprise later.
"""
from __future__ import annotations

import time
from collections import defaultdict
from threading import Lock

_lock = Lock()
_hits: dict[str, list[float]] = defaultdict(list)
_last_sweep = 0.0
_SWEEP_INTERVAL_SECONDS = 60.0


def _sweep(now: float, max_window_seconds: float) -> None:
    """Drops any key whose every recorded hit has aged out, so the dict
    doesn't grow unbounded over the life of the process. Cheap and only
    runs periodically, not on every call."""
    global _last_sweep
    if now - _last_sweep < _SWEEP_INTERVAL_SECONDS:
        return
    _last_sweep = now
    cutoff = now - max_window_seconds
    stale_keys = [k for k, times in _hits.items() if not times or times[-1] < cutoff]
    for k in stale_keys:
        _hits.pop(k, None)


def check_rate_limit(key: str, max_requests: int, window_seconds: int) -> tuple[bool, int]:
    """Records one hit for `key` and returns (allowed, retry_after_seconds).

    `allowed` is False once `key` has made `max_requests` hits inside the
    trailing `window_seconds`. `retry_after_seconds` is how long until the
    oldest hit in the window ages out (0 when allowed)."""
    now = time.monotonic()
    with _lock:
        _sweep(now, window_seconds)
        times = _hits[key]
        cutoff = now - window_seconds
        while times and times[0] < cutoff:
            times.pop(0)
        if len(times) >= max_requests:
            retry_after = max(1, int(window_seconds - (now - times[0])))
            return False, retry_after
        times.append(now)
        return True, 0
