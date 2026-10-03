import { contractorAuth } from '../../../contractor-auth';

export const dynamic = 'force-dynamic';
export async function GET(request: Request) {
  try { return contractorAuth().handler(request); }
  catch { return Response.json({ error: 'Authentication is unavailable' }, { status: 503 }); }
}
export async function POST(request: Request) {
  try { return contractorAuth().handler(request); }
  catch { return Response.json({ error: 'Authentication is unavailable' }, { status: 503 }); }
}
