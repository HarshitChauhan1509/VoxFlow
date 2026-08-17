import { Queue } from 'bullmq';
import { redis } from '../redis';

// Define typed payloads for the queues
export interface TranscriptionJobPayload {
  jobId: string;
  workspaceId: string;
  audioAssetId: string;
}

export interface AIAnalysisJobPayload {
  jobId: string;
  workspaceId: string;
  transcript: string;
}

export interface TTSJobPayload {
  jobId: string;
  workspaceId: string;
  text: string;
  voiceId?: string;
}

// Queues
export const transcriptionQueue = new Queue<TranscriptionJobPayload>('transcription', { connection: redis });
export const aiAnalysisQueue = new Queue<AIAnalysisJobPayload>('ai-analysis', { connection: redis });
export const ttsQueue = new Queue<TTSJobPayload>('tts', { connection: redis });
