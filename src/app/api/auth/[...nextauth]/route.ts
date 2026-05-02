import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rate-limit';
import { NextRequest } from 'next/server';

const handler = NextAuth(authOptions);

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
             req.headers.get('x-real-ip') ||
             'unknown';

  if (!checkRateLimit(ip, 5, 60000)) {
    return new Response(JSON.stringify({ error: 'Muitas tentativas. Tente novamente em alguns minutos.' }), {
      status: 429,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return handler.POST(req);
}

export { handler as GET };
