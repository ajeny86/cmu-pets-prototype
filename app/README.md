# Next.js template

This is a Next.js template with shadcn/ui.

## AI chat (Ollama, runs locally)

Clue's chat (`/chat`) answers with a local model through [Ollama](https://ollama.com). Nothing is sent to the cloud.

```bash
ollama pull qwen3.5:4b
```

```bash
npm run dev
```

- The app talks to Ollama at `http://127.0.0.1:11434` and uses `qwen3.5:4b`. To use another model or address, set them when you start the app, for example `OLLAMA_MODEL=gemma3:4b npm run dev`. The variables are `OLLAMA_MODEL` and `OLLAMA_URL`.
- If Ollama isn't running or the model isn't installed, chat still works with the built-in rule-based replies, and the header says "local AI off".
- The buttons under each reply (Open the report, Shop…) still come from the app's own intent detection, so they always go to the right screen.
- Code: `lib/ai/ollama.ts` (server, prompt), `app/api/clue/route.ts` (streams the reply), `lib/ai/clue-chat.ts` and `app/chat/chat.tsx` (browser).

## AI as a second user: lost & found pets for ChatGPT and Claude

The site has a lost & found pets database (demo data, Lisbon and Porto) that AI assistants can search. You tell ChatGPT or Claude "I lost my small brown dachshund near Estrela this morning". It asks buddy, and answers with how many comparable animals there are, the strongest matches first, with the reasons and links.

- **Database:** `lib/lost-pets/db.ts` holds 34 made-up reports: found, sighted, lost and reunited. Dates are stored as "days ago", so the demo stays fresh. There are no real names, phones or addresses.
- **Matching:** `lib/lost-pets/query.ts` uses the app's Lab 01 rule: colour +2 (look-alike +1), within 2 km +2, same size +1, found within 7 days +1, after 30 days −2. 5 or more points is a strong match, 2 or more is possible. It understands English, Russian and Portuguese ("рыжая собака", "вчера", "Граса").
- **Pages:** `/lost-found/reports` (list with filters) and `/lost-found/reports/{id}`, which the AI links to.

### Connect an AI (needs the public production URL)

- **MCP connector** (ChatGPT developer mode / Claude custom connector): `https://<your-site>/api/mcp`. Tools: `find_matches`, `search`, `fetch`, all read-only.
- **Custom GPT with Actions:** import `https://<your-site>/openapi.json`.
- **Plain HTTP:** `/api/lost-pets/matches?species=dog&colour=brown&size=small&area=Estrela&lost=today`, `/api/lost-pets/search?q=ginger cat`, `/api/lost-pets/F-2101`.
- **Guide for AI crawlers:** `/llms.txt`.
- Links in answers use the address the request came to. Set `SITE_URL` to force one.
- **Locally**, Claude Code can connect already: `claude mcp add --transport http buddy http://localhost:3000/api/mcp`. ChatGPT needs the public URL.

## Voice input (runs locally)

The mic buttons turn speech into text on your computer, using the best engine that's running:

1. **Parakeet (realtime).** NVIDIA Parakeet TDT 0.6B v3 on MLX (Apple Silicon). The words appear in the box *while you speak*. It covers 25 European languages, including Russian, Ukrainian, Portuguese and English, and detects the language itself.
2. **Whisper.** whisper.cpp with large-v3-turbo. It records the phrase, then gives the text about 3 seconds after you stop.
3. **The browser's own speech recognition** (Chrome, Edge, Safari).

### Parakeet: a small local server next to the app

Needs [uv](https://docs.astral.sh/uv/) (`brew install uv`). The first start downloads Python packages and the model (about 2.5 GB, into `~/.cache/huggingface`):

```bash
npm run stt
```

Keep it running beside `npm run dev`. It listens on `ws://127.0.0.1:8765/stream`, and `GET /health` reports its status. Change the port with `STT_PORT`, and point the app at it with `STT_URL` (for the server) and `NEXT_PUBLIC_STT_WS` (for the browser).

### Whisper (fallback)

```bash
brew install whisper-cpp
```

```bash
mkdir -p ~/.cache/whisper && curl -L -o ~/.cache/whisper/ggml-large-v3-turbo-q5_0.bin https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-large-v3-turbo-q5_0.bin
```

To use another model or binary, set `WHISPER_MODEL` (path to a `.bin`) or `WHISPER_BIN`.

### How it behaves

- Tap the mic and talk. It waits through pauses and stops when you tap again, or 2.5 seconds after you finish speaking.
- If Parakeet stops answering, the next tap uses Whisper, and then the browser.
- Code: `stt-server/server.py` (Parakeet), `lib/ai/whisper.ts` and `app/api/transcribe/route.ts` (Whisper and the status check), `lib/ai/speech.ts` (the mic in the browser).

## Adding components

To add components to your app, run the following command:

```bash
npx shadcn@latest add button
```

This will place the ui components in the `components` directory.

## Using components

To use the components in your app, import them as follows:

```tsx
import { Button } from "@/components/ui/button";
```
