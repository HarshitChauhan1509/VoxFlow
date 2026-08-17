# VoxFlow

VoxFlow is a production-oriented AI voice workspace built to demonstrate modern full-stack engineering, asynchronous background processing, tenant isolation, and AI-assisted development.

## Product Overview
VoxFlow allows users to:
1. **Upload audio files** (MP3, WAV, M4A, WEBM)
2. **Process audio** through a Speech-to-Text pipeline
3. **Analyze transcripts** using AI for summaries and action items
4. **Generate synthetic voice** (Text-to-Speech)
5. **Stream progress** in real-time via Server-Sent Events

## Architecture
- **Frontend / Backend**: Next.js (App Router), React, Tailwind CSS
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Auth.js (NextAuth.js) with Argon2id for password hashing
- **Job Queues**: BullMQ + Redis for background processing
- **Tenant Isolation**: Rigidly enforced `WorkspaceRepository` pattern

See `docs/architecture.md` and the ADRs in `docs/` for more detailed architectural decisions.

## Local Setup

1. **Prerequisites**
   - Node.js v20+
   - Docker and Docker Compose

2. **Infrastructure**
   Start PostgreSQL and Redis:
   ```bash
   docker-compose up -d
   ```

3. **Install Dependencies**
   ```bash
   npm install
   ```

4. **Environment Variables**
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

5. **Database Initialization**
   Run Prisma migrations:
   ```bash
   npx prisma db push
   # or npx prisma migrate dev
   ```

6. **Start the Application**
   You need two terminals.

   Terminal 1 (Next.js web server):
   ```bash
   npm run dev
   ```

   Terminal 2 (BullMQ worker):
   ```bash
   npm run worker
   ```

## Testing
Unit and integration tests are run via Vitest:
```bash
npm run test
```

## Security & Tenancy
- Every resource is strictly scoped to a `Workspace`.
- The database schema mandates `workspaceId` on jobs, audio assets, and projects.
- Tenant-aware repository access centralizes workspace scoping and significantly reduces the risk of accidental cross-tenant data access.
- Next.js middleware protects `/dashboard/*` routes.
