# VoxFlow Architecture

## Overview
VoxFlow is an AI-powered voice workspace that allows users to seamlessly convert speech to text, process transcripts with AI to extract insights, and convert text to speech. 

The application uses a Next.js (App Router) full-stack structure.

### Core Stack
- **Frontend**: Next.js 14+ (React), Tailwind CSS.
- **Backend API**: Next.js API Routes (`/api/*`).
- **Database**: PostgreSQL accessed via Prisma ORM.
- **Background Jobs**: BullMQ (backed by Redis) for long-running asynchronous tasks (STT, AI, TTS).
- **Authentication**: NextAuth.js (Auth.js) with Prisma Adapter (Credentials Provider, Argon2id hashing).
- **Real-Time Progress**: Server-Sent Events (SSE) combined with Redis pub/sub to push job state updates to the UI.

## Tenancy & Isolation
All business entities (Audio Assets, Projects, Jobs) are scoped to a `Workspace`. 
The NextAuth session provides the authenticated user. Context logic explicitly resolves the user's role in the `Workspace`.
The repository layer injects `workspaceId` into Prisma `where` clauses to prevent accidental cross-tenant access.

## Background Processing Architecture
Long-running AI/audio processing is decoupled from the web layer:
1. Client POSTs to `/api/jobs`.
2. Route handler inserts a Job into PostgreSQL and enqueues a task to BullMQ.
3. BullMQ Worker processes the job asynchronously through provider abstractions.
4. Updates to Job state are written to PostgreSQL and published via Redis pub/sub.
5. Client UI consumes state changes via SSE.

## Provider Abstractions
To avoid coupling to specific vendors, core domains are fronted by abstractions:
- `SpeechToTextProvider`: e.g. OpenAI Whisper, Mock.
- `AIProvider`: e.g. OpenAI GPT-4, Mock.
- `TextToSpeechProvider`: e.g. OpenAI TTS, Mock.
- `StorageProvider`: Local Disk, with future S3 extension.

## Production Hardening
VoxFlow implements the following enterprise-grade security and reliability patterns:
- **Idempotency:** Background workers explicitly check job state before applying side effects, preventing duplicate AI provider billing on retry.
- **Strict Parsing:** All AI output is validated against Zod schemas ensuring structural integrity.
- **Tenant Isolation:** The `WorkspaceRepository` abstracts database access to systematically prevent IDOR vulnerabilities.
- **Secure Streaming:** SSE endpoints use Redis Pub/Sub combined with 15-second heartbeats and explicit connection lifecycle management.
- **Path Traversal Protection:** The storage layer enforces `path.resolve()` bounding.

## Architectural Decision Records (ADR)
For historical context on technical decisions, please consult:
- `ADR-001.md`: Monorepo vs Polyrepo
- `ADR-002.md`: Database and ORM Selection
- `ADR-003.md`: State Management
- `ADR-004.md`: Tenant-Aware Repository Pattern
- `ADR-005.md`: Resilient Background Processing with BullMQ
- `ADR-006.md`: OpenAI Integration and Strict Schema Validation
- `ADR-007.md`: Safe Local Storage and Traversal Prevention
- `ADR-008.md`: Secure Server-Sent Events (SSE)
