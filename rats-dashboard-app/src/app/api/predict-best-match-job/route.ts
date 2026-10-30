import { NextResponse } from 'next/server';
import { BACKEND_API_URL } from '@/lib/apiBase';

export async function POST(req: Request) {
  try {
    // We accept the multipart/form-data request and forward it directly to the backend.
    // Reading as formData ensures we can pass it to the backend safely.
    const formData = await req.formData();

    const backendUrl = `${BACKEND_API_URL}/predict-best-match-job`;
    const res = await fetch(backendUrl, {
      method: 'POST',
      body: formData,
    });

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
