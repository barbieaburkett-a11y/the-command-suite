// Public copy for the Command Front Desk page. Keep every "Available now" line true to what the app does today.

export const frontDeskStatus = [
  ['Available now', 'Website lead form', 'Paste one snippet into your site. Each new lead lands in Front Desk with a reply ready, and you get an email alert.'],
  ['Available now', 'Replies in your voice', 'Your Playbook (services, service area, pricing guidance, tone and words to avoid) shapes every suggested reply.'],
  ['Available now', 'Approve and send by email', 'Read, edit and send the reply from your phone. Nothing goes out until you approve it.'],
  ['Available now', 'One lead list', 'See every lead, its status, the next step and when to follow up, in one place.'],
  ['Available now', 'Paste in emails and DMs', 'Got a lead by email, Instagram DM or voicemail? Paste it in with Add a message and get a suggested reply.'],
  ['Coming next', 'Automatic email and Instagram', 'Forwarding your inbox and connecting Instagram so those leads arrive on their own. Today, paste them in.'],
] as const;

export const frontDeskPlans = [
  {
    name: 'Front Desk',
    price: '$149',
    setup: 'One-time setup: $299',
    summary: 'You approve every reply.',
    includes: ['Website lead form for your site', 'Suggested replies in your voice', 'Approve and send from your phone', 'Lead list with follow-up reminders'],
    featured: true,
  },
  {
    name: 'Front Desk + Reels',
    price: '$399',
    setup: 'One-time setup: $499',
    summary: 'Win the lead and fill the feed.',
    includes: ['Everything in Front Desk', 'Instagram Reels made for your business', 'Each Reel posted only after your OK'],
    featured: false,
  },
  {
    name: 'Done For You',
    price: '$699',
    setup: 'One-time setup: $799',
    summary: 'We run it with you.',
    includes: ['Everything in Front Desk + Reels', 'We set up and tune your Playbook', 'Hands-on help from Barbie every month'],
    featured: false,
  },
] as const;

export const frontDeskFaq = [
  { question: 'Does Front Desk send anything without me?', answer: 'No. Front Desk drafts the reply. You read it, change it if you like, and approve it before anything is sent.' },
  { question: 'Will the replies sound like a robot?', answer: 'Replies follow your Playbook: what you do, where you work, how you talk and what you never say. You can edit any reply before it goes out.' },
  { question: 'Do I need a new website?', answer: 'No. You paste a short lead form snippet into the site you already have. We can help you add it during setup.' },
  { question: 'What about emails, Instagram DMs and phone calls?', answer: 'Today you paste those into Front Desk with one button and get a suggested reply. Automatic email forwarding and an Instagram connection are coming next. Front Desk does not answer phone calls or text messages.' },
  { question: 'What happens after the 14-day trial?', answer: 'Choose the plan that fits. The price and any one-time setup fee are confirmed with you before you pay, and you can cancel future renewals by emailing hello@thecommandsuite.com.' },
] as const;
