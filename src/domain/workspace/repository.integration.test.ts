import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WorkspaceRepository } from './repository';
import { db } from '@/lib/db';

vi.mock('@/lib/db', () => ({
  db: {
    processingJob: {
      findFirst: vi.fn(),
      update: vi.fn(),
    }
  }
}));

describe('WorkspaceRepository Security (IDOR)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('prevents update of a job not belonging to the workspace', async () => {
    const repo = new WorkspaceRepository('ws-1');
    
    vi.mocked(db.processingJob.findFirst).mockResolvedValue(null);

    await expect(
      repo.jobs.update({ where: { id: 'job-from-ws-2' }, data: { status: 'COMPLETED' } })
    ).rejects.toThrow('Record not found or not in workspace');

    expect(db.processingJob.findFirst).toHaveBeenCalledWith({
      where: { id: 'job-from-ws-2', workspaceId: 'ws-1' },
      select: { id: true }
    });
    
    expect(db.processingJob.update).not.toHaveBeenCalled();
  });

  it('allows update of a job belonging to the workspace', async () => {
    const repo = new WorkspaceRepository('ws-1');
    
    vi.mocked(db.processingJob.findFirst).mockResolvedValue({ id: 'job-from-ws-1' } as any);
    vi.mocked(db.processingJob.update).mockResolvedValue({ id: 'job-from-ws-1', status: 'COMPLETED' } as any);

    const result = await repo.jobs.update({ where: { id: 'job-from-ws-1' }, data: { status: 'COMPLETED' } });

    expect(result.status).toBe('COMPLETED');
    expect(db.processingJob.update).toHaveBeenCalledWith({
      where: { id: 'job-from-ws-1' },
      data: { status: 'COMPLETED' }
    });
  });
});
