---
title: HazardLens AI
emoji: ⚠️
colorFrom: yellow
colorTo: red
sdk: gradio
python_version: 3.12
app_file: app.py
pinned: false
preload_from_hub:
  - Qwen/Qwen3-VL-8B-Instruct
  - google/owlvit-base-patch32
---

# HazardLens AI

Upload a workplace image and describe what you want to inspect. HazardLens uses
a vision-language model to select relevant objects and OWL-ViT to locate them.

## Links

- GitHub: https://github.com/shyampatadia/hazardlens-ai
- Hugging Face Space: https://huggingface.co/spaces/shyampatadia22/hazardlens-ai

## Models

| Component | Model | Execution |
|---|---|---|
| Remote vision model | `zai-org/GLM-5.3-Flash` | Hugging Face Inference API |
| Local vision model | `Qwen/Qwen3-VL-8B-Instruct` | Hugging Face Space ZeroGPU |
| Object detector | `google/owlvit-base-patch32` | Hugging Face Space ZeroGPU |

## Automation and Notifications

- `.github/workflows/deploy.yml` runs pytest after pushes to `main`.
- Successful tests trigger synchronization to the Hugging Face Space.
- The workflow sends success or failure results to Discord through the `DISCORD_WEBHOOK` secret.
- `HF_TOKEN` is stored as a GitHub Actions secret and a Hugging Face Space secret.

## Automatic Failover

- `Auto` attempts the remote model first.
- API exceptions automatically route the request to the local model.
- The interface displays the model that handled the request.
- `Remote` and `Local` modes disable automatic routing.
- Failover improves availability but local execution has longer startup time and ZeroGPU quota limits.

## Tests

```powershell
python -m pytest -q
```

Tests cover label parsing, model selection and failover, detection filtering, and the application result flow. Model calls are mocked during CI.

## Sources and Assistance

- [GLM-5.3-Flash](https://huggingface.co/zai-org/GLM-5.3-Flash)
- [Qwen3-VL-8B-Instruct](https://huggingface.co/Qwen/Qwen3-VL-8B-Instruct)
- [OWL-ViT](https://huggingface.co/google/owlvit-base-patch32)
- [Hugging Face Spaces](https://huggingface.co/docs/hub/spaces)
- [Managing Spaces with GitHub Actions](https://huggingface.co/docs/hub/spaces-github-actions)
- [Discord webhooks](https://support.discord.com/hc/en-us/articles/228383668-Intro-to-Webhooks)