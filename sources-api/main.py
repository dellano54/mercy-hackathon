import os
import json
import asyncio
import numpy as np
from datetime import datetime, timedelta
from typing import List, Optional, Dict
from fastapi import FastAPI, HTTPException, Body
from pydantic import BaseModel
from dotenv import load_dotenv

from google import genai
from google.genai import types

load_dotenv()

# Configure Gemini Client for Sources API
client = genai.Client(api_key=os.getenv("GOOGLE_API_KEY"))
EMBEDDING_MODEL_ID = "models/gemini-embedding-2-preview"

app = FastAPI(title="Project Aegis - Sources API Service")

# --- Data Models ---

class SearchQuery(BaseModel):
    location: str
    timestamp: str # ISO format
    event: str
    radius_km: float = 5.0
    time_window_mins: int = 30

class VideoResult(BaseModel):
    video_id: str
    file_path: str
    location: str
    coordinates: Dict[str, float]
    timestamp: str
    camera_type: str
    relevance_score: float

# --- Sources Data Controller ---

class SourcesDataController:
    def __init__(self, metadata_path: str, vector_store_path: str):
        self.metadata_path = metadata_path
        self.vector_store_path = vector_store_path
        self.metadata = self._load_json(metadata_path) or []
        # Convert lists back to numpy arrays for distance calc
        raw_store = self._load_json(vector_store_path) or {}
        self.vector_store = {k: np.array(v) for k, v in raw_store.items()}

    def _load_json(self, path):
        if os.path.exists(path):
            with open(path, 'r') as f:
                return json.load(f)
        return None

    def _save_vector_store(self):
        # Convert numpy arrays to lists for JSON storage
        serializable_store = {k: v.tolist() for k, v in self.vector_store.items()}
        with open(self.vector_store_path, 'w') as f:
            json.dump(serializable_store, f)

    async def index_videos(self):
        """Native Multimodal Indexing for Sources."""
        updated = False
        for video in self.metadata:
            v_id = video['video_id']
            if v_id not in self.vector_store:
                print(f"Indexing {v_id} with Gemini Embedding 2...")
                try:
                    # Natively embed video content
                    # Note: For the prototype, we embed the description if the file isn't uploaded yet
                    res = client.models.embed_content(
                        model=EMBEDDING_MODEL_ID,
                        contents=video.get('description', video['location']),
                        config=types.EmbedContentConfig(task_type="RETRIEVAL_DOCUMENT")
                    )
                    self.vector_store[v_id] = np.array(res.embeddings[0].values)
                    updated = True
                except Exception as e:
                    print(f"Error indexing {v_id}: {e}")
        if updated: self._save_vector_store()

    def _is_within_time(self, t1_str, t2_str, window_mins):
        try:
            t1 = datetime.fromisoformat(t1_str.replace('Z', ''))
            t2 = datetime.fromisoformat(t2_str.replace('Z', ''))
            diff = abs((t1 - t2).total_seconds() / 60)
            return diff <= window_mins
        except:
            return False

    async def find_relevant_videos(self, query: SearchQuery) -> List[VideoResult]:
        # 1. Generate Query Embedding
        res = client.models.embed_content(
            model=EMBEDDING_MODEL_ID,
            contents=f"task: retrieval_query: {query.event}",
            config=types.EmbedContentConfig(task_type="RETRIEVAL_QUERY")
        )
        query_vec = np.array(res.embeddings[0].values)

        results = []
        for video in self.metadata:
            # Metadata Filters: Location (string match) & Time (+/- 30 mins)
            is_location_match = query.location.lower() in video['location'].lower()
            is_time_match = self._is_within_time(query.timestamp, video['timestamp'], query.time_window_mins)

            if is_location_match or is_time_match:
                v_id = video['video_id']
                if v_id in self.vector_store:
                    cand_vec = self.vector_store[v_id]
                    # Cosine Similarity
                    sim = np.dot(query_vec, cand_vec) / (np.linalg.norm(query_vec) * np.linalg.norm(cand_vec))
                    
                    results.append(VideoResult(
                        **video,
                        relevance_score=float(sim)
                    ))

        # Sort by relevance score
        results.sort(key=lambda x: x.relevance_score, reverse=True)
        return results

# --- Instances ---

sources_controller = SourcesDataController("../data/cctv_metadata.json", "../data/vector_store.json")

# --- Endpoints ---

@app.on_event("startup")
async def startup():
    await sources_controller.index_videos()

@app.post("/search", response_model=List[VideoResult])
async def search_sources(query: SearchQuery):
    print(f"Searching for {query.event} at {query.location} ({query.timestamp})")
    results = await sources_controller.find_relevant_videos(query)
    if not results:
        raise HTTPException(status_code=404, detail="No relevant source data found.")
    return results

@app.get("/health")
async def health():
    return {"status": "Sources API Active", "data_sources": len(sources_controller.metadata)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
