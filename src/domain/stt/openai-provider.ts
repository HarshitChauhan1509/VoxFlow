import OpenAI from 'openai';
import { SpeechToTextProvider } from './provider';
import { ProviderRateLimitError, ProviderAuthError } from '../errors';

export class OpenAISTTProvider implements SpeechToTextProvider {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async transcribe(audioBuffer: Buffer, mimeType: string): Promise<string> {
    try {
      // Create a native File from Buffer for OpenAI Node SDK
      const file = new File([audioBuffer], `audio${this.getExtension(mimeType)}`, { type: mimeType });

      const response = await this.openai.audio.transcriptions.create({
        file,
        model: 'whisper-1',
        response_format: 'text',
      });

      return response as unknown as string;
    } catch (error: any) {
      this.handleOpenAIError(error);
    }
  }

  private getExtension(mimeType: string): string {
    const map: Record<string, string> = {
      'audio/mpeg': '.mp3',
      'audio/mp3': '.mp3',
      'audio/wav': '.wav',
      'audio/x-wav': '.wav',
      'audio/mp4': '.m4a',
      'audio/x-m4a': '.m4a',
      'audio/webm': '.webm',
    };
    return map[mimeType] || '.bin';
  }

  private handleOpenAIError(error: any): never {
    if (error?.status === 429) {
      throw new ProviderRateLimitError('OpenAI rate limit exceeded');
    }
    if (error?.status === 401) {
      throw new ProviderAuthError('OpenAI authentication failed');
    }
    throw new Error(`OpenAI transcription failed: ${error?.message || 'Unknown error'}`);
  }
}
