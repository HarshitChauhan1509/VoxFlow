import { db } from '@/lib/db';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { JobClient } from './job-client';

export default async function JobDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const { id } = await params;

  const member = await db.workspaceMember.findFirst({
    where: { userId: session.user.id }
  });

  if (!member) redirect('/dashboard');

  const job = await db.processingJob.findUnique({
    where: { id, workspaceId: member.workspaceId },
    include: { sourceAudio: true }
  });

  if (!job) {
    return (
      <div className="max-w-4xl mx-auto mt-8 p-6 bg-red-50 text-red-700 rounded-lg">
        Job not found or access denied.
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto mt-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Job Details: {job.id}</h2>
        <p className="text-gray-500">Source Audio: {job.sourceAudio?.filename || 'Unknown'}</p>
      </div>

      <JobClient initialJob={job} />
    </div>
  );
}
