import { db } from '@/lib/db';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { UploadClient } from './upload-client';

export default async function UploadPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const member = await db.workspaceMember.findFirst({
    where: { userId: session.user.id }
  });

  if (!member) {
    return <div>No active workspace found.</div>;
  }

  return (
    <div className="max-w-2xl mx-auto mt-8">
      <div className="md:flex md:items-center md:justify-between mb-6">
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
            Upload Audio
          </h2>
        </div>
      </div>

      <UploadClient workspaceId={member.workspaceId} />
    </div>
  );
}
