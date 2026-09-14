"""Benchmark HazardLens and print napkin-math performance and cost figures.

Run it:

    python testing_performace.py

Everything configurable lives in the SETTINGS block below. This calls the live
Hugging Face Space, so it costs ZeroGPU quota and remote inference credits --
a default run is 1 warm-up plus IMAGE_COUNT x len(MODES) measured calls.
"""

from __future__ import annotations

import json
import os
import statistics
import sys
import tempfile
import time
from dataclasses import asdict, dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Sequence

from dotenv import load_dotenv
from gradio_client import Client, handle_file


load_dotenv()

# =====================================================================
# SETTINGS -- edit these, then run the file.
# =====================================================================

SPACE_ID = "shyampatadia22/hazardlens-ai"
MODES = ["Remote", "Local"]          # backends to compare
IMAGE_COUNT = 3                      # test images per mode
GOAL = "Find anything blocking the emergency exit."
THRESHOLD = 0.05

# Traffic assumption for the cost model.
USERS = 1000
REQUESTS_PER_USER_PER_MONTH = 10

# Billing assumptions -- ESTIMATES. Verify at https://huggingface.co/pricing
# before quoting them; every dollar figure below comes from these five numbers.
HF_PRO_MONTHLY_USD = 9.00
ZEROGPU_SECONDS_PER_DAY = 25 * 60    # Pro allowance, roughly 25 min/day
DEDICATED_GPU_HOURLY_USD = 0.40
DEDICATED_GPU_NAME = "Nvidia T4 small"
REMOTE_USD_PER_REQUEST = 0.0002      # GLM-5.3-Flash bills per token, not per call

# app.py declares @spaces.GPU(duration=120). ZeroGPU reserves that whole
# duration per call regardless of how long the call runs, so this -- not the
# measured latency -- is what actually drains the daily allowance.
GPU_DURATION_RESERVED = 120

SAVE_REPORT_TO = "benchmark_report.json"   # set to None to skip the JSON file

# =====================================================================


@dataclass
class Observation:
    request_number: int
    phase: str
    mode: str
    image: str
    latency_seconds: float
    success: bool
    backend: str | None = None
    error: str | None = None


def percentile(values: Sequence[float], quantile: float) -> float:
    """Return a linearly interpolated percentile without extra dependencies."""
    if not values:
        raise ValueError("Cannot calculate a percentile of an empty sequence.")
    if not 0 <= quantile <= 1:
        raise ValueError("quantile must be between 0 and 1.")

    ordered = sorted(values)
    position = (len(ordered) - 1) * quantile
    lower, upper = int(position), min(int(position) + 1, len(ordered) - 1)
    if lower == upper:
        return ordered[lower]
    return ordered[lower] + (ordered[upper] - ordered[lower]) * (position - lower)


def run_request(
    client: Client,
    image_path: Path,
    request_number: int,
    phase: str,
    mode: str,
) -> Observation:
    """Run one end-to-end request, recording failures rather than raising."""
    started = time.perf_counter()
    try:
        result = client.predict(
            image=handle_file(str(image_path)),
            goal=GOAL,
            threshold=THRESHOLD,
            mode=mode,
            api_name="/analyze_image",
        )
        latency = time.perf_counter() - started
        is_sequence = isinstance(result, (list, tuple))
        return Observation(
            request_number=request_number,
            phase=phase,
            mode=mode,
            image=image_path.name,
            latency_seconds=latency,
            success=True,
            backend=str(result[3]) if is_sequence and len(result) > 3 else None,
        )
    except Exception as error:  # A benchmark records failures and continues.
        return Observation(
            request_number=request_number,
            phase=phase,
            mode=mode,
            image=image_path.name,
            latency_seconds=time.perf_counter() - started,
            success=False,
            error=f"{type(error).__name__}: {error}",
        )


