import { NextResponse } from 'next/server';
import { BACKEND_API_URL } from '@/lib/apiBase';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const backendUrl = `${BACKEND_API_URL}/show-all-jobs?${searchParams.toString()}`;
    const res = await fetch(backendUrl);

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
