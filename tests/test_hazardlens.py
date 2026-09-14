from PIL import Image

import app
import helpers


def test_parse_labels_cleans_duplicates_and_none():
    assert helpers.parse_labels("Box, broom\nbox, 'Cable'.") == [
        "box",
        "broom",
        "cable",
    ]
    assert helpers.parse_labels("NONE.") == []


def test_auto_mode_uses_local_model_when_remote_fails(monkeypatch):
    image = Image.new("RGB", (20, 20))

    def remote_failure(image, goal):
        raise RuntimeError("provider unavailable")

    monkeypatch.setattr(helpers, "expand_goal_remote", remote_failure)
    monkeypatch.setattr(
        helpers,
        "expand_goal_local",
        lambda image, goal: ["box", "cart"],
    )

    labels, backend, message = helpers.expand_goal(image, "find blockers", "Auto")

    assert labels == ["box", "cart"]
    assert backend == "Local vision model"
    assert "provider unavailable" in message


def test_analyze_image_returns_detection_results(monkeypatch):
    image = Image.new("RGB", (20, 20), "white")
    detections = [
        {
            "label": "box",
            "score": 0.91,
            "box": {"xmin": 1, "ymin": 1, "xmax": 8, "ymax": 8},
        },
        {
            "label": "cart",
            "score": 0.82,
            "box": {"xmin": 10, "ymin": 10, "xmax": 18, "ymax": 18},
        },
    ]
    received = {}

    def fake_expand(image, goal, mode):
        received["goal"] = goal
        received["mode"] = mode
        return ["box", "cart"], "Remote vision model", ""

    def fake_detect(image, labels, threshold):
        received["labels"] = labels
        received["threshold"] = threshold
        return detections

    monkeypatch.setattr(app, "expand_goal", fake_expand)
    monkeypatch.setattr(app, "detect_objects", fake_detect)

    result = app.analyze_image(image, "  find exit blockers  ", 0.05, "Auto")

    assert result[0].getpixel((1, 1)) == (255, 0, 0)
    assert result[1:] == (
        "box, cart",
        "box: 1, cart: 1",
        "Remote vision model",
        "Analysis completed successfully.",
    )
    assert received == {
        "goal": "find exit blockers",
        "mode": "Auto",
        "labels": ["box", "cart"],
        "threshold": 0.05,
    }
