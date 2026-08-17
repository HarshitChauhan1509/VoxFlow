export interface TextToSpeechProvider {
  /**
   * Synthesizes text into audio.
   * Returns a buffer representing an audio file (e.g., MP3).
   */
  synthesize(text: string, voiceId?: string): Promise<Buffer>;
}

export class MockTextToSpeechProvider implements TextToSpeechProvider {
  async synthesize(text: string, voiceId?: string): Promise<Buffer> {
    // Simulate delay
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Return a dummy buffer
    return Buffer.from("mock-audio-data", "utf-8");
  }
}
