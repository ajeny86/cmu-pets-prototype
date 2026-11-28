"""Realtime speech-to-text for the buddy app, on this computer.

NVIDIA Parakeet TDT 0.6B v3 (25 European languages incl. Russian, Ukrainian, Portuguese, English;
detects the language itself) on Apple Silicon via MLX (parakeet-mlx), streamed over a WebSocket.

    npm run stt            # from app/, or:  cd app/stt-server && uv run server.py

Protocol, one WebSocket per utterance at ws://127.0.0.1:8765/stream:
    client → binary frames: 16 kHz mono float32 PCM (little-endian), any length
    client → text "end": no more audio
    server → {"type": "partial", "text": "..."} while you speak
    server → {"type": "final", "text": "..."} after "end", then closes
GET /health → {"ok": true, "model": "..."}  (used by the app's /api/transcribe)

Env: STT_PORT (8765), STT_MODEL (mlx-community/parakeet-tdt-0.6b-v3).
"""

import asyncio
import json
import os
import re
import time
from concurrent.futures import ThreadPoolExecutor
from http import HTTPStatus

import mlx.core as mx
import numpy as np
from parakeet_mlx import from_pretrained
from websockets.asyncio.server import ServerConnection, serve
from websockets.http11 import Request

PORT = int(os.environ.get("STT_PORT", "8765"))
MODEL_ID = os.environ.get("STT_MODEL", "mlx-community/parakeet-tdt-0.6b-v3")
CONTEXT = (256, 256)  # (left, right) encoder frames: ~2 s of look-back, a short look-ahead
FLUSH_SECONDS = 1.0  # silence fed after "end" so the last words are decoded

# MLX work stays on one thread: arrays and the model's streams belong to the thread that made them
MLX = ThreadPoolExecutor(max_workers=1, thread_name_prefix="mlx")
LOCK = asyncio.Lock()  # one utterance at a time: streaming switches the shared model's attention mode
LOCAL_ORIGIN = re.compile(r"^https?://(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$")

model = None
SAMPLE_RATE = 16000


def load():
    global model, SAMPLE_RATE
    model = from_pretrained(MODEL_ID)
    SAMPLE_RATE = model.preprocessor_config.sample_rate
    # warm up: the first pass compiles GPU kernels
    with model.transcribe_stream(context_size=CONTEXT) as s:
        s.add_audio(mx.zeros(SAMPLE_RATE))
        _ = s.result.text


class Utterance:
    """One streaming transcription; every method runs on the MLX thread."""

    def __init__(self):
        self.stream = model.transcribe_stream(context_size=CONTEXT)
        self.stream.__enter__()

    def add(self, pcm: np.ndarray) -> str:
        self.stream.add_audio(mx.array(pcm))
        return self.stream.result.text.strip()

    def finish(self) -> str:
        self.stream.add_audio(mx.zeros(int(SAMPLE_RATE * FLUSH_SECONDS)))
        return self.stream.result.text.strip()

    def close(self):
        self.stream.__exit__(None, None, None)


async def on_mlx(fn, *args):
    return await asyncio.get_running_loop().run_in_executor(MLX, fn, *args)


async def handle(ws: ServerConnection):
    if ws.request.path != "/stream":
        await ws.close(1008, "use /stream")
        return
    async with LOCK:
        queue: asyncio.Queue = asyncio.Queue()

        async def reader():
            try:
                async for msg in ws:
                    if isinstance(msg, bytes):
                        if len(msg) >= 4:
                            await queue.put(np.frombuffer(msg[: len(msg) // 4 * 4], dtype="<f4"))
                    elif msg == "end":
                        break
            finally:
                await queue.put(None)  # end of audio (or the client went away)

        task = asyncio.create_task(reader())
        utt = await on_mlx(Utterance)
        last, t0, audio_s = "", time.perf_counter(), 0.0
        try:
            done = False
            while not done:
                chunks = [await queue.get()]
                while not queue.empty():  # catch up: take everything that arrived meanwhile
                    chunks.append(queue.get_nowait())
                if chunks[-1] is None:
                    done = True
                    chunks.pop()
                if chunks:
                    pcm = np.concatenate(chunks)
                    audio_s += len(pcm) / SAMPLE_RATE
                    text = await on_mlx(utt.add, pcm)
                    if text != last:
                        last = text
                        await ws.send(json.dumps({"type": "partial", "text": text}))
            final = await on_mlx(utt.finish)
            await ws.send(json.dumps({"type": "final", "text": final}))
            print(f"[stt] {audio_s:.1f}s audio · {time.perf_counter() - t0:.1f}s open · “{final[:80]}”", flush=True)
            await ws.close()
        except Exception as e:  # the client left mid-sentence, or decoding failed
            print(f"[stt] stream ended: {e!r}", flush=True)
        finally:
            task.cancel()
            await on_mlx(utt.close)


def process_request(conn: ServerConnection, request: Request):
    if request.path == "/health":
        resp = conn.respond(HTTPStatus.OK, json.dumps({"ok": model is not None, "model": MODEL_ID.split("/")[-1]}))
        del resp.headers["Content-Type"]  # one of each header: Node's fetch rejects duplicates
        resp.headers["Content-Type"] = "application/json"
        return resp
    return None


async def main():
    print(f"[stt] loading {MODEL_ID} (first run downloads ~2.5 GB)…", flush=True)
    t = time.perf_counter()
    await on_mlx(load)
    print(f"[stt] model ready in {time.perf_counter() - t:.1f}s", flush=True)
    async with serve(
        handle,
        "127.0.0.1",
        PORT,
        origins=[LOCAL_ORIGIN, None],  # the app in a local browser, or a local script
        process_request=process_request,
        max_size=4 * 1024 * 1024,
    ) as server:
        print(f"[stt] ready on ws://127.0.0.1:{PORT}/stream", flush=True)
        await server.serve_forever()


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        pass