def summarize(observations: Sequence[Observation]) -> dict[str, Any]:
    """Summarize measured (non-warm-up) latency and reliability per mode."""
    measured = [item for item in observations if item.phase == "measured"]
    per_mode: dict[str, Any] = {}

    for mode in dict.fromkeys(item.mode for item in measured):
        rows = [item for item in measured if item.mode == mode]
        good = [item for item in rows if item.success]
        latencies = [item.latency_seconds for item in good]
        per_mode[mode] = {
            "attempted": len(rows),
            "successful": len(good),
            "success_rate": len(good) / len(rows) if rows else 0.0,
            "latency_seconds": (
                {
                    "min": min(latencies),
                    "mean": statistics.fmean(latencies),
                    "p95": percentile(latencies, 0.95),
                    "max": max(latencies),
                }
                if latencies
                else None
            ),
            "backends_seen": sorted({item.backend or "unknown" for item in good}),
        }

    return per_mode


def estimate_cost(
    per_mode: dict[str, Any],
    users: int = USERS,
    requests_per_user_per_month: int = REQUESTS_PER_USER_PER_MONTH,
) -> dict[str, Any]:
    """Turn measured latency into monthly capacity and cost for N users."""
    monthly_requests = users * requests_per_user_per_month
    quota_seconds_per_month = ZEROGPU_SECONDS_PER_DAY * 30
    estimates: dict[str, Any] = {}

    for mode, stats in per_mode.items():
        latency = stats["latency_seconds"]
        if not latency:
            estimates[mode] = None
            continue

        # ZeroGPU bills the reserved duration, not the observed latency.
        reserved_seconds = monthly_requests * GPU_DURATION_RESERVED
        gpu_hours = monthly_requests * latency["mean"] / 3600
        api_cost = (
            0.0 if mode == "Local" else monthly_requests * REMOTE_USD_PER_REQUEST
        )
        dedicated_cost = gpu_hours * DEDICATED_GPU_HOURLY_USD

        estimates[mode] = {
            "monthly_requests": monthly_requests,
            "mean_latency_seconds": latency["mean"],
            "zerogpu_seconds_reserved_per_month": reserved_seconds,
            "zerogpu_monthly_quota_seconds": quota_seconds_per_month,
            "fits_in_zerogpu_quota": reserved_seconds <= quota_seconds_per_month,
            "gpu_hours_per_month": gpu_hours,
            "dedicated_gpu_monthly_usd": dedicated_cost,
            "remote_api_monthly_usd": api_cost,
            "total_monthly_usd": dedicated_cost + api_cost,
            "cost_per_request_usd": (
                (dedicated_cost + api_cost) / monthly_requests
                if monthly_requests
                else 0.0
            ),
        }

    return estimates


def print_report(
    per_mode: dict[str, Any],
    estimates: dict[str, Any],
    observations: Sequence[Observation],
) -> None:
    """Print both assignment sections as plain terminal text."""
    print("\n" + "=" * 62)
    print("(d) PERFORMANCE: remote vs local")
    print("=" * 62)
    print(f"  {'Mode':<8} {'OK':<7} {'mean':>8} {'p95':>8} {'max':>8}")
    for mode, stats in per_mode.items():
        latency = stats["latency_seconds"]
        ok = f"{stats['successful']}/{stats['attempted']}"
        if latency:
            print(
                f"  {mode:<8} {ok:<7} {latency['mean']:>7.1f}s "
                f"{latency['p95']:>7.1f}s {latency['max']:>7.1f}s"
            )
        else:
            print(f"  {mode:<8} {ok:<7} {'all requests failed':>26}")

    for mode, stats in per_mode.items():
        if stats["backends_seen"]:
            print(f"  {mode} served by: {', '.join(stats['backends_seen'])}")

    print("\n" + "=" * 62)
    print(f"(e) COST: {USERS:,} users")
    print("=" * 62)
    for mode, estimate in estimates.items():
        if not estimate:
            print(f"  {mode}: no successful measurements")
            continue
        print(f"\n  {mode} mode -- {estimate['monthly_requests']:,} requests/month")
        print(
            f"    GPU time:      {estimate['gpu_hours_per_month']:,.0f} h/month "
            f"at {estimate['mean_latency_seconds']:.1f}s per request"
        )
        fits = "fits" if estimate["fits_in_zerogpu_quota"] else "EXCEEDS"
        print(
            f"    ZeroGPU quota: {fits} "
            f"({estimate['zerogpu_seconds_reserved_per_month']:,.0f}s reserved "
            f"vs {estimate['zerogpu_monthly_quota_seconds']:,.0f}s on Pro)"
        )
        print(
            f"    Dedicated GPU: ${estimate['dedicated_gpu_monthly_usd']:,.2f}/month "
            f"({DEDICATED_GPU_NAME})"
        )
        if estimate["remote_api_monthly_usd"]:
            print(
                f"    Remote API:    ${estimate['remote_api_monthly_usd']:,.2f}/month"
            )
        print(
            f"    TOTAL:         ${estimate['total_monthly_usd']:,.2f}/month "
            f"(${estimate['cost_per_request_usd']:.4f}/request)"
        )

    failures = [item for item in observations if not item.success]
    if failures:
        counts: dict[str, int] = {}
        for item in failures:
            message = item.error or "unknown error"
            counts[message] = counts.get(message, 0) + 1
        print("\n  Failures:")
        for message, count in counts.items():
            print(f"    {count}x {message[:100]}")

    print(
        f"\n  Assumptions (verify at https://huggingface.co/pricing): "
        f"HF Pro ${HF_PRO_MONTHLY_USD}/mo, ZeroGPU {ZEROGPU_SECONDS_PER_DAY}s/day, "
        f"GPU ${DEDICATED_GPU_HOURLY_USD}/h, remote ${REMOTE_USD_PER_REQUEST}/request."
    )
    print(
        "  Latency is measured client-side and includes queueing and network "
        "time, so it overstates pure GPU time."
    )


