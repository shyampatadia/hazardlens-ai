"""Generate the pitch voiceover and mux it onto the rendered video.

    ..\.venv\Scripts\python.exe narrate.py

Each line is timed to a scene in src/Pitch.tsx. SCENES below must stay in sync
with the durations there: `start` is when the scene begins, `budget` is how long
the narration has before the next scene arrives.
"""

from __future__ import annotations

import asyncio
import subprocess
import sys
from pathlib import Path

import edge_tts

VOICE = "en-US-AndrewNeural"   # warm, conversational; try en-US-AriaNeural for female
RATE = "+6%"                   # slight lift keeps a pitch from dragging
LEAD_IN = 0.6                  # let each scene land before the voice starts

HERE = Path(__file__).resolve().parent
WORK = HERE / "out" / "audio"
VIDEO = HERE / "out" / "hazardlens-pitch.mp4"
FINAL = HERE / "out" / "hazardlens-pitch-narrated.mp4"

# (start_seconds, budget_seconds, text)
SCENES = [
    (
        0.0,
        14.07,
        "Every workplace has a fire exit. Most of the time, something is parked "
        "in front of it. Safety inspections are manual, infrequent, and the "
        "hazard is hiding in plain sight.",
    ),
    (
        14.07,
        15.07,
        "This is HazardLens AI. Upload a photo of your site, type a safety "
        "question in plain English, and get that photo back with the objects "
        "that matter boxed and labelled.",
    ),
    (
        29.13,
        22.40,
        "Here it is running. The inspector asks: find anything blocking the "
        "emergency exit. A vision language model reads the photo and the "
        "question, and decides which objects are relevant. Then an open "
        "vocabulary detector locates them. Four obstructions found, in under "
        "four seconds, in front of an alarmed fire door.",
    ),
    (
        51.53,
        17.07,
        "Here is what makes that hard. Every other detector needs you to supply "
        "the label list up front, so you already have to know what the hazard "
        "is. HazardLens infers it from your question.",
    ),
    (
        68.60,
        20.13,
        "We measured this, we did not estimate it. Against the live service, the "
        "hosted model answers in about four seconds. Running the model "
        "ourselves takes forty. Ten times slower. Our one failure was a cold "
        "start, and we warm the service to hide it.",
    ),
    (
        88.73,
        21.13,
        "At a thousand users doing ten inspections a month, that is ten thousand "
        "inspections for six dollars and forty cents. Here is the "
        "counterintuitive part. Running the model ourselves is not the cheap "
        "option. It costs seven times more, because GPU hours dominate API fees.",
    ),
    (
        109.87,
        20.13,
        "We run two backends. When the hosted API times out, rate limits, or "
        "goes down, the request reroutes to our own model automatically, with "
        "no user action. And the interface always names the model that answered.",
    ),
    (
        130.0,
        20.0,
        "And that fallback is our moat. Safety photos show employees, layouts, "
        "and evidence of non-compliance. Regulated customers cannot send those "
        "to a third party API. Because we already run the model ourselves, the "
        "private deployment is the same product. HazardLens AI. See the hazard "
        "before it costs you.",
    ),
]


def duration(path: Path) -> float:
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration",
         "-of", "csv=p=0", str(path)],
        capture_output=True, text=True, check=True,
    )
    return float(out.stdout.strip())


async def synth(text: str, out: Path, rate: str) -> None:
    await edge_tts.Communicate(text, VOICE, rate=rate).save(str(out))


async def main() -> int:
    WORK.mkdir(parents=True, exist_ok=True)
    if not VIDEO.exists():
        print(f"Render the video first: {VIDEO}", file=sys.stderr)
        return 1

    clips = []
    for i, (start, budget, text) in enumerate(SCENES):
        raw = WORK / f"{i}.mp3"
        await synth(text, raw, RATE)
        d = duration(raw)
        avail = budget - LEAD_IN

        # If the line overruns its scene, speed it up just enough to fit.
        if d > avail:
            extra = int(((d / avail) - 1) * 100) + 2
            await synth(text, raw, f"+{6 + extra}%")
            d = duration(raw)
            note = f"  (sped up +{6 + extra}% to fit)"
        else:
            note = ""
        clips.append({"file": raw, "start": start + LEAD_IN, "dur": d})
        flag = "OVER" if d > avail else "ok"
        print(f"  scene {i + 1}: {d:5.1f}s / {avail:5.1f}s  {flag}{note}")

    # Lay each clip onto a silent bed at its scene offset.
    total = duration(VIDEO)
    inputs, filters, labels = [], [], []
    for i, c in enumerate(clips):
        inputs += ["-i", str(c["file"])]
        filters.append(f"[{i}:a]adelay={int(c['start'] * 1000)}|{int(c['start'] * 1000)}[a{i}]")
        labels.append(f"[a{i}]")
    graph = (
        ";".join(filters) + ";" + "".join(labels)
        # apad holds the silent bed out to the full video length, otherwise
        # amix ends with the last line and -shortest clips the closing scene.
        # loudnorm brings the voice to the -16 LUFS web speech standard.
        + f"amix=inputs={len(clips)}:normalize=0,apad=whole_dur={total},"
        # loudnorm resamples to 192k/mono internally; force it back to the
        # 48 kHz stereo every player expects.
        + "loudnorm=I=-16:TP=-1.5:LRA=11,aformat=sample_rates=48000:channel_layouts=stereo[mix]"
    )

    voice = WORK / "voice.wav"
    subprocess.run(
        ["ffmpeg", "-y", *inputs, "-filter_complex", graph, "-map", "[mix]",
         "-t", str(total), str(voice)],
        check=True, capture_output=True,
    )

    subprocess.run(
        ["ffmpeg", "-y", "-i", str(VIDEO), "-i", str(voice),
         "-c:v", "copy", "-c:a", "aac", "-b:a", "192k",
         "-map", "0:v:0", "-map", "1:a:0", "-shortest", str(FINAL)],
        check=True, capture_output=True,
    )

    print(f"\n  {FINAL}  ({duration(FINAL):.1f}s)")
    return 0


if __name__ == "__main__":
    raise SystemExit(asyncio.run(main()))
