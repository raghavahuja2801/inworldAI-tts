# inworld‑tts

**inworld‑tts** is a lightweight TypeScript/JavaScript client (plus CLI) for InworldAI’s Text‑to‑Speech API. It makes it easy to:

* Authenticate with a single API key
* Generate speech from text in one call (`speak()`)
* Stream audio chunks in real time (`speakStream()`, CLI `--stream`)
* Stitch together multi‑speaker dialogues (`speakScript()`)
* Customize format, sample‑rate, bit‑rate, pitch, speed, and more

---

## 🚀 Installation

```bash
npm install inworld‑tts buffer
```

> **Note:** We polyfill Node’s `Buffer` in the browser via the `buffer` package.

---

## 🔑 Setup

Make sure your InworldAI key is available:

```bash
export INWORLD_API_KEY="Basic YOUR_BASE64_KEY"
```

If you embed in a React/Vite app for local POC, you can use:

```bash
npm install buffer
```

```js
// index.tsx (or App.tsx)
import { Buffer } from 'buffer';
window.Buffer = Buffer;
```

---

## 📦 API Reference

```ts
import { InworldTTS, SpeakOptions } from 'inworld‑tts';

const tts = new InworldTTS(process.env.INWORLD_API_KEY!);

// 1) Simple speak
const buffer: Buffer = await tts.speak(
  'Hello world!',
  { voiceId: 'Ashley', format: 'mp3', sampleRateHertz: 24000 }
);

// 2) Streaming chunks in real time
for await (const chunk of tts.speakStream('Streaming text…', {
  voiceId: 'Ashley', format: 'opus'
})) {
  // e.g. pipe to a MediaSource or write to file
  console.log('Got chunk:', chunk.length);
}

// 3) Multi‑speaker script
const dialogue = await tts.speakScript(
  [
    { name: 'Alice', options: { voiceId: 'Ashley' } },
    { name: 'Bob',   options: { voiceId: 'Craig', pitch: 1.2 } },
  ],
  [
    { name: 'Alice', line: 'Hi Bob, how are you?' },
    { name: 'Bob',   line: "I'm good, thanks!" },
  ],
  300 // 300ms pause between lines
);
fs.writeFileSync('dialogue.wav', dialogue);
```

---

## 💻 CLI Usage

After building and installing globally (or via `npx`), you have:

```bash
# Basic speak:
npx inworld‑tts speak "Hello world" --voice Ashley --out hello.mp3

# Custom format & sample rate:
npx inworld‑tts speak "Test" --voice Craig --format wav --rate 16000 --out test.wav

# Real‑time streaming (writes chunks as they arrive):
npx inworld‑tts speak "Streaming now" --voice Ashley --stream --out stream.mp3
```

**Options:**

| Flag        | Description                                   | Default       |
| ----------- | --------------------------------------------- | ------------- |
| `--voice`   | Voice ID (e.g. `Ashley`, `Craig`)             | —             |
| `--format`  | `mp3` \| `wav` \| `opus` \| `mulaw` \| `alaw` | `mp3`         |
| `--rate`    | Sample rate in Hz (8,000–48,000)              | voice default |
| `--bitrate` | Bit rate in kbps (for compressed formats)     | 128           |
| `--depth`   | Bit depth (for `wav` / PCM)                   | 16            |
| `--out, -o` | Output file path                              | `output.mp3`  |
| `--stream`  | Stream mode: write chunks as they arrive      | off           |

---

## 🌐 Browser / React

You **can** call the client directly in a React app once you polyfill `Buffer`. For POC only:

```bash
npm install inworld‑tts buffer
```

```ts
// App.tsx
import React, { useEffect } from 'react';
import { Buffer } from 'buffer';
import { InworldTTS } from 'inworld‑tts';

window.Buffer = Buffer;

export default function App() {
  useEffect(() => {
    async function demo() {
      const tts = new InworldTTS(process.env.REACT_APP_INWORLD_KEY!);
      const buf = await tts.speak('Hello from React!', { voiceId: 'Ashley' });
      const blob = new Blob([buf], { type: 'audio/mp3' });
      new Audio(URL.createObjectURL(blob)).play();
    }
    demo();
  }, []);

  return <h1>inworld‑tts Demo</h1>;
}
```

---

## 🤝 Contributing

Feel free to open issues or PRs to improve the client, add new endpoints (e.g. `/tts/v1/voice:stream`), or enhance the CLI.

---

## 📜 License

MIT © Raghav Ahuja