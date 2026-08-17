import { describe, it, expect, vi } from 'vitest';
import { WorkspaceRepository } from './repository';
import { db } from '@/lib/db';

// Mock the db client
vi.mock('@/lib/db', () => ({
  db: {
    project: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
    audioAsset: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
    processingJob: {
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    }
  }
}));

describe('WorkspaceRepository', () => {
  it('throws an error if instantiated without workspaceId', () => {
    expect(() => new WorkspaceRepository('')).toThrow('WorkspaceRepository requires a valid workspaceId');
  });

  describe('projects', () => {
    it('appends workspaceId to findMany queries', async () => {
      const repo = new WorkspaceRepository('ws-123');
      
      await repo.projects.findMany({ where: { name: 'Test' } });
      
      expect(db.project.findMany).toHaveBeenCalledWith({
        where: { name: 'Test', workspaceId: 'ws-123' }
      });
    });

    it('injects workspace connect on create', async () => {
      const repo = new WorkspaceRepository('ws-123');
      
      await repo.projects.create({ data: { name: 'New Project' } });
      
      expect(db.project.create).toHaveBeenCalledWith({
        data: {
          name: 'New Project',
          workspace: { connect: { id: 'ws-123' } }
        }
      });
    });
  });

  describe('audioAssets', () => {
    it('injects workspace connect on create', async () => {
      const repo = new WorkspaceRepository('ws-123');
      
      await repo.audioAssets.create({ 
        data: { 
          filename: 'test.mp3', 
          mimeType: 'audio/mp3', 
          sizeBytes: 1024, 
          storageKey: 'key' 
        } 
      });
      
      expect(db.audioAsset.create).toHaveBeenCalledWith({
        data: {
          filename: 'test.mp3', 
          mimeType: 'audio/mp3', 
          sizeBytes: 1024, 
          storageKey: 'key',
          workspace: { connect: { id: 'ws-123' } }
        }
      });
    });
  });
});
