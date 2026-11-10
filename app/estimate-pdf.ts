// Client-ready estimate PDF. Uses the same dependency-free, hand-built PDF
// approach as packet-pdf.ts, extended with positioned columns so quantities,
// unit prices, and amounts line up like a printed estimate.

export type EstimatePdfLine = {
  section: string;
  description: string;
  unit: string;
  quantity: number;
  unitPriceCents: number;
  amountCents: number;
  isAlternate: boolean;
  unconfirmed: boolean;
};

export type EstimatePdfInput = {
  workspaceName: string;
  estimateNumber: string;
  title: string;
  status: string;
  customerName: string;
  customerCompany: string;
  jobAddress: string;
  createdAt: string;
  validUntil: string;
  clientNote: string;
  markupBasisPoints: number;
  taxBasisPoints: number;
  lines: EstimatePdfLine[];
};

// Standard Helvetica character widths (units of 1/1000 em) for printable ASCII.
const WIDTHS: Record<string, number> = {
  ' ': 278, '!': 278, '"': 355, '#': 556, '$': 556, '%': 889, '&': 667, "'": 222,
  '(': 333, ')': 333, '*': 389, '+': 584, ',': 278, '-': 333, '.': 278, '/': 278,
  '0': 556, '1': 556, '2': 556, '3': 556, '4': 556, '5': 556, '6': 556, '7': 556, '8': 556, '9': 556,
  ':': 278, ';': 278, '<': 584, '=': 584, '>': 584, '?': 556, '@': 1015,
  A: 667, B: 667, C: 722, D: 722, E: 667, F: 611, G: 778, H: 722, I: 278, J: 500, K: 667, L: 556, M: 833,
  N: 722, O: 778, P: 667, Q: 778, R: 722, S: 667, T: 611, U: 722, V: 667, W: 944, X: 667, Y: 667, Z: 611,
  '[': 278, '\\': 278, ']': 278, '^': 469, '_': 556, '`': 222,
  a: 556, b: 556, c: 500, d: 556, e: 556, f: 278, g: 556, h: 556, i: 222, j: 222, k: 500, l: 222, m: 833,
  n: 556, o: 556, p: 556, q: 556, r: 333, s: 500, t: 278, u: 556, v: 500, w: 722, x: 500, y: 500, z: 500,
  '{': 334, '|': 260, '}': 334, '~': 584,
};

