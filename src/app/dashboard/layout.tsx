import { auth, signOut } from '@/auth';
import { db } from '@/lib/db';
import { redirect } from 'next/navigation';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  // Determine user's active workspace (for simplicity, we grab the first one they are a member of)
  // In a real app, you'd store activeWorkspaceId in session or URL path (e.g., /w/[workspaceId]/...)
  const member = await db.workspaceMember.findFirst({
    where: { userId: session.user.id },
    include: { workspace: true },
  });

  if (!member) {
    // User has no workspaces, edge case
    return <div>No workspace found. Please contact support.</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <header className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex justify-between h-16 items-center">
          <h1 className="text-xl font-bold text-gray-900">
            VoxFlow - {member.workspace.name}
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{session.user.email} ({member.role})</span>
            <form action={async () => {
              'use server';
              await signOut();
            }}>
              <button type="submit" className="text-sm text-red-600 hover:text-red-800">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="flex-1 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 w-full">
        {children}
      </main>
    </div>
  );
}
