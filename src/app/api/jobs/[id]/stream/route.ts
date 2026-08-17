import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { Redis } from 'ioredis';

const redisHost = process.env.REDIS_HOST || 'localhost';
const redisPort = parseInt(process.env.REDIS_PORT || '6379', 10);

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { id } = await params;

  // Find the job first to know its workspace
  const job = await db.processingJob.findUnique({
    where: { id },
    select: { id: true, workspaceId: true, status: true, error: true }
  });

  if (!job) {
    return new Response('Not Found', { status: 404 });
  }

  // Verify access to the job's workspace
  const member = await db.workspaceMember.findUnique({
    where: { userId_workspaceId: { userId: session.user.id, workspaceId: job.workspaceId } },
  });

  if (!member) {
    return new Response('Forbidden', { status: 403 });
  }

  const stream = new ReadableStream({
    async start(controller) {
      // Send initial state
      controller.enqueue(`data: ${JSON.stringify({ status: job.status, error: job.error })}\n\n`);

      if (job.status === 'COMPLETED' || job.status === 'FAILED' || job.status === 'CANCELLED') {
        controller.close();
        return;
      }

      // Create a dedicated Redis connection for this subscriber
      const subscriber = new Redis({
        host: redisHost,
        port: redisPort,
      });

      const channel = `job-progress:${id}`;
      await subscriber.subscribe(channel);

      // Heartbeat to prevent proxy timeouts
      const interval = setInterval(() => {
        try {
          controller.enqueue(`: heartbeat\n\n`);
        } catch {
          // If enqueue fails, client disconnected
          cleanup();
        }
      }, 15000);

      const cleanup = () => {
        clearInterval(interval);
        subscriber.unsubscribe(channel);
        subscriber.quit();
        try { controller.close(); } catch {}
      };

      subscriber.on('message', (chan, message) => {
        if (chan === channel) {
          controller.enqueue(`data: ${message}\n\n`);
          const parsed = JSON.parse(message);
          if (parsed.status === 'COMPLETED' || parsed.status === 'FAILED') {
            cleanup();
          }
        }
      });

      req.signal.addEventListener('abort', cleanup);
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
