import { NextResponse } from 'next-server';
// Wait, 'next-server' is wrong, should be 'next/server'
import { NextResponse as NextResp } from 'next/server';
import { db } from '@/lib/db';
import * as argon2 from 'argon2';
import { z } from 'zod';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResp.json({ error: 'Invalid input', details: parsed.error.issues }, { status: 400 });
    }

    const { email, password, name } = parsed.data;

    const existingUser = await db.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResp.json({ error: 'User already exists' }, { status: 409 });
    }

    const passwordHash = await argon2.hash(password);

    // Create user and a default workspace
    const user = await db.user.create({
      data: {
        email,
        passwordHash,
        name,
        workspaceMembers: {
          create: {
            role: 'OWNER',
            workspace: {
              create: {
                name: `${name || email.split('@')[0]}'s Workspace`,
              },
            },
          },
        },
      },
      include: {
        workspaceMembers: {
          include: {
            workspace: true,
          },
        },
      },
    });

    return NextResp.json({ 
      success: true, 
      user: { id: user.id, email: user.email, name: user.name } 
    }, { status: 201 });

  } catch (error) {
    console.error('Registration error:', error);
    return NextResp.json({ error: 'Internal server error' }, { status: 500 });
  }
}
