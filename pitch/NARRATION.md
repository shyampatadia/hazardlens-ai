# HazardLens AI — VC pitch narration

Timed to `out/hazardlens-pitch.mp4` (2:30). The video reads fine silently, but a
voiceover is what turns it into a pitch. Aim for a steady pace — roughly 145 words
per minute — and let the visuals land before moving on.

Record with any phone or `Voice Recorder`, then mux:

```powershell
ffmpeg -i out/hazardlens-pitch.mp4 -i narration.m4a -c:v copy -c:a aac -shortest out/pitch-final.mp4
```

---

### 0:00 — Hook (14s)

> Every workplace has a fire exit. Most of the time, something is parked in front
> of it. Safety walkthroughs are manual, subjective, and happen far less often
> than they should — and the hazard is almost always in plain sight. Nobody is
> looking.

### 0:14 — Product (15s)

> This is HazardLens AI. You upload a photo of your site, you type a safety
> question in plain English, and you get that same photo back with the objects
> that matter boxed and labelled. No training, no setup, no checklist.

### 0:29 — Live demo (23s)

> Here it is running. The inspector asks: *find anything blocking the emergency
> exit*. A vision-language model reads both the photo and the question, and
> decides which physical objects are relevant — box, cart, pallet. Then an
> open-vocabulary detector locates them. Four obstructions found, in under four
> seconds, in front of a door with an alarm on it.

### 0:52 — Differentiator (17s)

> Here is what makes that hard. Every other zero-shot detector needs you to
> supply the label list up front — which means you already have to know what the
> hazard is. HazardLens infers the list from the question. It works out that the
> door is the reference and the boxes are the target. That is the difference
> between a tool an expert can drive and a tool anyone can.

### 1:09 — Performance (20s)

> We measured this, we did not estimate it. Against the deployed service, the
> hosted model answers in about four seconds. The same pipeline running the model
> ourselves takes forty. Ten times slower. Our one failure in testing was a cold
> start — the first request has to load an eight-billion-parameter model — and we
> warm the service to hide it.

### 1:29 — Economics (21s)

> At a thousand users doing ten inspections a month, that is ten thousand
> inspections for six dollars and forty cents. Here is the counterintuitive part:
> running the model ourselves is not the cheap option. It costs seven times more,
> because GPU hours dominate API fees. We priced both paths, and we know exactly
> where the crossover is.

### 1:50 — Reliability (20s)

> We run two backends. When the hosted API times out, rate-limits, or goes down,
> the request reroutes to our own model automatically — no user action, no error
> page — and the interface always names the model that answered. Availability
> stops depending on a vendor we do not control.

### 2:10 — Privacy and close (20s)

> And that fallback is our moat. Safety photos show employees, facility layouts,
> and evidence of non-compliance. Regulated customers cannot send those to a
> third-party API. Because we already run the model ourselves, the private
> deployment is the same product — an enterprise tier, not a compromise.
> HazardLens AI. See the hazard before it costs you.

---

## Notes for delivery

- The strongest line for an investor is the cost inversion at 1:29 — most teams
  assume self-hosting is cheaper. Slow down there.
- If you need to cut for time, the differentiator section at 0:52 compresses
  best; the demo and the economics should not be touched.
- Everything on screen is real: the detections were produced by running OWL-ViT
  on `test_images/test_image_2.jpg`, and the latency figures come from a live run
  against the deployed Space.
