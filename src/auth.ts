import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { db } from '@/lib/db';
import * as argon2 from 'argon2';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  // PrismaAdapter is configured here to store User records and seamlessly support 
  // future OAuth providers (Google, GitHub, etc.) which require database persistence.
  adapter: PrismaAdapter(db),
  
  // However, because we are currently using the Credentials provider, NextAuth mandates
  // the 'jwt' session strategy. This means sessions are NOT persisted in the Session table.
  // Instead, the JWT token holds the user ID and acts as the session context.
  session: { strategy: 'jwt' },
  
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;

        const user = await db.user.findUnique({
          where: { email },
        });

        if (!user) return null;

        const isValid = await argon2.verify(user.passwordHash, password);

        if (!isValid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
        };
      },
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
      }
      return token;
    },
  },
});
