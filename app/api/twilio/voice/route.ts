const XML_HEADERS = {
  'Content-Type': 'text/xml; charset=utf-8',
  'Cache-Control': 'no-store',
};

const FORWARD_NUMBER = '+18033712887';
const VOICE = 'Polly.Joanna';

function xml(body: string) {
  return new Response(`<?xml version="1.0" encoding="UTF-8"?>\n<Response>${body}</Response>`, {
    status: 200,
    headers: XML_HEADERS,
  });
}

function connectToBarbie(context: string) {
  return xml(`
  <Say voice="${VOICE}">${context} I’ll connect you with Barbie Burkett now.</Say>
  <Dial answerOnBridge="true" timeout="20">${FORWARD_NUMBER}</Dial>
  <Say voice="${VOICE}">Barbie is helping another caller or may be away from her phone. Please leave your name, company, callback number, and a short description of what you need after the tone.</Say>
  <Record maxLength="120" playBeep="true" trim="trim-silence" />
  <Say voice="${VOICE}">Thank you. Your message is with The Command Suite, and Barbie will follow up as soon as possible.</Say>`);
}

function welcome(retry = false) {
  const opening = retry
    ? 'I’m sorry, I didn’t catch that.'
    : 'Thank you for calling The Command Suite, the field-to-office workflow service built for contractors. I’m the automated receptionist, here to get you to the right place.';

  return xml(`
  <Gather input="speech dtmf" numDigits="1" action="/api/twilio/voice?step=route" method="POST" timeout="5" speechTimeout="auto">
    <Say voice="${VOICE}">${opening} Tell me what you’re calling about. You can say product demo or press 1, Permit Pathfinder or press 2, current customer support or press 3, or say Barbie or press 0.</Say>
  </Gather>
  <Redirect method="POST">/api/twilio/voice?step=${retry ? 'human' : 'retry'}</Redirect>`);
}

function normalize(value: FormDataEntryValue | null) {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

export async function POST(request: Request) {
  const url = new URL(request.url);
  const step = url.searchParams.get('step');

  if (step === 'retry') return welcome(true);
  if (step === 'human') return connectToBarbie('No problem.');
  if (step !== 'route') return welcome();

  const form = await request.formData();
  const digits = normalize(form.get('Digits'));
  const speech = normalize(form.get('SpeechResult'));

  if (digits === '1' || /demo|pilot|product|software|command suite/.test(speech)) {
    return connectToBarbie('Great. You’re calling about the product or the Founding Partner guided trial.');
  }
  if (digits === '2' || /permit|inspection|jurisdiction/.test(speech)) {
    return connectToBarbie('Thank you. You’re calling about Permit Pathfinder, our directory of selected official permit resources.');
  }
  if (digits === '3' || /support|client|customer|account|help/.test(speech)) {
    return connectToBarbie('Thank you. I understand you need current-customer support.');
  }
  if (digits === '0' || /barbie|human|person|representative|operator/.test(speech)) {
    return connectToBarbie('Absolutely.');
  }

  return connectToBarbie('Thank you. I’ll make sure your call reaches the right person.');
}

export async function GET() {
  return welcome();
}
