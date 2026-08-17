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
const defaultJobOptions = {
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 2000,
  },
  removeOnComplete: true,
  removeOnFail: false,
};

export const transcriptionQueue = new Queue<TranscriptionJobPayload>('transcription', { connection: redis, defaultJobOptions });
export const aiAnalysisQueue = new Queue<AIAnalysisJobPayload>('ai-analysis', { connection: redis, defaultJobOptions });
export const ttsQueue = new Queue<TTSJobPayload>('tts', { connection: redis, defaultJobOptions });
