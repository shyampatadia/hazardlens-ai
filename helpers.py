import base64
import os
from io import BytesIO

from dotenv import load_dotenv
from huggingface_hub import InferenceClient
from PIL import Image, ImageDraw

from config import *


load_dotenv()

_remote_client = None
_local_generator = None
_detector = None


def parse_labels(response: str) -> list[str]:
    """Turn the LLM's comma-separated response into unique labels."""
    if not response:
        return []

    if response.strip().lower().strip(".") == "none":
        return []

    labels = []
    for item in response.replace("\n", ",").split(","):
        label = item.strip().strip("[]\"' .").lower()
        if label and label not in labels:
            labels.append(label)

    return labels


def get_remote_client():
    """Create the hosted-LLM client once and reuse it."""
    global _remote_client

    token = os.getenv("HF_TOKEN")
    if not token:
        raise RuntimeError("HF_TOKEN is missing from the environment.")

    if _remote_client is None:
        _remote_client = InferenceClient(
            model=REMOTE_MODEL,
            token=token,
            timeout=30,
        )

    return _remote_client


def image_to_data_url(image: Image.Image) -> str:
    """Convert an image for the remote vision model."""
    buffer = BytesIO()
    image.convert("RGB").save(buffer, format="JPEG")
    encoded = base64.b64encode(buffer.getvalue()).decode("utf-8")
    return f"data:image/jpeg;base64,{encoded}"


def expand_goal_remote(image: Image.Image, goal: str) -> list[str]:
    """Ask the hosted vision model which matching objects are visible."""
    response = get_remote_client().chat_completion(
        messages=[
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": f"{LABEL_PROMPT}\nInspection request: {goal}"},
                    {"type": "image_url", "image_url": {"url": image_to_data_url(image)}},
                ],
            }
        ],
        max_tokens=100,
        temperature=0.0,
    )
    text = response.choices[0].message.content or ""
    return parse_labels(text)


def get_local_generator():
    """Load the fallback LLM once, only when it is needed."""
    global _local_generator

    if _local_generator is None:
        import torch
        from transformers import pipeline

        device = 0 if torch.cuda.is_available() else -1
        _local_generator = pipeline(
            "image-text-to-text",
            model=LOCAL_MODEL,
            device=device,
        )

    return _local_generator


def expand_goal_local(image: Image.Image, goal: str) -> list[str]:
    """Ask the local vision model which matching objects are visible."""
    messages = [
        {
            "role": "user",
            "content": [
                {"type": "image", "image": image.convert("RGB")},
                {"type": "text", "text": f"{LABEL_PROMPT}\nInspection request: {goal}"},
            ],
        }
    ]
    result = get_local_generator()(
        text=messages,
        max_new_tokens=100,
        do_sample=False,
        return_full_text=False,
    )

    return parse_labels(str(result[0]["generated_text"]))


def expand_goal(
    image: Image.Image,
    goal: str,
    mode: str = "Auto",
) -> tuple[list[str], str, str]:
    """Choose the LLM backend and automatically fall back when needed."""
    selected_mode = mode.strip().lower()

    if selected_mode == "local":
        labels = expand_goal_local(image, goal)
        return labels, "Local vision model", ""

    if selected_mode == "remote":
        labels = expand_goal_remote(image, goal)
        return labels, "Remote vision model", ""

    try:
        labels = expand_goal_remote(image, goal)
        return labels, "Remote vision model", ""
    except Exception as error:
        labels = expand_goal_local(image, goal)
        message = f"Remote LLM unavailable; local fallback used. {error}"
        return labels, "Local vision model", message


def get_detector():
    """Load the local object detector once and reuse it."""
    global _detector

    if _detector is None:
        import torch
        from transformers import pipeline

        device = 0 if torch.cuda.is_available() else -1
        _detector = pipeline(
            "zero-shot-object-detection",
            model=DETECTOR_MODEL,
            device=device,
        )

    return _detector


def detect_objects(
    image: Image.Image,
    labels: list[str],
    threshold: float,
) -> list[dict]:
    """Find the requested object labels in an image."""
    if image is None or not labels:
        return []

    detections = get_detector()(
        image,
        candidate_labels=labels,
        threshold=threshold,
    )
    return remove_duplicate_detections(detections)


def box_iou(first: dict, second: dict) -> float:
    """Calculate how much two boxes overlap."""
    left = max(first["xmin"], second["xmin"])
    top = max(first["ymin"], second["ymin"])
    right = min(first["xmax"], second["xmax"])
    bottom = min(first["ymax"], second["ymax"])

    intersection = max(0, right - left) * max(0, bottom - top)
    first_area = (first["xmax"] - first["xmin"]) * (first["ymax"] - first["ymin"])
    second_area = (second["xmax"] - second["xmin"]) * (second["ymax"] - second["ymin"])
    union = first_area + second_area - intersection

    return intersection / union if union else 0.0


def remove_duplicate_detections(
    detections: list[dict],
    overlap_threshold: float = 0.5,
) -> list[dict]:
    """Keep the strongest box when same-label boxes overlap."""
    kept = []

    for detection in sorted(detections, key=lambda item: item["score"], reverse=True):
        duplicate = any(
            detection["label"] == existing["label"]
            and box_iou(detection["box"], existing["box"]) >= overlap_threshold
            for existing in kept
        )
        if not duplicate:
            kept.append(detection)

    return kept


def draw_detections(image: Image.Image, detections: list[dict]) -> Image.Image:
    """Return an RGB copy of the image with labelled detection boxes."""
    annotated = image.convert("RGB").copy()
    draw = ImageDraw.Draw(annotated)

    for detection in detections:
        box = detection["box"]
        label = detection["label"]
        score = detection["score"]
        coordinates = (
            box["xmin"],
            box["ymin"],
            box["xmax"],
            box["ymax"],
        )

        draw.rectangle(coordinates, outline="red", width=3)
        draw.text(
            (box["xmin"], max(0, box["ymin"] - 12)),
            f"{label} {score:.2f}",
            fill="red",
        )

    return annotated


def summarize_detections(detections: list[dict]) -> str:
    """Create a short count summary for the interface."""
    if not detections:
        return "No matching objects were detected."

    counts = {}
    for detection in detections:
        label = detection["label"]
        counts[label] = counts.get(label, 0) + 1

    return ", ".join(f"{label}: {count}" for label, count in counts.items())
