import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { storageProvider } from '@/domain/audio/local-storage-provider';

export async function GET(req: NextRequest, { params }: { params: Promise<{ key: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { key } = await params;

  try {
    const buffer = await storageProvider.download(key);
    
    return new Response(buffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch (error) {
    return new Response('Not Found', { status: 404 });
  }
}
