import { emailDeliveryConfigured } from '../../transactional-email';

export async function GET() {
  return Response.json({ configured: emailDeliveryConfigured() }, { headers: { 'cache-control': 'no-store' } });
}