def main() -> int:
    image_dir = Path(__file__).resolve().parent / "test_images"
    images = sorted(
        path
        for path in image_dir.iterdir()
        if path.suffix.lower() in {".jpg", ".jpeg", ".png", ".webp"}
    )[:IMAGE_COUNT]
    if not images:
        print(f"No test images found in {image_dir}", file=sys.stderr)
        return 1

    token = os.getenv("HF_TOKEN")
    if not token:
        print(
            "Warning: HF_TOKEN not set. Connecting anonymously uses the small "
            "shared ZeroGPU quota and will usually fail.",
            file=sys.stderr,
        )

    total = len(images) * len(MODES)
    print(f"Connecting to {SPACE_ID} ...")
    print(f"Plan: 1 warm-up + {total} measured calls ({len(MODES)} modes).")

    observations: list[Observation] = []
    with tempfile.TemporaryDirectory(prefix="hazardlens-benchmark-") as download_dir:
        client = Client(
            SPACE_ID, token=token, verbose=False, download_files=download_dir
        )

        print(f"Warm-up ({MODES[0]}) to absorb cold start ...")
        observations.append(run_request(client, images[0], 0, "warmup", MODES[0]))

        number = 0
        for mode in MODES:
            for image_path in images:
                number += 1
                observation = run_request(client, image_path, number, "measured", mode)
                observations.append(observation)
                outcome = "ok" if observation.success else "FAILED"
                print(
                    f"  {number}/{total} {mode:<7} {observation.image}: "
                    f"{observation.latency_seconds:.1f}s {outcome}"
                )

    per_mode = summarize(observations)
    estimates = estimate_cost(per_mode)
    print_report(per_mode, estimates, observations)

    if SAVE_REPORT_TO:
        report = {
            "generated_at_utc": datetime.now(timezone.utc).isoformat(),
            "settings": {
                "space_id": SPACE_ID,
                "modes": MODES,
                "images": len(images),
                "users": USERS,
                "requests_per_user_per_month": REQUESTS_PER_USER_PER_MONTH,
                "gpu_duration_reserved_seconds": GPU_DURATION_RESERVED,
            },
            "performance": per_mode,
            "cost": estimates,
            "observations": [asdict(item) for item in observations],
        }
        path = Path(SAVE_REPORT_TO)
        path.write_text(json.dumps(report, indent=2), encoding="utf-8")
        print(f"\n  Full report written to {path.resolve()}")

    return 0 if any(stats["successful"] for stats in per_mode.values()) else 1


if __name__ == "__main__":
    raise SystemExit(main())
