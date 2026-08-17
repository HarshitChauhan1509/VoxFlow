import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { storageProvider } from '@/domain/audio/local-storage-provider';
import { WorkspaceRepository } from '@/domain/workspace/repository';

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB
const ALLOWED_MIME_TYPES = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav', 'audio/mp4', 'audio/x-m4a', 'audio/webm'];

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const workspaceId = formData.get('workspaceId') as string | null;

    if (!workspaceId) {
      return NextResponse.json({ error: 'Workspace ID required' }, { status: 400 });
    }

    // Verify explicit workspace membership
    const member = await db.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId: session.user.id,
          workspaceId: workspaceId,
        }
      },
    });

    if (!member) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const workspaceRepo = new WorkspaceRepository(member.workspaceId);

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File exceeds 25MB limit' }, { status: 400 });
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'Unsupported file type. Use MP3, WAV, M4A, or WEBM.' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const storageKey = await storageProvider.upload(buffer, file.name, file.type);

    const audioAsset = await workspaceRepo.audioAssets.create({
      data: {
        filename: file.name,
        mimeType: file.type,
        sizeBytes: file.size,
        storageKey,
      },
    });

    return NextResponse.json({ success: true, audioAsset }, { status: 201 });
  } catch (error) {
    console.error('Audio upload error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
