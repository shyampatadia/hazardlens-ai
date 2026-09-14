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
