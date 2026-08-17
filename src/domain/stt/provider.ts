export interface SpeechToTextProvider {
  /**
   * Transcribes audio into text.
   */
  transcribe(audioBuffer: Buffer, mimeType: string): Promise<string>;
}

export class MockSpeechToTextProvider implements SpeechToTextProvider {
  async transcribe(audioBuffer: Buffer, mimeType: string): Promise<string> {
    // Simulate delay
    await new Promise((resolve) => setTimeout(resolve, 2000));
    
    return "This is a mock transcription of the uploaded audio file. It represents a successful speech-to-text operation.";
  }
}
