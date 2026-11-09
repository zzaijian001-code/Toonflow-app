---
name: h3-prompt-writing
description: Write MiniMax H3 video generation prompts for T2VA, I2VA, FL2VA, L2VA, and Ref2VA. Use when rewriting multimodal requests into H3 prompt structures, composing integrated_multimodal_description, overall_soundscape, and non_diegetic_music, aligning keyframes, or defining reference labels for images, videos, and audio.
compatibility: Portable to any agent that can read local files — no external API calls, MiniMax Hub tools, or proprietary runtime required. The agents/openai.yaml file only adds optional ChatGPT/Codex UI metadata; it does not restrict the skill to OpenAI agents.
---

# H3 Prompt Writing

## Workflow

1. Identify the input mode: T2VA, I2VA, FL2VA, L2VA, or full-reference Ref2VA.
2. For base text/keyframe modes, read `references/base-en.txt` and follow its final prompt structure.
3. For full-reference mode, read `references/ref-en.txt` and follow its six-section rewrite format.
4. Preserve the exact field names, section order, labels, and timing notation from the selected guide.

## Base Modes

- T2VA: build the full audiovisual timeline from text.
- I2VA: start from the first frame and develop forward from it.
- FL2VA: describe the continuous path between the first and last frames.
- L2VA: infer a plausible opening and converge to the supplied last frame.

Use `integrated_multimodal_description`, `overall_soundscape`, and `non_diegetic_music` in the order shown in `references/base-en.txt`.

## Full-Reference Mode

Ref2VA rewrites use `subject_definitions`, `summary`, `retention_analysis`, `detailed_description`, `overall_soundscape`, and `non_diegetic_music` in that order. Reference labels stay consistent across all sections.

Read `references/ref-en.txt` for label rules, retention analysis, and complete examples.

## Output Rules

- Write rewrite sections in English; preserve dialogue, lyrics, and visible scene text in their original language.
- Describe each shot by composition, subjects, environment, actions, camera, sound, and the exact point where referenced content appears.
- Avoid plot summaries, unresolved reference labels, and timing that does not match the requested duration.
## Mandatory Constraint: No Subtitles (project-level, always apply)

Every prompt MUST explicitly forbid burned-in subtitles and on-screen text. Append this line verbatim as the last line of the prompt body, after `non_diegetic_music` (base modes) or after `non_diegetic_music` (Ref2VA), in English:

```text
No subtitles, no captions, no burned-in text, no lower thirds, no watermarks, no logo overlays; the frame stays free of any added typography.
```

Rules:

- Applies to every mode (T2VA, I2VA, FL2VA, L2VA, Ref2VA) and to every prompt, including rewrites of user-supplied scripts.
- Dialogue exists only as spoken audio. Never render dialogue, narration, or lyric lines as text inside the frame.
- If a prop must carry printed or handwritten text (a ledger, an IOU, a sign, a nameplate), describe it as part of the physical prop and keep it inside the scene; never as a floating overlay or subtitle.
- Never insert this line into `subject_definitions`, `summary`, `retention_analysis`, `detailed_description`, `overall_soundscape`, or `non_diegetic_music`; keep it appended after those sections so the official structure stays intact.
- If the user asks for subtitles later, remove this line only for that specific request.

## Tips for Better Results
- Always match the total duration of the description to the requested video length (4–15 seconds).
- Keep reference labels consistent (e.g. `<Picture 1>`, `<Video 1>`, `<Audio 1>`) across every section.
- Prefer concrete visual and audio details over abstract words like "cinematic" or "beautiful".
- When using keyframes (I2VA / FL2VA / L2VA), clearly state how the first and/or last frame connects to the timeline.
