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
