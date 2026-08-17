import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { transcriptionQueue } from '@/lib/queue';

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { audioAssetId, workspaceId } = body;

    if (!workspaceId) {
      return NextResponse.json({ error: 'workspaceId required' }, { status: 400 });
    }

    const member = await db.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId: session.user.id,
          workspaceId: workspaceId,
        }
      },
    });

    if (!member) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    if (!audioAssetId) {
      return NextResponse.json({ error: 'audioAssetId required' }, { status: 400 });
    }

    // Verify audio asset belongs to workspace
    const asset = await db.audioAsset.findFirst({
      where: { id: audioAssetId, workspaceId: member.workspaceId },
    });

    if (!asset) {
      return NextResponse.json({ error: 'Audio asset not found' }, { status: 404 });
    }

    // Create the job record in DB
    const job = await db.processingJob.create({
      data: {
        type: 'STT_AI_TTS',
        status: 'PENDING',
        provider: 'mock',
        workspaceId: member.workspaceId,
        sourceAudioId: asset.id,
      },
    });

    // Enqueue the job for STT worker
    await transcriptionQueue.add('transcribe', {
      jobId: job.id,
      workspaceId: member.workspaceId,
      audioAssetId: asset.id,
    });

    return NextResponse.json({ success: true, jobId: job.id }, { status: 201 });

  } catch (error) {
    console.error('Job creation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
