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

## Voice input (Whisper, runs locally)

The mic buttons turn speech into text with [whisper.cpp](https://github.com/ggml-org/whisper.cpp) on your computer. It handles Russian, English and Portuguese and detects the language itself.

```bash
brew install whisper-cpp
```

```bash
mkdir -p ~/.cache/whisper && curl -L -o ~/.cache/whisper/ggml-large-v3-turbo-q5_0.bin https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-large-v3-turbo-q5_0.bin
```

- Tap the mic and talk. It waits through pauses and stops when you tap again, or 2.5 seconds after you finish speaking. The text then goes into the box.
- To use another model or binary, set `WHISPER_MODEL` (path to a `.bin`) or `WHISPER_BIN`.
- Without whisper.cpp, the mic uses the browser's own speech recognition (Chrome, Edge, Safari).
- Code: `lib/ai/whisper.ts` and `app/api/transcribe/route.ts` (server), `lib/ai/speech.ts` (recording in the browser).

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
