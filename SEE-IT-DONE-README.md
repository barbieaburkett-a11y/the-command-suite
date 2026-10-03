# See It Done — local prototype

This separate homeowner-facing route is **not linked from the contractor homepage and is not ready to publish**. It includes two AI-generated concept videos supplied by Barbie (built-in bedroom and kitchen), clearly labeled as illustrative possibilities rather than completed work. Both are excluded from indexing. Each concept offers a DIY-planning path and an email inquiry about possible subcontractor availability; neither is a booking or quote. Add the bathroom only when its file is supplied and reviewed.

## Add a real project

1. For a real completed job, obtain the crew's written permission to feature it and use any photos/video. Remove customer-identifying details and confirm the general service area. For AI concepts, keep the concept label and never describe them as actual installations.
2. Optimize real before/after images, place them under `public/see-it-done/`, and add a record to `app/see-it-done/projects.ts` with accurate alt text. For videos, add captions or a transcript and an accessible media component before publishing.
3. Verify every material against the actual job. Add only genuine product links and your real Amazon Associates tag. Never publish the placeholder tag. Keep the visible commission disclosure.
4. Set `sample: false` only after content, crew availability, service area, and intake operations have been reviewed. This enables the inquiry form.
5. The form stores inquiries in D1 and optional photos in private R2 under `showcase-inquiries/`. It does **not** email the team, notify the customer, book a crew, or create a Command Inbox/CRM record. Configure and test a secure owner review/notification path before accepting real inquiries.
6. After real projects are verified, add their URLs to `app/sitemap.ts`, link the showcase from an appropriate secondary location, and review SEO, privacy copy, form retention/deletion, and affiliate disclosures before deployment.

The local feature deliberately avoids changing the existing contractor journey, Founding Pilot, Permit Command, or live pricing.
