# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

HazardLens AI — a Gradio app that takes a workplace image plus a natural-language inspection
request, uses a vision-language model to turn the request into concrete object labels, then
uses OWL-ViT zero-shot detection to locate those labels and draw boxes.

The repository is also the deployment source for the Hugging Face Space
`shyampatadia22/hazardlens-ai`; `README.md`'s YAML front matter is Space configuration
(`sdk`, `app_file`, `preload_from_hub`), not decoration — keep it intact when editing the README.

## Commands

```powershell
python -m pytest -q                      # full suite
python -m pytest tests/test_hazardlens.py::test_parse_labels_cleans_duplicates_and_none
python app.py                            # run the Gradio app locally (needs HF_TOKEN in .env)
```

Dependencies are managed with `uv` (`uv.lock`, `pyproject.toml`). `requirements.txt` is the
unpinned mirror the Hugging Face Space installs from — changes to runtime dependencies must be
made in **both** files or the Space build will diverge from local.

Live benchmark against the deployed Space (opt-in; consumes API/GPU quota, so it is a script,
not a pytest test). It has no CLI — all settings are constants in a block at the top of the
file, and `IMAGE_COUNT` x `MODES` controls how much quota a run costs:

```powershell
python testing_performace.py
```

## Architecture

Three modules, deliberately flat:

- `config.py` — model IDs and `LABEL_PROMPT`. The prompt is load-bearing: it constrains the VLM
  to emit only comma-separated singular physical-object nouns (or `NONE`), because its output
  feeds straight into OWL-ViT's `candidate_labels`. Changing its wording changes detection
  behaviour more than any code change would.
- `helpers.py` — all model access and image logic. Imports config via `from config import *`.
- `app.py` — Gradio Blocks UI and `analyze_image`, the single orchestration function wired to
  the button and exposed as the `/analyze_image` API endpoint used by the benchmark.

### Request flow

`analyze_image` → `expand_goal` (image + goal → labels, backend name, status message) →
`detect_objects` (OWL-ViT + `remove_duplicate_detections` NMS) → `draw_detections` /
`summarize_detections`. All five UI outputs come from this one function.

### Backend selection and failover

`expand_goal(image, goal, mode)` returns `(labels, backend_label, message)`:

- `Remote` — hosted `zai-org/GLM-5.3-Flash` via `InferenceClient.chat_completion`, image sent as
  a base64 data URL. No fallback.
- `Local` — `Qwen/Qwen3-VL-8B-Instruct` through a transformers `image-text-to-text` pipeline. No fallback.
- `Auto` — tries remote, and on **any** exception silently falls back to local, surfacing the
  error text in the returned message.

The `backend_label` string is asserted verbatim in tests (`f"Remote: {REMOTE_MODEL}"`,
`f"Local fallback: {LOCAL_MODEL}"`) and parsed by the benchmark, so treat it as an interface.

### Lazy loading

`get_remote_client`, `get_local_generator`, and `get_detector` are module-level singletons that
import `torch`/`transformers` *inside* the function. This keeps CI light — the GitHub Actions
test job installs no torch — so never move those imports to module scope.

### ZeroGPU

`analyze_image` is decorated `@spaces.GPU(duration=120)`. GPU is allocated per-call on the Space,
which is why models are loaded lazily inside the call rather than at import.

## Testing conventions

Tests never touch real models. They `monkeypatch` `helpers.expand_goal_remote` /
`expand_goal_local` / `helpers.get_detector`. Note that `app.py` imports `expand_goal` by name,
so patching the app-level flow requires `monkeypatch.setattr(app, "expand_goal", ...)`, while
detector patching targets `helpers`.

`tests/test_performance_benchmark.py` tests only the pure functions of `testing_performace.py`
(`percentile`, `summarize`, `estimate_cost`) — it makes no network calls.

## CI/CD

`.github/workflows/deploy.yml` on push to `main`: pytest → `huggingface/hub-sync` to the Space →
Discord webhook notification (success or failure). Secrets: `HF_TOKEN`, `DISCORD_WEBHOOK`.
A failing test blocks deployment.

## Deliverables outside the app

- `report.md` — the case-study report. Sections (i) and (j) are marked [Human only] in the
  rubric and are intentionally left blank; do not write them.
- `pitch/` — a Remotion project that renders the 2:30 VC pitch video
  (`cd pitch && npm run build`). Its `public/detections.json` holds **real** OWL-ViT output
  generated locally, not mocked boxes — regenerate it rather than hand-editing coordinates.
  `pitch/node_modules/` and `pitch/out/` are gitignored so they never sync to the Space.
