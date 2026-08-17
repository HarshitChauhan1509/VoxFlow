import OpenAI from 'openai';
import { TextToSpeechProvider } from './provider';
import { ProviderRateLimitError, ProviderAuthError } from '../errors';

export class OpenAITTSProvider implements TextToSpeechProvider {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async synthesize(text: string, voiceId?: string): Promise<Buffer> {
    try {
      const response = await this.openai.audio.speech.create({
        model: 'tts-1',
        voice: (voiceId as any) || 'alloy',
        input: text,
      });

      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch (error: any) {
      this.handleOpenAIError(error);
    }
  }

  private handleOpenAIError(error: any): never {
    if (error?.status === 429) {
      throw new ProviderRateLimitError('OpenAI rate limit exceeded');
    }
    if (error?.status === 401) {
      throw new ProviderAuthError('OpenAI authentication failed');
    }
    throw new Error(`OpenAI TTS failed: ${error?.message || 'Unknown error'}`);
  }
}
