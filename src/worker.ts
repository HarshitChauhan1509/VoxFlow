import { Worker, Job } from 'bullmq';
import { redis } from './lib/redis';
import { db } from './lib/db';
import { TranscriptionJobPayload, AIAnalysisJobPayload, TTSJobPayload, aiAnalysisQueue, ttsQueue } from './lib/queue';
import { MockSpeechToTextProvider } from './domain/stt/provider';
import { MockAIProvider } from './domain/ai/provider';
import { MockTextToSpeechProvider } from './domain/tts/provider';
import { storageProvider } from './domain/audio/local-storage-provider';

console.log('Worker started. Listening for jobs...');

const sttProvider = new MockSpeechToTextProvider();
const aiProvider = new MockAIProvider();
const ttsProvider = new MockTextToSpeechProvider();

// Shared status updater
async function updateJobStatus(jobId: string, workspaceId: string, status: any, error?: string) {
  await db.processingJob.update({
    where: { id: jobId, workspaceId },
    data: { status, error, ...(status === 'PROCESSING' ? { startedAt: new Date() } : {}), ...(status === 'COMPLETED' || status === 'FAILED' ? { completedAt: new Date() } : {}) },
  });
  redis.publish(`job-progress:${jobId}`, JSON.stringify({ status, error }));
}

async function isJobTerminal(jobId: string, workspaceId: string) {
  const job = await db.processingJob.findFirst({ where: { id: jobId, workspaceId } });
  return job?.status === 'COMPLETED' || job?.status === 'CANCELLED';
}

// 1. Transcription Worker
const transcriptionWorker = new Worker<TranscriptionJobPayload>(
  'transcription',
  async (job: Job<TranscriptionJobPayload>) => {
    const { jobId, workspaceId, audioAssetId } = job.data;
    if (await isJobTerminal(jobId, workspaceId)) return;
    
    console.log(`[Transcription] Processing job ${jobId}`);
    await updateJobStatus(jobId, workspaceId, 'PROCESSING');

    try {
      const audioAsset = await db.audioAsset.findFirst({
        where: { id: audioAssetId, workspaceId },
      });

      if (!audioAsset) throw new Error('Audio asset not found');

      const buffer = await storageProvider.download(audioAsset.storageKey);
      const transcript = await sttProvider.transcribe(buffer, audioAsset.mimeType);

      await db.processingJob.update({
        where: { id: jobId, workspaceId },
        data: { transcript },
      });

      await aiAnalysisQueue.add('analyze', { jobId, workspaceId, transcript });
    } catch (err: any) {
      console.error(`[Transcription] Failed job ${jobId}`, err);
      await updateJobStatus(jobId, workspaceId, 'FAILED', err.message);
      throw err;
    }
  },
  { connection: redis, concurrency: 5 }
);

// 2. AI Analysis Worker
const aiAnalysisWorker = new Worker<AIAnalysisJobPayload>(
  'ai-analysis',
  async (job: Job<AIAnalysisJobPayload>) => {
    const { jobId, workspaceId, transcript } = job.data;
    if (await isJobTerminal(jobId, workspaceId)) return;
    
    console.log(`[AI Analysis] Processing job ${jobId}`);

    try {
      // Check if already analyzed (idempotency check)
      const existingJob = await db.processingJob.findFirst({ where: { id: jobId, workspaceId } });
      let insights = existingJob?.aiAnalysis as any;

      if (!insights) {
        insights = await aiProvider.analyze(transcript);
        await db.processingJob.update({
          where: { id: jobId, workspaceId },
          data: { aiAnalysis: insights },
        });
      }

      await ttsQueue.add('synthesize', { jobId, workspaceId, text: insights.summary });
    } catch (err: any) {
      console.error(`[AI Analysis] Failed job ${jobId}`, err);
      await updateJobStatus(jobId, workspaceId, 'FAILED', err.message);
      throw err;
    }
  },
  { connection: redis, concurrency: 5 }
);

// 3. TTS Worker
const ttsWorker = new Worker<TTSJobPayload>(
  'tts',
  async (job: Job<TTSJobPayload>) => {
    const { jobId, workspaceId, text } = job.data;
    if (await isJobTerminal(jobId, workspaceId)) return;
    
    console.log(`[TTS] Processing job ${jobId}`);

    try {
      const audioBuffer = await ttsProvider.synthesize(text);
      const filename = `generated-${jobId}.mp3`;
      const storageKey = await storageProvider.upload(audioBuffer, filename, 'audio/mp3');

      await db.processingJob.update({
        where: { id: jobId, workspaceId },
        data: { generatedAudioKey: storageKey },
      });

      await updateJobStatus(jobId, workspaceId, 'COMPLETED');
      console.log(`[TTS] Completed job ${jobId}`);
    } catch (err: any) {
      console.error(`[TTS] Failed job ${jobId}`, err);
      await updateJobStatus(jobId, workspaceId, 'FAILED', err.message);
      throw err;
    }
  },
  { connection: redis, concurrency: 5 }
);

// Graceful shutdown
const shutdown = async () => {
  console.log('Shutting down workers...');
  await Promise.all([
    transcriptionWorker.close(),
    aiAnalysisWorker.close(),
    ttsWorker.close()
  ]);
  await redis.quit();
  await db.$disconnect();
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
