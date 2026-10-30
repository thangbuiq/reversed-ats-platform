import { NextResponse } from 'next/server';
import { BACKEND_API_URL } from '@/lib/apiBase';

export async function GET(_req: Request, { params }: { params: Promise<{ jobHashId: string }> }) {
  try {
    const { jobHashId } = await params;
    const res = await fetch(`${BACKEND_API_URL}/jobs/${encodeURIComponent(jobHashId)}`);

    if (!res.ok) {
      const body = await res.text();
      return NextResponse.json(
        { error: `Backend returned ${res.status}: ${body}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
