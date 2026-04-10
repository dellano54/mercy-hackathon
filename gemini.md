# Product Definition: Project Aegis (Emergency AI Dispatch Agent)

## 1. Vision
An autonomous, highly intelligent AI agent designed for disaster aversion, emergency management, and dispatch coordination. Acting as a digital emergency coordinator for government and emergency services, it handles incoming distress calls via a live multimodal stream, cross-references real-time data from unstructured video archives (simulated CCTV), and dispatches necessary aid while maintaining a human-like, reassuring interface for both callers and operators.

## 2. Core Capabilities
*   **Multimodal Live Interaction:** Uses Gemini 2.0 Flash Live (Multimodal Live API) for low-latency, bidirectional voice conversation with callers.
*   **Zero-Description Video Search:** Utilizes **Gemini Embedding 2** to natively embed unstructured CCTV video files. The agent searches these embeddings using the caller's verbal description (cross-modal retrieval) without needing pre-written text descriptions.
*   **Location & Time Filtering:** Narrows down the search space using metadata (coordinates, timestamp) before performing semantic search on the video embeddings.
*   **Real-time Situation Awareness:** Assesses severity by "watching" the retrieved footage with Gemini 2.0 Flash and "listening" to the caller simultaneously.
*   **Deduplication & Multi-threading:** Uses semantic embeddings to match incoming reports to existing incidents, preventing redundant dispatches.
*   **Dynamic Debriefing:** Synthesizes ongoing situations into concise briefings for emergency departments.

## 3. System Architecture
*   **Mobile App (Expo):** Streams voice/audio from the caller to the backend Agent.
*   **Agent API (Python/FastAPI):**
    *   **Multimodal Live Orchestrator:** Manages the connection to Gemini 3.1 Flash Live.
    *   **Tool-Enabled Dispatch:** Uses autonomous tool calls to query the Sources API for context.
    *   **Inference Engine:** Routes tasks to Gemini 3.1 Flash (deep analysis).
*   **Sources API (Python/FastAPI):**
    *   **Data Controller:** Manages the unstructured video archive, metadata filtering, and multimodal embedding search.
    *   **Spatio-Temporal Retrieval:** Automatically searches for events within +/- 30 minutes and near reported locations.
*   **Dashboard (React):**
    *   **Liquid Glass UI:** A futuristic, frosted-glass interface with 3D Spline backgrounds.
    *   **Reactive Avatar:** A human-face UI that shifts states based on the Agent's output.

## 4. AI Model Strategy
*   **Gemini 3.1 Flash Live (Multimodal Live API):** Primary interface for the "Live Audio/Voice" interaction.
*   **Gemini 3.1 Flash:** Used for "watching" and analyzing the retrieved CCTV video files.
*   **Gemini Embedding 2 (Public Preview):** Maps text and video into the same 3,072-dimensional vector space for zero-shot retrieval. Logic resides in the **Sources API**.


## 5. Data Simulation
*   **Video Archive:** A `data/cctv_videos` folder containing various `.mp4` files.
*   **Metadata Index:** A JSON file mapping video filenames to geolocations, timestamps, and camera IDs.

## 6. Visual Assets (`vid-assets`)
The system utilizes a reactive avatar. Prompts for generating these assets (using tools like Midjourney, Runway, or HeyGen) are stored in `vid-assets/PROMPTS.md`.
States include:
- `idle`: Calm, observant, professional.
- `listening`: Attentive, slight head tilt, acknowledging.
- `talking`: Natural mouth movements, expressive eyes.
- `analyzing`: Focused, eyes scanning (simulating looking at data/screens).
- `alert`: Serious, high-priority expression.