const ascii = (value: string) => value.normalize('NFKD').replace(/[^\x20-\x7E\n]/g, '').replaceAll('\\', '\\\\').replaceAll('(', '\\(').replaceAll(')', '\\)');
const textWidth = (value: string, size: number) => [...ascii(value)].reduce((sum, ch) => sum + (WIDTHS[ch] ?? 556), 0) * size / 1000;
const money = (cents: number) => `$${(Math.round(cents) / 100).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
const qty = (value: number) => Number.isInteger(value) ? String(value) : String(Number(value.toFixed(3)));
const wrap = (value: string, size: number, maxWidth: number) => {
  const out: string[] = [];
  for (const paragraph of value.split(/\n+/)) {
    let line = '';
    for (const word of paragraph.split(/\s+/).filter(Boolean)) {
      const candidate = line ? `${line} ${word}` : word;
      if (textWidth(candidate, size) > maxWidth && line) { out.push(line); line = word; } else line = candidate;
    }
    if (line) out.push(line);
    if (!paragraph.trim()) out.push('');
  }
  return out.length ? out : [''];
};

type Run = { x: number; right?: number; text: string; size: number; bold?: boolean; color?: string; absY?: number };
const COLORS: Record<string, string> = {
  gold: '0.65 0.48 0.21', body: '0.18 0.17 0.16', gray: '0.36 0.34 0.32',
  light: '0.42 0.39 0.36', alert: '0.64 0.29 0.10', rule: '0.72 0.68 0.62',
};

export function buildEstimatePdf(input: EstimatePdfInput) {
  const LEFT = 54, RIGHT_EDGE = 558;
  const pages: Run[][] = [];
  let page: Run[] = [];
  let y = 738;
  const newPage = () => { pages.push(page); page = []; y = 738; };
  const ensure = (height: number) => { if (y - height < 64) newPage(); };
  const row = (height: number, runs: Run[]) => { ensure(height); for (const run of runs) page.push({ ...run, absY: run.size === 0 ? y - 4 : y - run.size - 1 }); y -= height; };
  const line = (text: string, size = 10, bold = false, color = 'body', height = size + 6) =>
    row(height, [{ x: LEFT, text, size, bold, color }]);
  const rule = () => { row(8, [{ x: LEFT, right: RIGHT_EDGE, text: '', size: 0, color: 'rule' }]); };
  const space = (height = 8) => { y -= height; };

  // Header
  line('THE COMMAND SUITE', 10, true, 'gold', 16);
  line(input.workspaceName, 11, true, 'body', 17);
  line('ESTIMATE', 26, true, 'body', 34);
  line(`${input.estimateNumber}  ·  ${input.title}`, 12, true, 'gray', 18);
  const dateText = new Date(input.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  line(`Prepared ${dateText}${input.validUntil ? `  ·  Valid until ${input.validUntil}` : ''}`, 9, false, 'gray', 15);
  if (input.status === 'draft' || input.lines.some(item => item.unconfirmed)) {
    line('DRAFT — this estimate contains lines that have not been confirmed yet.', 9, true, 'alert', 15);
  }
  space(4); rule();
  const customerLabel = [input.customerName, input.customerCompany].filter(Boolean).join(' · ');
  line(`Prepared for: ${customerLabel || 'Customer to be confirmed'}`, 10, true, 'body', 16);
  if (input.jobAddress) line(`Job address: ${input.jobAddress}`, 10, false, 'gray', 15);
  space(6);

  const columnHeader = () => row(16, [
    { x: LEFT, text: 'DESCRIPTION', size: 8, bold: true, color: 'gray' },
    { x: 0, right: 372, text: 'QTY', size: 8, bold: true, color: 'gray' },
    { x: 380, text: 'UNIT', size: 8, bold: true, color: 'gray' },
    { x: 0, right: 472, text: 'UNIT PRICE', size: 8, bold: true, color: 'gray' },
    { x: 0, right: RIGHT_EDGE, text: 'AMOUNT', size: 8, bold: true, color: 'gray' },
  ]);
  const itemRow = (item: EstimatePdfLine) => {
    const parts = wrap(item.description, 9.5, 252);
    parts.forEach((part, index) => {
      if (index === 0) row(14, [
        { x: LEFT, text: part, size: 9.5 },
        { x: 0, right: 372, text: qty(item.quantity), size: 9.5 },
        { x: 380, text: item.unit, size: 9.5 },
        { x: 0, right: 472, text: money(item.unitPriceCents), size: 9.5 },
        { x: 0, right: RIGHT_EDGE, text: money(item.amountCents), size: 9.5 },
      ]);
      else row(13, [{ x: LEFT, text: part, size: 9.5, color: 'gray' }]);
    });
  };

  const base = input.lines.filter(item => !item.isAlternate);
  const alternates = input.lines.filter(item => item.isAlternate);
  const sections: Array<{ name: string; items: EstimatePdfLine[] }> = [];
  for (const item of base) {
    const found = sections.find(section => section.name === item.section);
    if (found) found.items.push(item); else sections.push({ name: item.section, items: [item] });
  }
  let subtotal = 0;
  for (const section of sections) {
    const sectionTotal = section.items.reduce((sum, item) => sum + item.amountCents, 0);
    subtotal += sectionTotal;
    space(6);
    line(section.name.toUpperCase(), 11, true, 'gold', 17);
    columnHeader();
    for (const item of section.items) itemRow(item);
    row(16, [
      { x: LEFT, text: `${section.name} subtotal`, size: 9.5, bold: true, color: 'gray' },
      { x: 0, right: RIGHT_EDGE, text: money(sectionTotal), size: 9.5, bold: true },
    ]);
  }
  if (!sections.length) line('No lines have been added to this estimate yet.', 10, false, 'gray', 16);

  if (alternates.length) {
    const altTotal = alternates.reduce((sum, item) => sum + item.amountCents, 0);
    space(10); rule();
    line('ALTERNATES — PRICED SEPARATELY', 11, true, 'gold', 17);
    line('Alternates are not included in the estimate total unless accepted in writing.', 9, false, 'gray', 14);
    columnHeader();
    for (const item of alternates) itemRow(item);
    row(16, [
      { x: LEFT, text: 'Alternates subtotal', size: 9.5, bold: true, color: 'gray' },
      { x: 0, right: RIGHT_EDGE, text: money(altTotal), size: 9.5, bold: true },
    ]);
  }

  const markup = Math.round(subtotal * input.markupBasisPoints / 10000);
  const tax = Math.round((subtotal + markup) * input.taxBasisPoints / 10000);
  const total = subtotal + markup + tax;
  space(10); rule();
  const totalRow = (label: string, value: string, bold = false, size = 10) => row(size + 6, [
    { x: 330, text: label, size, bold, color: bold ? 'body' : 'gray' },
    { x: 0, right: RIGHT_EDGE, text: value, size, bold },
  ]);
  totalRow('Subtotal', money(subtotal));
  if (markup) totalRow(`Overhead & profit (${(input.markupBasisPoints / 100).toFixed(2).replace(/\.?0+$/, '')}%)`, money(markup));
  if (tax) totalRow(`Tax (${(input.taxBasisPoints / 100).toFixed(2).replace(/\.?0+$/, '')}%)`, money(tax));
  totalRow('ESTIMATE TOTAL', money(total), true, 12);

  if (input.clientNote.trim()) {
    space(12);
    line('NOTES', 11, true, 'gold', 17);
    for (const noteLine of wrap(input.clientNote, 10, RIGHT_EDGE - LEFT)) line(noteLine, 10, false, 'body', 15);
  }
  space(14);
  line('Thank you for the opportunity to price this work. Prices come from our current library and are confirmed before any agreement is signed.', 9, false, 'gray', 14);
  if (page.length || !pages.length) pages.push(page);

  // Assemble the PDF document.
  const objects: string[] = [];
  const addObject = (body: string) => { objects.push(body); return objects.length; };
  const font = addObject('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
  const boldFont = addObject('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>');
  const pageIds: number[] = [], contentIds: number[] = [];
  pages.forEach((runs, pageIndex) => {
    // Replay: rows were appended in order with known heights; store y alongside is
    // not available, so runs carry their own absolute position computed below.
    void pageIndex;
    const commands: string[] = ['q', '0.97 0.95 0.93 rg', '0 0 612 792 re f', 'Q'];
    for (const run of runs) {
      const top = (run as Run & { absY?: number }).absY ?? 0;
      if (run.size === 0) { // horizontal rule
        commands.push('q', `${COLORS.rule} RG`, '0.7 w', `${run.x} ${top} m`, `${run.right ?? RIGHT_EDGE} ${top} l`, 'S', 'Q');
        continue;
      }
      const x = run.right !== undefined ? run.right - textWidth(run.text, run.size) : run.x;
      commands.push('BT', `${COLORS[run.color ?? 'body']} rg`, `/${run.bold ? 'F2' : 'F1'} ${run.size} Tf`, `${x.toFixed(1)} ${top} Td`, `(${ascii(run.text)}) Tj`, 'ET');
    }
    commands.push('BT', `${COLORS.light} rg`, '/F1 8 Tf', `54 28 Td`, `(${ascii(`Estimate ${input.estimateNumber}  |  ${input.workspaceName}  |  Page ${pageIndex + 1} of ${pages.length}`)}) Tj`, 'ET');
    const stream = commands.join('\n');
    contentIds.push(addObject(`<< /Length ${new TextEncoder().encode(stream).length} >>\nstream\n${stream}\nendstream`));
    pageIds.push(addObject('PENDING'));
  });
  const pagesId = objects.length + 1, catalogId = objects.length + 2;
  for (let i = 0; i < pageIds.length; i++) objects[pageIds[i] - 1] = `<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 ${font} 0 R /F2 ${boldFont} 0 R >> >> /Contents ${contentIds[i]} 0 R >>`;
  addObject(`<< /Type /Pages /Kids [${pageIds.map(id => `${id} 0 R`).join(' ')}] /Count ${pageIds.length} >>`);
  addObject(`<< /Type /Catalog /Pages ${pagesId} 0 R >>`);
  let output = '%PDF-1.4\n';
  const offsets = [0];
  objects.forEach((body, index) => { offsets.push(new TextEncoder().encode(output).length); output += `${index + 1} 0 obj\n${body}\nendobj\n`; });
  const xref = new TextEncoder().encode(output).length;
  output += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets.slice(1).map(offset => `${String(offset).padStart(10, '0')} 00000 n `).join('\n')}\ntrailer\n<< /Size ${objects.length + 1} /Root ${catalogId} 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return new TextEncoder().encode(output);
}
