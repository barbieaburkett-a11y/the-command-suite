import { env } from 'cloudflare:workers';
import { getShowcaseProject } from '../../see-it-done/projects';
import { rejectCrossSite, tooManySubmissions } from '../form-guard';

type Runtime = { DB: D1Database; FILES: R2Bucket };
const allowedTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);
const categories = new Set(['kitchen', 'closet', 'bathroom', 'built-in', 'other']);

// MVP inquiry store only. Future Command Inbox/CRM connection goes after a reviewed integration design.
export async function POST(request: Request) {
  const crossSite = rejectCrossSite(request); if (crossSite) return crossSite;
  try {
    const data = await request.formData();
    if (data.get('website')) return Response.json({ ok: true });
    const projectId = String(data.get('projectId') || '').trim();
    const project = getShowcaseProject(projectId);
    if (!project || project.sample) return Response.json({ error: 'Inquiries are not open for sample projects.' }, { status: 400 });
    const name = String(data.get('name') || '').trim().slice(0, 120);
    const email = String(data.get('email') || '').trim().toLowerCase().slice(0, 254);
    const phone = String(data.get('phone') || '').trim().slice(0, 40);
    const projectType = String(data.get('projectType') || '').trim();
    const locationArea = String(data.get('locationArea') || '').trim().slice(0, 120);
    const description = String(data.get('description') || '').trim().slice(0, 2000);
    if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !categories.has(projectType) || !locationArea || !description || data.get('consent') !== 'yes') {
      return Response.json({ error: 'Complete the required fields and consent checkbox.' }, { status: 400 });
    }
    const photo = data.get('photo');
    if (photo instanceof File && photo.size > 0 && (photo.size > 5_000_000 || !allowedTypes.has(photo.type))) {
      return Response.json({ error: 'Choose a JPG, PNG, or WebP photo under 5 MB.' }, { status: 400 });
    }
    const runtime = env as unknown as Runtime;
    if (await tooManySubmissions(runtime.DB, request, 'showcase-inquiry')) return Response.json({ error: 'Too many attempts. Please try later.' }, { status: 429 });
    const id = crypto.randomUUID();
    const photoKey = photo instanceof File && photo.size > 0 ? `showcase-inquiries/${id}/photo` : null;
    if (photoKey && photo instanceof File) await runtime.FILES.put(photoKey, photo.stream(), { httpMetadata: { contentType: photo.type } });
    try {
      await runtime.DB.prepare(`INSERT INTO showcase_inquiries (id,project_id,name,email,phone,project_type,location_area,description,photo_key,photo_content_type,status,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`)
        .bind(id, projectId, name, email, phone, projectType, locationArea, description, photoKey, photoKey && photo instanceof File ? photo.type : null, 'new', new Date().toISOString()).run();
    } catch (error) {
      if (photoKey) await runtime.FILES.delete(photoKey);
      throw error;
    }
    return Response.json({ ok: true });
  } catch (error) {
    console.error('Showcase inquiry failed', error);
    return Response.json({ error: 'We could not save your inquiry. Please email hello@thecommandsuite.com.' }, { status: 500 });
  }
}
