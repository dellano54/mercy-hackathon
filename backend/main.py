import os
import json
import asyncio
import numpy as np
import base64
import httpx
from typing import List, Optional, Dict
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from dotenv import load_dotenv

from google import genai
from google.genai import types

# Load environment variables
load_dotenv()

# Configure Gemini Client
# As of April 2026, we use Gemini 3.1 Flash Live for real-time dispatch logic
client = genai.Client(api_key=os.getenv("GOOGLE_API_KEY"))
LIVE_MODEL_ID = "gemini-3.1-flash-live-preview"
VISION_MODEL_ID = "gemini-3.1-flash-preview"

SOURCES_API_URL = "http://localhost:8001"

app = FastAPI(title="Project Aegis - Autonomous Emergency Dispatch Agent")

# Serve the data folder so the frontend can play videos
app.mount("/data", StaticFiles(directory="../data"), name="data")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Data Models ---

class Incident(BaseModel):
    id: str
    location: str
    severity: str
    status: str
    description: Optional[str] = None
    cctv_file: Optional[str] = None
    timestamp: str

# --- Incident Manager ---

class IncidentManager:
    def __init__(self):
        self.dashboard_sockets = []
        self.active_incidents = {}

    async def register_dashboard(self, ws: WebSocket):
        await ws.accept()
        self.dashboard_sockets.append(ws)

    async def broadcast_dashboard(self, msg: dict):
        for s in self.dashboard_sockets:
            try: await s.send_json(msg)
            except: pass

    async def update_incident(self, inc: Incident):
        self.active_incidents[inc.id] = inc.dict()
        await self.broadcast_dashboard({"type": "state_update", "incidents": list(self.active_incidents.values())})

incident_manager = IncidentManager()

# --- Call Session: The Aegis AI Agent ---

class AegisAgent:
    def __init__(self, ws: WebSocket):
        self.ws = ws
        self.session_id = str(id(ws))
        self.location = None
        self.description = ""
        self.state = "idle"

    async def log(self, message: str, state: str = None):
        if state: self.state = state
        await incident_manager.broadcast_dashboard({
            "type": "agent_log", "state": self.state, "message": message, "session_id": self.session_id
        })

    async def start_session(self):
        """Initializes the Multimodal Live API session with Gemini 3.1 Flash Live."""
        # Tool definition for search
        def trigger_source_retrieval(location: str, timestamp: str, event: str):
            """
            Triggers autonomous source retrieval from the external Sources API.
            location: The location of the incident.
            timestamp: The approximate time of the incident (ISO format).
            event: The expected event or situation (e.g. 'car crash', 'smoke').
            """
            return {"status": "retrieval_initiated", "location": location, "timestamp": timestamp, "event": event}

        config = {"tools": [{"function_declarations": [trigger_source_retrieval]}]}
        
        async with client.aio.live.connect(model=LIVE_MODEL_ID, config=config) as session:
            await self.log("Aegis Online. Monitoring incoming distress stream.", "triage")
            
            # 1. Initial Greeting
            await session.send(input="State your location and describe the emergency clearly.", end_of_turn=True)
            
            async for message in session:
                if message.server_content and message.server_content.model_turn:
                    # Model is speaking or responding
                    parts = message.server_content.model_turn.parts
                    for part in parts:
                        if part.text:
                            await self.ws.send_json({"type": "ai_response", "text": part.text})
                            await self.log(f"AEGIS: {part.text}")
                
                if message.tool_call:
                    # Gemini 3.1 Flash Live triggered a tool call
                    for call in message.tool_call.function_calls:
                        if call.name == "trigger_source_retrieval":
                            await self.handle_source_retrieval(call.args['location'], call.args['timestamp'], call.args['event'])
                            # Send response back to live session
                            await session.send_tool_response(
                                types.LiveClientToolResponse(function_responses=[
                                    types.FunctionResponse(name=call.name, id=call.id, response={"status": "success"})
                                ])
                            )

    async def handle_source_retrieval(self, location: str, timestamp: str, event: str):
        self.location = location
        await self.log(f"Requesting Sources API for context at {location}...", "analyzing")
        
        await incident_manager.broadcast_dashboard({"type": "search_progress", "step": "querying_sources", "message": f"Querying Sources API for {event}..."})
        
        try:
            async with httpx.AsyncClient() as http_client:
                # The Sources API handles the +/- 30 min and near-location logic
                response = await http_client.post(f"{SOURCES_API_URL}/search", json={
                    "location": location,
                    "timestamp": timestamp,
                    "event": event
                }, timeout=10.0)
                
                if response.status_code == 200:
                    results = response.json()
                    best_match = results[0] # Take the most relevant
                    
                    await incident_manager.broadcast_dashboard({
                        "type": "search_progress", "step": "match_found", "message": f"Source Match: {best_match['video_id']}", "video": best_match
                    })
                    await self.analyze_and_validate(best_match)
                else:
                    await self.log(f"Sources API returned {response.status_code}. No data found.")
        except Exception as e:
            await self.log(f"Error calling Sources API: {e}")

    async def analyze_and_validate(self, source_data: dict):
        await self.log("Validating situation via Gemini 3.1 Flash Vision...", "validating")
        
        # Real Video Analysis using Gemini 3.1 Flash (Multimodal)
        # Here we 'watch' the video to confirm details
        with open(source_data['file_path'], 'rb') as f: video_data = f.read()
        
        prompt = f"Identify the specific emergency at {source_data['location']} in this video. Are there injuries? Is there fire?"
        response = client.models.generate_content(
            model=VISION_MODEL_ID,
            contents=[types.Part.from_bytes(data=video_data, mime_type="video/mp4"), prompt]
        )
        
        analysis = response.text
        await incident_manager.broadcast_dashboard({"type": "video_analysis", "report": analysis})
        
        # Automated Dispatch Logic if severity is high
        if "crash" in analysis.lower() or "fire" in analysis.lower() or "smoke" in analysis.lower():
            await self.execute_dispatch(analysis)

    async def execute_dispatch(self, analysis: str):
        await self.log("SEVERITY VERIFIED. Initiating Emergency Dispatch.", "alert")
        
        debrief = f"URGENT DISPATCH TO {self.location}: Visual confirmation of {analysis}. HIGH PRIORITY."
        await incident_manager.broadcast_dashboard({"type": "dispatch_debrief", "debrief": debrief})
        
        await incident_manager.update_incident(Incident(
            id=f"AEGIS-{self.session_id[-4:]}",
            location=self.location,
            severity="CRITICAL",
            status="RESPONDING",
            timestamp="2026-04-10T11:15:00Z"
        ))

# --- Endpoints ---

@app.websocket("/ws/dashboard")
async def dashboard_ws(ws: WebSocket):
    await incident_manager.register_dashboard(ws)
    try:
        while True: await ws.receive_text()
    except: pass

@app.websocket("/ws/caller")
async def caller_ws(ws: WebSocket):
    await ws.accept()
    agent = AegisAgent(ws)
    await agent.start_session()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
