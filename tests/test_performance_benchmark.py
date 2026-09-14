import pytest

from testing_performace import (
    DEDICATED_GPU_HOURLY_USD,
    GPU_DURATION_RESERVED,
    Observation,
    estimate_cost,
    percentile,
    summarize,
)


def test_percentile_interpolates_small_samples():
    assert percentile([1.0, 2.0, 3.0, 4.0], 0.5) == 2.5
    assert percentile([1.0, 2.0, 3.0, 4.0], 0.95) == pytest.approx(3.85)


def test_summary_separates_modes_and_ignores_warmup():
    observations = [
        Observation(0, "warmup", "Remote", "one.jpg", 30.0, True),
        Observation(1, "measured", "Remote", "one.jpg", 2.0, True),
        Observation(2, "measured", "Remote", "two.jpg", 4.0, True),
        Observation(3, "measured", "Local", "one.jpg", 10.0, True),
        Observation(4, "measured", "Local", "two.jpg", 1.0, False, error="boom"),
    ]

    summary = summarize(observations)

    # The 30s warm-up must not pollute the Remote mean.
    assert summary["Remote"]["latency_seconds"]["mean"] == 3.0
    assert summary["Remote"]["success_rate"] == 1.0
    assert summary["Local"]["latency_seconds"]["mean"] == 10.0
    assert summary["Local"]["success_rate"] == 0.5


def test_cost_scales_with_users_and_charges_api_only_for_remote():
    per_mode = {
        "Remote": {
            "attempted": 1,
            "successful": 1,
            "success_rate": 1.0,
            "latency_seconds": {"min": 3.6, "mean": 3.6, "p95": 3.6, "max": 3.6},
            "backends_seen": [],
        },
        "Local": {
            "attempted": 1,
            "successful": 1,
            "success_rate": 1.0,
            "latency_seconds": {"min": 36.0, "mean": 36.0, "p95": 36.0, "max": 36.0},
            "backends_seen": [],
        },
    }

    estimate = estimate_cost(per_mode, users=1000, requests_per_user_per_month=10)
    remote, local = estimate["Remote"], estimate["Local"]

    assert remote["monthly_requests"] == 10_000
    assert remote["gpu_hours_per_month"] == pytest.approx(10.0)
    assert local["gpu_hours_per_month"] == pytest.approx(100.0)

    # Only the remote backend pays a per-request API charge.
    assert remote["remote_api_monthly_usd"] == pytest.approx(2.0)
    assert local["remote_api_monthly_usd"] == 0.0
    assert local["total_monthly_usd"] == pytest.approx(
        100.0 * DEDICATED_GPU_HOURLY_USD
    )

    # 10k requests reserving 120s each cannot fit the Pro ZeroGPU allowance.
    assert remote["zerogpu_seconds_reserved_per_month"] == (
        10_000 * GPU_DURATION_RESERVED
    )
    assert remote["fits_in_zerogpu_quota"] is False


def test_cost_reports_none_when_every_request_failed():
    per_mode = {
        "Remote": {
            "attempted": 2,
            "successful": 0,
            "success_rate": 0.0,
            "latency_seconds": None,
            "backends_seen": [],
        }
    }

    assert estimate_cost(per_mode, users=1000, requests_per_user_per_month=10) == {
        "Remote": None
    }
