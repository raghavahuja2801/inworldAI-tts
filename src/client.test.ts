import { InworldTTS, SpeakOptions, SUPPORTED_VOICES, SUPPORTED_FORMATS } from './client';

describe('InworldTTS Client', () => {
  const TEST_API_KEY = 'test-api-key';
  let client: InworldTTS;

  beforeEach(() => {
    client = new InworldTTS(TEST_API_KEY);
  });

  test('constructor throws if apiKey is missing', () => {
    expect(() => new InworldTTS('')).toThrow('InworldTTS: apiKey is required');
  });

  test('speak throws if text is empty', async () => {
    await expect(client.speak('', {})).rejects.toThrow('InworldTTS.speak: text is required');
  });

  test('speak throws on unsupported voiceId', async () => {
    const opts: SpeakOptions = { voiceId: 'Nonexistent' as any };
    await expect(client.speak('hello', opts)).rejects.toThrow(/Unsupported voiceId/);
  });

  test('speak throws on unsupported language', async () => {
    const opts: SpeakOptions = { language: 'xx' as any };
    await expect(client.speak('hello', opts)).rejects.toThrow(/Unsupported language/);
  });

  test('speak throws on unsupported modelId', async () => {
    const opts: SpeakOptions = { modelId: 'bad-model' as any };
    await expect(client.speak('hello', opts)).rejects.toThrow(/Unsupported modelId/);
  });

  test('speak throws on unsupported format', async () => {
    const opts: SpeakOptions = { format: 'flac' as any };
    await expect(client.speak('hello', opts)).rejects.toThrow(/Unsupported format/);
  });

  test('speak throws on sampleRateHertz out of range', async () => {
    await expect(client.speak('hello', { sampleRateHertz: 7000 })).rejects.toThrow(/sampleRateHertz must be between 8000 and 48000/);
    await expect(client.speak('hello', { sampleRateHertz: 50000 })).rejects.toThrow(/sampleRateHertz must be between 8000 and 48000/);
  });

  describe('when fetch returns a valid response', () => {
    const FAKE_BASE64 = Buffer.from('dummy audio').toString('base64');

    beforeEach(() => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ audioContent: FAKE_BASE64 }),
      });
    });

    afterEach(() => {
      jest.resetAllMocks();
    });

    test('speak returns a Buffer of decoded audioContent', async () => {
      const buf = await client.speak('hello');
      expect(Buffer.isBuffer(buf)).toBe(true);
      expect(buf.toString()).toBe('dummy audio');
      expect(fetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('speakScript', () => {
    beforeEach(() => {
      // stub speak to return a Buffer of the line text for simplicity
      jest.spyOn(client, 'speak').mockImplementation(async (text) => Buffer.from(text));
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    test('stitched buffer equals concatenated line buffers with pause buffers', async () => {
      const speakers = [{ name: 'A', options: { voiceId: SUPPORTED_VOICES[0] } }];
      const script = [
        { name: 'A', line: 'first' },
        { name: 'A', line: 'second' }
      ];
      const pauseMs = 0; // uses empty buffer
      const result = await client.speakScript(speakers, script, pauseMs);
      const expected = Buffer.concat([
        Buffer.from('first'),
        Buffer.alloc(0),
        Buffer.from('second'),
        Buffer.alloc(0)
      ]);
      expect(result).toEqual(expected);
      expect(client.speak).toHaveBeenCalledTimes(2);
    });

    test('speakScript throws if speaker not found', async () => {
      const script = [{ name: 'Unknown', line: 'hi' }];
      await expect(client.speakScript([], script)).rejects.toThrow(/No options for speaker 'Unknown'/);
    });
  });
});
