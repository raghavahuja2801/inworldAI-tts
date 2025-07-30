#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { InworldTTS, SpeakOptions, SupportedVoice } from './client';

// Simple CLI parser (no extra deps)
const argv = process.argv.slice(2);
if (argv.length < 2 || argv[0] !== 'speak') {
  console.error('Usage: npx inworld-tts speak "<text>" [--voice <voice>] [--out <file>] [--format <fmt>] [--rate <hz>] [--bitrate <kbps>] [--depth <bits>]');
  process.exit(1);
}

const command = argv.shift();
const text = argv.shift()!;
let voice: SupportedVoice | undefined;
let outFile = 'output.mp3';
let format: string | undefined;
let sampleRate: number | undefined;
let bitRate: number | undefined;
let bitDepth: number | undefined;

for (let i = 0; i < argv.length; i++) {
  const arg = argv[i];
  switch (arg) {
    case '--voice': case '-v':
      voice = argv[++i] as SupportedVoice;
      break;
    case '--out': case '-o':
      outFile = argv[++i]!;
      break;
    case '--format':
      format = argv[++i]!;
      break;
    case '--rate':
      sampleRate = parseInt(argv[++i]!, 10);
      break;
    case '--bitrate':
      bitRate = parseInt(argv[++i]!, 10);
      break;
    case '--depth':
      bitDepth = parseInt(argv[++i]!, 10);
      break;
    default:
      console.warn(`Unknown option: ${arg}`);
  }
}

async function main() {
  const apiKey = process.env.INWORLD_API_KEY;
  if (!apiKey) {
    console.error('Error: INWORLD_API_KEY environment variable is required.');
    process.exit(1);
  }

  const tts = new InworldTTS(apiKey);
  const opts: SpeakOptions = {};
  if (voice) opts.voiceId = voice;
  if (format) opts.format = format as any;
  if (sampleRate) opts.sampleRateHertz = sampleRate;
  if (bitRate) opts.bitRate = bitRate;
  if (bitDepth) opts.bitDepth = bitDepth;

  console.log('Generating speech...');
  try {
    const audio = await tts.speak(text, opts);
    const outPath = path.resolve(process.cwd(), outFile);
    fs.writeFileSync(outPath, audio);
    console.log(`Saved to ${outPath}`);
  } catch (err: any) {
    console.error('Error:', err.message || err);
    process.exit(1);
  }
}

main();