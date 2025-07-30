import { Buffer } from 'buffer';

/**
 * Supported ISO language codes for Inworld TTS models:
 * en, es, fr, ko, nl, zh, de, it, ja, pl, pt
 */
export const SUPPORTED_LANGUAGES = [
  'en','es','fr','ko','nl','zh','de','it','ja','pl','pt'
] as const;
export type LanguageCode = typeof SUPPORTED_LANGUAGES[number];

/**
 * Supported Inworld TTS model IDs:
 * - inworld-tts-1
 * - inworld-tts-1-max
 */
export const SUPPORTED_MODELS = ['inworld-tts-1','inworld-tts-1-max'] as const;
export type SupportedModel = typeof SUPPORTED_MODELS[number];

/**
 * Supported Inworld TTS voice IDs
 */
export const SUPPORTED_VOICES = [
  'Alain','Alex','Ashley','Asuka','Craig','Deborah','Dennis','Diego','Dominus',
  'Edward','Elizabeth','Erik','Étienne','Gianni','Hades','Heitor','Hélène',
  'Hyunwoo','Jing','Johanna','Josef','Julia','Katrien','Lennart','Lore',
  'Lupita','Maitê','Mark','Mathieu','Miguel','Minji','Olivia','Orietta',
  'Pixie','Priya','Rafael','Ronald','Sarah','Satoshi','Seojun','Shaun',
  'Szymon','Theodore','Timothy','Wendy','Wojciech','Xiaoyin','Xinyi','Yichen','Yoona'
] as const;
export type SupportedVoice = typeof SUPPORTED_VOICES[number];

/**
 * Supported audio output formats via Inworld API
 */
export const SUPPORTED_FORMATS = [
  'mp3','wav','opus','mulaw','alaw'
] as const;
export type SupportedFormat = typeof SUPPORTED_FORMATS[number];

/**
 * Options for the speak() method
 */
export interface SpeakOptions {
  /** Voice identifier as defined by Inworld */
  voiceId?: SupportedVoice;
  /** ISO language code, e.g., 'en' */
  language?: LanguageCode;
  /** TTS model to use, e.g., 'inworld-tts-1' */
  modelId?: SupportedModel;
  /** Temperature (0.6–1.0), controls randomness */
  temperature?: number;
  /** Speaking rate (0.5–1.5, default=1.0) */
  speed?: number;
  /** Pitch adjustment (-5.0–5.0, default=0) */
  pitch?: number;
  /** Output format (mp3,wav,opus,mulaw,alaw) */
  format?: SupportedFormat;
  /** Sample rate in Hz (8000–48000) */
  sampleRateHertz?: number;
  /** Bit rate in kbps (for compressed formats) */
  bitRate?: number;
  /** Bit depth (for WAV/PCM), e.g., 16 */
  bitDepth?: number;
}

/**
 * Inworld TTS client using native fetch
 */
export class InworldTTS {
  private baseUrl: string;
  private defaultModel: SupportedModel = 'inworld-tts-1';

  /**
   * Create a new InworldTTS instance
   */
  constructor(
    private apiKey: string,
    baseUrl = 'https://api.inworld.ai/tts/v1/voice'
  ) {
    if (!apiKey) throw new Error('InworldTTS: apiKey is required');
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  /**
   * Convert text to speech with flexible output settings
   */
  async speak(text: string, options: SpeakOptions = {}): Promise<Buffer> {
    if (!text) throw new Error('InworldTTS.speak: text is required');

    // Validate voiceId
    if (options.voiceId && !SUPPORTED_VOICES.includes(options.voiceId)) {
      throw new Error(
        `Unsupported voiceId '${options.voiceId}'. Supported: ${SUPPORTED_VOICES.join(', ')}`
      );
    }
    // Validate language
    if (options.language && !SUPPORTED_LANGUAGES.includes(options.language)) {
      throw new Error(
        `Unsupported language '${options.language}'. Supported: ${SUPPORTED_LANGUAGES.join(', ')}`
      );
    }
    // Validate model
    const model = options.modelId ?? this.defaultModel;
    if (!SUPPORTED_MODELS.includes(model)) {
      throw new Error(
        `Unsupported modelId '${model}'. Supported: ${SUPPORTED_MODELS.join(', ')}`
      );
    }
    // Validate format
    const format = options.format ?? 'mp3';
    if (!SUPPORTED_FORMATS.includes(format)) {
      throw new Error(
        `Unsupported format '${format}'. Supported: ${SUPPORTED_FORMATS.join(', ')}`
      );
    }
    // Validate sample rate
    if (
      options.sampleRateHertz != null &&
      (options.sampleRateHertz < 8000 || options.sampleRateHertz > 48000)
    ) {
      throw new Error('sampleRateHertz must be between 8000 and 48000');
    }

    // Build request payload
    const payload: Record<string, any> = { text, modelId: model };
    if (options.voiceId) payload.voiceId = options.voiceId;
    if (options.temperature != null) payload.temperature = options.temperature;
    if (options.speed != null) payload.speed = options.speed;
    if (options.pitch != null) payload.pitch = options.pitch;
    payload.format = format;
    if (options.sampleRateHertz != null) payload.sampleRateHertz = options.sampleRateHertz;
    if (options.bitRate != null) payload.bitRate = options.bitRate;
    if (options.bitDepth != null) payload.bitDepth = options.bitDepth;

    const res = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`InworldTTS error ${res.status}: ${errText}`);
    }

    const data = await res.json();
    if (!data.audioContent) throw new Error('No audioContent in response');
    return Buffer.from(data.audioContent, 'base64');
  }

  /**
   * Generate multi-speaker dialogue audio by stitching individual lines
   */
  async speakScript(
    speakers: { name: string; options: SpeakOptions }[],
    script: { name: string; line: string }[],
    pauseMs: number = 500
  ): Promise<Buffer> {
    const speakerMap = new Map<string, SpeakOptions>(
      speakers.map(s => [s.name, s.options])
    );
    const buffers: Buffer[] = [];
    for (const seg of script) {
      const opts = speakerMap.get(seg.name);
      if (!opts) throw new Error(`No options for speaker '${seg.name}'`);
      const lineBuf = await this.speak(seg.line, opts);
      buffers.push(lineBuf);
      if (pauseMs > 0) buffers.push(Buffer.alloc(0));
    }
    return Buffer.concat(buffers);
  }
}
