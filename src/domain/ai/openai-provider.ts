import OpenAI from 'openai';
import { AIProvider, AIAnalysisResult } from './provider';
import { ProviderRateLimitError, ProviderAuthError, MalformedOutputError } from '../errors';
import { z } from 'zod';

const aiAnalysisSchema = z.object({
  summary: z.string(),
  actionItems: z.array(z.string()),
  sentiment: z.enum(['positive', 'neutral', 'negative']),
});

export class OpenAIProvider implements AIProvider {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async analyze(transcript: string): Promise<AIAnalysisResult> {
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: `You are an AI assistant that analyzes audio transcripts.
Output a JSON object exactly matching this schema:
{
  "summary": "string - a brief 2-3 sentence summary",
  "actionItems": ["string - action item 1", "string - action item 2"],
  "sentiment": "positive | neutral | negative"
}`
          },
          {
            role: 'user',
            content: `Please analyze this transcript:\n\n${transcript}`
          }
        ]
      });

      const content = response.choices[0]?.message?.content;
      if (!content) throw new Error('Empty response from OpenAI');

      const parsed = JSON.parse(content);
      const validated = aiAnalysisSchema.safeParse(parsed);

      if (!validated.success) {
        throw new MalformedOutputError(`OpenAI returned invalid JSON structure: ${validated.error.message}`);
      }

      return validated.data;
    } catch (error: any) {
      if (error instanceof MalformedOutputError) throw error;
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
    throw new Error(`OpenAI analysis failed: ${error?.message || 'Unknown error'}`);
  }
}
