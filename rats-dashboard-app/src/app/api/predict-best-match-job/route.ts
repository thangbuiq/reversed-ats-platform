import { NextResponse } from 'next/server';
import { BACKEND_API_URL } from '@/lib/apiBase';

/** The first match after a cold start loads the embedding model, which can take a while. */
export const maxDuration = 60;

const BACKEND_TIMEOUT_MS = 55_000;

/** Pull a readable message out of a FastAPI (`detail`) or proxy (`error`) error body. */
function errorMessage(body: string, status: number): string {
  try {
    const parsed = JSON.parse(body);
    const detail = parsed?.detail ?? parsed?.error;
    if (typeof detail === 'string') return detail;
    if (Array.isArray(detail) && detail[0]?.msg) return String(detail[0].msg);
  } catch {
    // Non-JSON body, e.g. an HTML error page from the hosting platform.
  }
  return `Matching service returned ${status}.`;
}

export async function POST(req: Request) {
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: 'Upload was not a valid form.' }, { status: 400 });
  }
  if (!(formData.get('cv_file') instanceof Blob)) {
    return NextResponse.json({ error: 'Choose a CV file to upload.' }, { status: 400 });
  }

  try {
    const res = await fetch(`${BACKEND_API_URL}/predict-best-match-job`, {
      method: 'POST',
      body: formData,
      signal: AbortSignal.timeout(BACKEND_TIMEOUT_MS),
    });
    const body = await res.text();
    if (!res.ok) {
      return NextResponse.json({ error: errorMessage(body, res.status) }, { status: res.status });
    }
    return new NextResponse(body, {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    const timedOut = err instanceof Error && err.name === 'TimeoutError';
    return NextResponse.json(
      {
        error: timedOut
          ? 'Matching took too long. The service may be warming up, please try again.'
          : 'Could not reach the matching service.',
      },
      { status: timedOut ? 504 : 502 }
    );
  }
}
