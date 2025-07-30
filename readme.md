# Inworld TTS

A simple Node.js client and CLI for Inworld AI Text-to-Speech (TTS).

## Features

* **Easy setup**: Just supply your API key.
* **Flexible output**: Supports MP3, WAV (PCM), Opus, μ-law, and A-law.
* **Configurable audio**: Control sample rate, bit rate, and bit depth.
* **Multi‑speaker scripts**: Stitch together dialogues with customizable pauses.
* **Zero‑dependency CLI**: Quickly generate speech from the command line.

## Installation

```bash
npm install inworld-tts
```

Or use it on-the-fly without global install:

```bash
npx inworld-tts speak "Hello, world!" --voice Ashley --out hello.mp3
```

## Usage

### Importing the client

```ts
import { InworldTTS } from 'inworld-tts';

const apiKey = process.env.INWORLD_API_KEY!;
const tts = new InworldTTS(apiKey);

// Single utterance
const audioBuffer = await tts.speak('Hello, world!', {
  voiceId: 'Ashley',      // see SUPPORTED_VOICES
  format: 'wav',          // mp3, wav, opus, mulaw, alaw
  sampleRateHertz: 16000,
  bitDepth: 16,
});

// Save to file
import fs from 'fs';
fs.writeFileSync('hello.wav', audioBuffer);
```

### Multi‑speaker scripts

```ts
const speakers = [
  { name: 'Alice', options: { voiceId: 'Alex' } },
  { name: 'Bob',   options: { voiceId: 'Craig' } },
];
const script = [
  { name: 'Alice', line: 'Hi Bob!' },
  { name: 'Bob',   line: 'Hey Alice, how are you?' },
];

const dialogue = await tts.speakScript(speakers, script, 300);
fs.writeFileSync('dialogue.mp3', dialogue);
```

## CLI

Once installed, the `inworld-tts` command is available:

```bash
# Basic
npx inworld-tts speak "Text to say" --voice Ashley --out output.mp3

# With audio settings
npx inworld-tts \
  speak "Low-latency WAV" \
  --voice Ashley \
  --format wav \
  --rate 8000 \
  --depth 16 \
  --out speech.wav
```

| Flag          | Description                                |
| ------------- | ------------------------------------------ |
| `--voice, -v` | Voice ID (see SUPPORTED\_VOICES)           |
| `--out, -o`   | Output filename (default: `output.mp3`)    |
| `--format`    | mp3, wav, opus, mulaw, alaw (default: mp3) |
| `--rate`      | Sample rate in Hz (8k–48k)                 |
| `--bitrate`   | Bit rate in kbps (compressed formats)      |
| `--depth`     | Bit depth (for WAV/PCM, e.g., 16)          |

## Supported Voices & Formats

* **Voices**: See `SUPPORTED_VOICES` in the code for the full list (e.g., Ashley, Alex, etc.).
* **Formats**: `mp3`, `wav`, `opus`, `mulaw`, `alaw`.

## Testing

This project uses [Jest](https://jestjs.io/) for unit tests.

```bash
npm test
```

## Contributing

1. Fork the repo
2. Create a feature branch
3. Run `npm install`
4. Make your changes
5. Build with `npm run build`
6. Run tests `npm test`
7. Submit a pull request

---

MIT © Raghav Ahuja
