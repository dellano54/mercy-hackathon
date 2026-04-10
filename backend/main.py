import os
import json
import asyncio
import base64
import logging
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from dotenv import load_dotenv
from gemini_live import GeminiLive

load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Config
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY", "AIzaSyBKi1G7L4Eh0VzXSurg9ROdXH7D9oijeWI")
MODEL_ID = os.getenv("MODEL_ID", "gemini-3.1-flash-live-preview")

app = FastAPI(title="Project Aegis - AI Emergency Dispatch")


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Incident Manager for Dashboards
class IncidentManager:
    def __init__(self):
        self.dashboard_sockets = []

    async def register(self, ws: WebSocket):
        await ws.accept()
        self.dashboard_sockets.append(ws)
        try:
            while True:
                await ws.receive_text()
        except: pass
        finally:
            if ws in self.dashboard_sockets: self.dashboard_sockets.remove(ws)

    async def broadcast(self, msg: dict):
        dead = []
        for s in self.dashboard_sockets:
            try: await s.send_json(msg)
            except: dead.append(s)
        for s in dead:
            if s in self.dashboard_sockets: self.dashboard_sockets.remove(s)

incident_manager = IncidentManager()

# --- WebSocket for Caller (Web Interface) ---
@app.websocket("/ws/caller")
async def caller_ws(ws: WebSocket):
    await ws.accept()
    logger.info("New caller session started")

    audio_in = asyncio.Queue()
    text_in = asyncio.Queue()

    async def audio_out_cb(data: bytes):
        try:
            # Send raw binary audio frame
            await ws.send_bytes(data)
        except: pass

    gemini = GeminiLive(api_key=GOOGLE_API_KEY, model=MODEL_ID)

    async def receive_loop():
        try:
            while True:
                msg = await ws.receive()
                if "bytes" in msg:
                    await audio_in.put(msg["bytes"])
                elif "text" in msg:
                    try:
                        data = json.loads(msg["text"])
                        if data.get("type") == "text":
                            await text_in.put(data["text"])
                    except:
                        # Fallback for plain text
                        await text_in.put(msg["text"])
        except WebSocketDisconnect:
            logger.info("Caller disconnected")
        except Exception as e:
            logger.error(f"Receive loop error: {e}")

    rx_task = asyncio.create_task(receive_loop())

    try:
        async for event in gemini.start_session(audio_in, text_in, audio_out_cb):
            await ws.send_json(event)
            await incident_manager.broadcast({"type": "agent_log", "event": event})
    except Exception as e:
        logger.error(f"Gemini session error: {e}")
    finally:
        rx_task.cancel()
        try: await ws.close()
        except: pass

@app.websocket("/ws/dashboard")
async def dashboard_ws(ws: WebSocket):
    await incident_manager.register(ws)

# Serve Frontend
# Ensure the 'frontend' directory exists in the backend folder or root
if not os.path.exists("static"):
    os.makedirs("static")

app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/")
async def root():
    return FileResponse("static/index.html")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
