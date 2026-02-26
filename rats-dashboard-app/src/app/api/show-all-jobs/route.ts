import { NextResponse } from 'next/server';

const API_BASE =
  process.env.NEXT_BASE_API_URL?.replace(/\/+$/, '') ??
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, '') ??
  'http://127.0.0.1:8000';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const backendUrl = `${API_BASE}/show-all-jobs?${searchParams.toString()}`;
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
