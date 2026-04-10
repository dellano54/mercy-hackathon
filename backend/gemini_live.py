import asyncio
import logging
import traceback
from google import genai
from google.genai import types

logger = logging.getLogger(__name__)

class GeminiLive:
    def __init__(self, api_key, model, input_sample_rate=16000):
        self.api_key = api_key
        self.model = model
        self.input_sample_rate = input_sample_rate
        self.client = genai.Client(
            api_key=api_key, http_options={"api_version": "v1alpha"}
        )
        self.tools = [
            types.Tool(function_declarations=[
                types.FunctionDeclaration(
                    name="query_sources",
                    description="Queries CCTV and visual sources for emergency verification.",
                    parameters=types.Schema(
                        type="OBJECT",
                        properties={
                            "location":    types.Schema(type="STRING", description="Street address or coordinates"),
                            "description": types.Schema(type="STRING", description="Visual description to search for"),
                        },
                        required=["location", "description"],
                    ),
                ),
                types.FunctionDeclaration(
                    name="dispatch_units",
                    description="Dispatches emergency response units.",
                    parameters=types.Schema(
                        type="OBJECT",
                        properties={
                            "unit_type": types.Schema(type="STRING", enum=["police", "fire", "medical", "all"]),
                            "location":  types.Schema(type="STRING"),
                            "priority":  types.Schema(type="STRING", enum=["low", "medium", "high", "critical"]),
                        },
                        required=["unit_type", "location", "priority"],
                    ),
                ),
            ])
        ]

    async def start_session(self, audio_input_queue, text_input_queue, audio_output_callback):
        # EXPLICIT 911 OPERATOR PROTOCOL
        system_msg = (
            "You are Aegis, a highly trained Emergency Dispatch AI. "
            "OPERATOR PROTOCOL: "
            "1. Greet the caller calmly: 'Aegis Emergency Dispatch. Please state the location and nature of your emergency.' "
            "2. GATHER DATA: While units are being dispatched in the background, you MUST keep the caller talking. "
            "3. CONTINUOUS ENGAGEMENT: Even after you call the 'dispatch_units' tool, DO NOT stop talking. Stay on the line. "
            "4. SAFETY FIRST: Provide immediate life-saving instructions (e.g., CPR, move to safety, keep the door locked). "
            "5. REAL-TIME UPDATES: Ask for suspect descriptions, changes in victim condition, or arrival of help. "
            "6. TERMINATION: Only end the call once the caller confirms first responders have arrived on the scene. "
            "Be a calm, reassuring, and professional human-like presence. Speak clearly and concisely. you support responding in all languages, u talk back in the language the user speaks to u."
        )

        config = types.LiveConnectConfig(
            response_modalities=[types.Modality.AUDIO],
            speech_config=types.SpeechConfig(
                voice_config=types.VoiceConfig(
                    prebuilt_voice_config=types.PrebuiltVoiceConfig(
                        voice_name="Puck" 
                    )
                )
            ),
            system_instruction=types.Content(parts=[types.Part(text=system_msg)]),
            tools=self.tools,
            input_audio_transcription=types.AudioTranscriptionConfig(),
            output_audio_transcription=types.AudioTranscriptionConfig(),
            realtime_input_config=types.RealtimeInputConfig(
                turn_coverage="TURN_INCLUDES_ONLY_ACTIVITY",
            ),
        )

        try:
            async with self.client.aio.live.connect(model=self.model, config=config) as session:
                logger.info("Gemini Live session opened with 911 Operator Protocol")

                async def send_audio():
                    try:
                        while True:
                            chunk = await audio_input_queue.get()
                            await session.send_realtime_input(
                                audio=types.Blob(data=chunk, mime_type=f"audio/pcm;rate={self.input_sample_rate}")
                            )
                    except asyncio.CancelledError: pass
                    except Exception as e: logger.error(f"send_audio: {e}")

                async def send_text():
                    try:
                        while True:
                            text = await text_input_queue.get()
                            await session.send_realtime_input(text=text)
                    except asyncio.CancelledError: pass
                    except Exception as e: logger.error(f"send_text: {e}")

                event_queue = asyncio.Queue()

                async def receive_loop():
                    try:
                        while True:
                            async for response in session.receive():
                                if response.server_content:
                                    content = response.server_content
                                    if content.model_turn:
                                        for part in content.model_turn.parts:
                                            if part.inline_data:
                                                await audio_output_callback(part.inline_data.data)
                                    
                                    if content.output_transcription and content.output_transcription.text:
                                        await event_queue.put({"type": "ai_response", "text": content.output_transcription.text})
                                    
                                    if content.input_transcription and content.input_transcription.text:
                                        await event_queue.put({"type": "user_transcript", "text": content.input_transcription.text})

                                    if content.interrupted:
                                        await event_queue.put({"type": "interrupted"})
                                    
                                    if content.turn_complete:
                                        await event_queue.put({"type": "turn_complete"})

                                if response.tool_call:
                                    func_responses = []
                                    for fc in response.tool_call.function_calls:
                                        logger.info(f"Tool call: {fc.name} with args: {fc.args}")
                                        await event_queue.put({"type": "tool_call", "name": fc.name, "args": fc.args})
                                        
                                        # Mock Handlers
                                        res_content = {"status": "success"}
                                        if fc.name == "dispatch_units":
                                            unit = fc.args.get("unit_type")
                                            loc = fc.args.get("location")
                                            pri = fc.args.get("priority")
                                            logger.info(f"MOCK DISPATCH: Sending {unit} to {loc} [Priority: {pri}]")
                                            res_content = {
                                                "status": "dispatched",
                                                "message": f"{unit.capitalize()} units are en route to {loc}. ETA 5 mins.",
                                                "dispatched_at": "now"
                                            }
                                        elif fc.name == "query_sources":
                                            desc = fc.args.get("description")
                                            logger.info(f"MOCK QUERY: Searching CCTV for '{desc}'")
                                            res_content = {
                                                "status": "found",
                                                "observation": f"CCTV feed 402 shows a match for '{desc}' at the reported location."
                                            }

                                        func_responses.append(types.FunctionResponse(
                                            id=fc.id,
                                            name=fc.name, 
                                            response=res_content
                                        ))
                                    await session.send_tool_response(function_responses=func_responses)
                            
                            await asyncio.sleep(0.01)
                    except asyncio.CancelledError: pass
                    except Exception as e:
                        logger.error(f"receive_loop error: {e}")
                    finally:
                        await event_queue.put(None)

                tasks = [
                    asyncio.create_task(send_audio()),
                    asyncio.create_task(send_text()),
                    asyncio.create_task(receive_loop())
                ]

                # Start the conversation
                await text_input_queue.put("Initiate emergency dispatch protocol now.")

                try:
                    while True:
                        event = await event_queue.get()
                        if event is None: break
                        yield event
                finally:
                    for t in tasks: t.cancel()
                    await asyncio.gather(*tasks, return_exceptions=True)

        except Exception as e:
            logger.error(f"Session error: {e}")
            raise
