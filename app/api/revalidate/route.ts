import { revalidatePath, revalidateTag } from 'next/cache';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const secret = process.env.REVALIDATE_SECRET;
  const body = await request.json().catch(() => ({}));

  if (secret && body.token !== secret) {
    return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
  }

  revalidateTag('repo-data');
  revalidatePath('/');

  return NextResponse.json({ revalidated: true, timestamp: Date.now() });
}
