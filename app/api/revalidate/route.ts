import { revalidatePath, revalidateTag } from 'next/cache';
import { NextResponse } from 'next/server';

let lastRevalidateAt = 0;

export async function POST(request: Request) {
  const secret = process.env.REVALIDATE_SECRET;
  const body = await request.json().catch(() => ({}));

  if (secret && body.token !== secret) {
    return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
  }

  const now = Date.now();
  const cooldownMs = 60_000;
  const elapsed = now - lastRevalidateAt;
  if (elapsed < cooldownMs) {
    const retryAfterSeconds = Math.ceil((cooldownMs - elapsed) / 1000);
    return NextResponse.json(
      { message: `Please wait ${retryAfterSeconds}s before refreshing again.`, retryAfter: retryAfterSeconds },
      { status: 429, headers: { 'Retry-After': String(retryAfterSeconds) } }
    );
  }

  lastRevalidateAt = now;
  revalidateTag('repo-data');
  revalidatePath('/');
  revalidatePath('/tools');

  return NextResponse.json({ revalidated: true, timestamp: Date.now() });
}
