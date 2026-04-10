# Avatar Generation Prompts (Project Aegis)

Use these prompts with AI video generation tools (like Runway Gen-2, Pika, HeyGen, or Midjourney + HeyGen/D-ID) to create the assets for the dashboard avatar.

## Base Character Description
"A professional, empathetic, and authoritative emergency dispatch coordinator. Late 30s, neutral but helpful expression, wearing a clean, modern government-issued uniform or a professional headset. Background is a softly blurred, high-tech command center with subtle blue and amber lights."

---

## 1. State: IDLE (Loopable)
**Prompt:** "A medium close-up of the dispatcher looking calmly at the camera. Subtle blinking, very slight breathing movements, neutral and professional expression. High-quality cinematic lighting, 4k, hyper-realistic."
**Usage:** The default state when waiting for calls.

## 2. State: LISTENING (Loopable)
**Prompt:** "The dispatcher in a medium close-up, slightly tilting their head to the side as if listening intently to a caller. Occasional subtle nods of acknowledgment, eyes showing focus and empathy. No mouth movement. High-quality cinematic lighting, 4k."
**Usage:** Active when the caller is speaking (detected via voice activity).

## 3. State: TALKING (Variable Length)
**Prompt:** "The dispatcher speaking directly to the camera with a reassuring but firm tone. Natural mouth movements synced with professional speech patterns, expressive but controlled facial gestures. Eye contact remains steady. High-quality cinematic lighting, 4k."
**Usage:** Active when the AI is responding to the caller or debriefing the department.

## 4. State: ANALYZING (Loopable)
**Prompt:** "The dispatcher looking slightly away from the camera at an off-screen monitor. Their eyes are scanning back and forth as if reading data or watching a video feed. A look of intense focus and rapid information processing. Cinematic lighting, 4k."
**Usage:** Active when the AI is processing CCTV footage or searching the video archive.

## 5. State: ALERT / URGENT (Loopable)
**Prompt:** "The dispatcher with a serious, high-priority expression. Brows slightly furrowed, leaning slightly forward toward the camera, conveying the gravity of a severe emergency. High-quality cinematic lighting, 4k."
**Usage:** Active during high-severity disasters or when immediate dispatch is required.

---

## Technical Notes for Generation:
- **Aspect Ratio:** 16:9 or 1:1 depending on dashboard design.
- **Consistency:** Ensure the same character model is used for all clips (use 'Character Reference' if using Midjourney).
- **Background:** Keep the background consistent across all states to allow for seamless transitions.
- **Duration:** 5-10 second loopable clips are ideal for 'Idle', 'Listening', and 'Analyzing'. 'Talking' can be a generic 10-second clip that loops or is driven by a lip-sync tool.