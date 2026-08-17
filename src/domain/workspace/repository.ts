import { db } from '@/lib/db';
import { Prisma } from '@prisma/client';

/**
 * Tenant-aware repository abstraction.
 * All queries should route through here to ensure they are scoped to a workspaceId.
 */
export class WorkspaceRepository {
  constructor(private readonly workspaceId: string) {
    if (!workspaceId) {
      throw new Error('WorkspaceRepository requires a valid workspaceId');
    }
  }

  get projects() {
    return {
      findMany: (args?: Omit<Prisma.ProjectFindManyArgs, 'where'> & { where?: Omit<Prisma.ProjectWhereInput, 'workspaceId'> }) => {
        return db.project.findMany({
          ...args,
          where: { ...args?.where, workspaceId: this.workspaceId },
        });
      },
      findUnique: (args: Prisma.ProjectFindUniqueArgs) => {
        // Find uniquely and then ensure it matches workspaceId
        return db.project.findFirst({
          where: { ...args.where, workspaceId: this.workspaceId },
          include: args.include,
          select: args.select as any,
        });
      },
      create: (args: Omit<Prisma.ProjectCreateArgs, 'data'> & { data: Omit<Prisma.ProjectCreateInput, 'workspace'> }) => {
        return db.project.create({
          ...args,
          data: {
            ...args.data,
            workspace: { connect: { id: this.workspaceId } },
          },
        });
      },
      // ... update, delete etc.
    };
  }

  get audioAssets() {
    return {
      findMany: (args?: Omit<Prisma.AudioAssetFindManyArgs, 'where'> & { where?: Omit<Prisma.AudioAssetWhereInput, 'workspaceId'> }) => {
        return db.audioAsset.findMany({
          ...args,
          where: { ...args?.where, workspaceId: this.workspaceId },
        });
      },
      create: (args: Omit<Prisma.AudioAssetCreateArgs, 'data'> & { data: Omit<Prisma.AudioAssetCreateInput, 'workspace'> }) => {
        return db.audioAsset.create({
          ...args,
          data: {
            ...args.data,
            workspace: { connect: { id: this.workspaceId } },
          },
        });
      },
      // ... update, delete etc.
    };
  }

  get jobs() {
    return {
      findMany: (args?: Omit<Prisma.ProcessingJobFindManyArgs, 'where'> & { where?: Omit<Prisma.ProcessingJobWhereInput, 'workspaceId'> }) => {
        return db.processingJob.findMany({
          ...args,
          where: { ...args?.where, workspaceId: this.workspaceId },
        });
      },
      create: (args: Omit<Prisma.ProcessingJobCreateArgs, 'data'> & { data: Omit<Prisma.ProcessingJobCreateInput, 'workspace'> }) => {
        return db.processingJob.create({
          ...args,
          data: {
            ...args.data,
            workspace: { connect: { id: this.workspaceId } },
          },
        });
      },
      update: (args: Prisma.ProcessingJobUpdateArgs) => {
        // Enforce update only applies to this workspace
        return db.processingJob.update({
          ...args,
          where: { ...args.where, workspaceId: this.workspaceId } as any, // TypeScript generic safety workaround
        });
      }
      // ... etc.
    };
  }
}
