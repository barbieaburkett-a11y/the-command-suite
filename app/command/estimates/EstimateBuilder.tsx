'use client';
import { FormEvent, useCallback, useEffect, useState } from 'react';

type Item = { id: string; description: string; section: string; unit: string; unit_price_cents: number; labor_cents: number; material_cents: number; equipment_cents: number; is_sample: number; active: number };
type Assembly = { id: string; name: string; description: string; unit: string; is_sample: number; active: number };
type AssemblyLine = { id: string; assembly_id: string; item_id: string | null; section: string; description: string; unit: string; quantity_milli: number; unit_price_cents: number; labor_cents: number; material_cents: number; equipment_cents: number };
type Estimate = { id: string; estimate_number: string; title: string; customer_id: string | null; project_id: string | null; customer_name: string | null; customer_company: string | null; linked_project_name: string | null; job_address: string; status: string; markup_basis_points: number; tax_basis_points: number; client_note: string; internal_notes: string; valid_until: string; converted_project_id: string | null };
type Line = { id: string; estimate_id: string; item_id: string | null; assembly_id: string | null; section: string; description: string; unit: string; quantity_milli: number; unit_price_cents: number; labor_cents: number; material_cents: number; equipment_cents: number; source: string; status: string; is_alternate: number };
type Doc = { id: string; estimate_id: string; kind: string; file_name: string; created_at: string };
type Customer = { id: string; name: string; company: string };
type Project = { id: string; name: string; customer_id: string | null; pipeline_stage: string };
type Payload = { items: Item[]; assemblies: Assembly[]; assemblyLines: AssemblyLine[]; estimates: Estimate[]; lines: Line[]; documents: Doc[]; customers: Customer[]; projects: Project[]; units: string[]; sections: string[]; error?: string };

const money = (cents: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
const dollars = (cents: number) => (cents / 100).toFixed(2);
const lineAmount = (line: { quantity_milli: number; unit_price_cents: number }) => Math.round(line.quantity_milli * line.unit_price_cents / 1000);
const lineCost = (line: { quantity_milli: number; labor_cents: number; material_cents: number; equipment_cents: number }) => Math.round(line.quantity_milli * (line.labor_cents + line.material_cents + line.equipment_cents) / 1000);
const percent = (bp: number) => String(Number((bp / 100).toFixed(2)));

export default function EstimateBuilder({ workspaceName, initialProjectId, module }: { workspaceName: string; initialProjectId: string; module: { name: string; purpose: string; roles: readonly string[]; artifacts: readonly string[]; limitations: readonly string[]; publishingNotes: readonly string[] } }) {
  const [data, setData] = useState<Payload | null>(null);
  const [tab, setTab] = useState<'estimates' | 'library' | 'assemblies'>('estimates');
  const [estimateId, setEstimateId] = useState('');
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [editingAssembly, setEditingAssembly] = useState<string>('');
  const [busy, setBusy] = useState(true), [error, setError] = useState(''), [notice, setNotice] = useState('');

  const load = useCallback(async () => {
    const response = await fetch('/api/command/estimates', { cache: 'no-store' });
    const payload = await response.json() as Payload;
    if (!response.ok) throw new Error(payload.error || 'Estimate Builder could not load.');
    setData(payload);
    setEstimateId(current => current && payload.estimates.some(e => e.id === current) ? current : payload.estimates[0]?.id || '');
    setBusy(false);
  }, []);
  useEffect(() => { let active = true; const timer = window.setTimeout(() => load().catch(reason => { if (active) { setError(reason instanceof Error ? reason.message : 'Estimate Builder could not load.'); setBusy(false); } }), 0); return () => { active = false; window.clearTimeout(timer); }; }, [load]);

  async function send(body: Record<string, unknown>) {
    setBusy(true); setError(''); setNotice('');
    try {
      const response = await fetch('/api/command/estimates', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
      const payload = await response.json() as { ok?: boolean; error?: string; id?: string; projectId?: string; added?: number; itemsAdded?: number; assembliesAdded?: number };
      if (!response.ok) throw new Error(payload.error || 'Something went wrong.');
      await load();
      return payload;
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Something went wrong.'); setBusy(false); throw reason; }
  }

  const estimate = data?.estimates.find(e => e.id === estimateId) || null;
  const estimateLines = (data?.lines || []).filter(line => line.estimate_id === estimateId);
  const baseLines = estimateLines.filter(line => !line.is_alternate);
  const altLines = estimateLines.filter(line => line.is_alternate);
  const subtotal = baseLines.reduce((sum, line) => sum + lineAmount(line), 0);
  const altSubtotal = altLines.reduce((sum, line) => sum + lineAmount(line), 0);
  const costSubtotal = baseLines.reduce((sum, line) => sum + lineCost(line), 0);
  const markup = estimate ? Math.round(subtotal * estimate.markup_basis_points / 10000) : 0;
  const tax = estimate ? Math.round((subtotal + markup) * estimate.tax_basis_points / 10000) : 0;
  const total = subtotal + markup + tax;
  const draftCount = estimateLines.filter(line => line.status === 'draft').length;
  const sectionsInUse: string[] = [];
  for (const line of baseLines) if (!sectionsInUse.includes(line.section)) sectionsInUse.push(line.section);

  if (busy && !data) return <div className="command-body"><p className="command-empty">Loading Estimate Builder…</p></div>;
  if (!data) return <div className="command-body">{error && <p className="command-error" role="alert">{error}</p>}</div>;

  return <div className="command-body est-body">
    <div className="command-section-head"><div><small>ESTIMATE BUILDER · {workspaceName.toUpperCase()}</small><h2>Price the work from your own library.</h2><p className="desk-summary">{module.purpose}</p></div></div>
    {error && <p className="command-error" role="alert">{error}</p>}{notice && <p className="command-success" role="status">✓ {notice}</p>}
    <nav className="est-tabs" aria-label="Estimate Builder sections">
      <button className={tab === 'estimates' ? 'active' : ''} onClick={() => setTab('estimates')}>Estimates</button>
      <button className={tab === 'library' ? 'active' : ''} onClick={() => setTab('library')}>Line-Item Library</button>
      <button className={tab === 'assemblies' ? 'active' : ''} onClick={() => setTab('assemblies')}>Assemblies</button>
    </nav>

    {tab === 'estimates' && <section className="est-layout">
      <aside className="est-side">
        <form className="command-panel compact-panel" onSubmit={async (e: FormEvent<HTMLFormElement>) => { e.preventDefault(); const form = e.currentTarget; const values = Object.fromEntries(new FormData(form)); const result = await send({ action: 'create_estimate', ...values }).catch(() => null); if (result?.id) { setEstimateId(result.id); setNotice('Estimate created. Add lines from the library, an assembly, or by hand.'); form.reset(); } }}>
          <small>NEW ESTIMATE</small><h3>Start from your library, not a blank page</h3>
          <label>Estimate title<input name="title" required placeholder="Driveway and drainage package" /></label>
          <label>Customer<select name="customerId" defaultValue=""><option value="">No customer yet (optional)</option>{data.customers.map(c => <option key={c.id} value={c.id}>{c.name}{c.company ? ` · ${c.company}` : ''}</option>)}</select></label>
          <label>Existing job (optional)<select name="projectId" defaultValue={initialProjectId || ''}><option value="">Not linked to a job</option>{data.projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
          <label>Job address<input name="jobAddress" placeholder="Street, city, state" /></label>
          <div className="est-two"><label>Markup / OH&amp;P %<input name="markup" type="number" step="0.01" min="0" defaultValue="0" /></label><label>Tax %<input name="tax" type="number" step="0.01" min="0" defaultValue="0" /></label></div>
          <label>Valid until<input name="validUntil" type="date" /></label>
          <button className="command-primary" disabled={busy}>Create estimate →</button>
        </form>
        <div className="est-list">
          {data.estimates.length === 0 ? <p className="field-help">No estimates yet. Create the first one above.</p> : data.estimates.map(e => {
            const lines = data.lines.filter(line => line.estimate_id === e.id && !line.is_alternate);
            const value = lines.reduce((sum, line) => sum + lineAmount(line), 0);
            return <button key={e.id} className={e.id === estimateId ? 'est-card active' : 'est-card'} onClick={() => setEstimateId(e.id)}>
              <span><b>{e.estimate_number}</b><em className={`est-status ${e.status}`}>{e.status}</em></span>
              <strong>{e.title}</strong>
              <small>{e.customer_name || 'No customer'} · {money(value)}</small>
            </button>;
          })}
        </div>
      </aside>

      <div className="est-main">
        {!estimate ? <div className="command-empty"><h3>No estimate selected.</h3><p>Create an estimate to open its worksheet.</p></div> : <>
          <div className="est-head">
            <div><small>{estimate.estimate_number} · {estimate.status.toUpperCase()}</small><h3>{estimate.title}</h3>
              <p>{estimate.customer_name ? `${estimate.customer_name}${estimate.customer_company ? ` · ${estimate.customer_company}` : ''}` : 'No customer connected'}{estimate.linked_project_name ? ` · Job: ${estimate.linked_project_name}` : ''}{estimate.job_address ? ` · ${estimate.job_address}` : ''}</p>
              {draftCount > 0 && <p className="est-draft-note">{draftCount} line{draftCount === 1 ? '' : 's'} still unconfirmed. Confirm every line before this estimate can be sent, approved, or marked won.</p>}
            </div>
            <div className="est-actions">
              <a className="est-button" href={`/api/command/estimates/${estimate.id}/pdf`}>Client PDF ↓</a>
              {estimate.status !== 'won' && <button disabled={busy || draftCount > 0 || estimateLines.length === 0} onClick={async () => { if (window.confirm('Mark this estimate won and create the job? The job opens in the Approved stage.')) { const result = await send({ action: 'win_estimate', estimateId: estimate.id }).catch(() => null); if (result) setNotice('Estimate marked won. The job is now in your pipeline in the Approved stage.'); } }}>Mark won → create job</button>}
              {estimate.converted_project_id && <span className="est-won-note">Job created ✓</span>}
            </div>
          </div>

          <div className="est-table" role="table" aria-label="Estimate lines">
            <div className="est-row est-row-head" role="row"><span>Description</span><span>Qty</span><span>Unit</span><span>Unit price</span><span>Amount</span><span>Alt</span><span></span></div>
            {sectionsInUse.map(sectionName => <div key={sectionName}>
              <div className="est-section-row"><b>{sectionName}</b><span>{money(baseLines.filter(line => line.section === sectionName).reduce((sum, line) => sum + lineAmount(line), 0))}</span></div>
              {baseLines.filter(line => line.section === sectionName).map(line => <LineRow key={line.id} line={line} units={data.units} sections={data.sections} send={send} />)}
            </div>)}
            {altLines.length > 0 && <div>
              <div className="est-section-row alt"><b>Alternates — priced separately</b><span>{money(altSubtotal)}</span></div>
              {altLines.map(line => <LineRow key={line.id} line={line} units={data.units} sections={data.sections} send={send} />)}
            </div>}
            {estimateLines.length === 0 && <p className="field-help">No lines yet. Add from the library, drop in an assembly, or type a line by hand below.</p>}
          </div>

          <div className="est-totals">
            <div><span>Internal cost (labor + material + equipment)</span><b>{money(costSubtotal)}</b></div>
            <div><span>Subtotal</span><b>{money(subtotal)}</b></div>
            {markup > 0 && <div><span>Overhead &amp; profit ({percent(estimate.markup_basis_points)}%)</span><b>{money(markup)}</b></div>}
            {tax > 0 && <div><span>Tax ({percent(estimate.tax_basis_points)}%)</span><b>{money(tax)}</b></div>}
            <div className="est-grand"><span>Estimate total</span><b>{money(total)}</b></div>
            {altSubtotal > 0 && <div><span>Alternates (not in total)</span><b>{money(altSubtotal)}</b></div>}
            {draftCount > 0 && <button className="est-button" disabled={busy} onClick={() => send({ action: 'confirm_all_lines', estimateId: estimate.id }).catch(() => null)}>Confirm all lines ✓</button>}
          </div>

          <div className="est-panels">
            <form className="command-panel compact-panel" onSubmit={async (e: FormEvent<HTMLFormElement>) => { e.preventDefault(); const values = Object.fromEntries(new FormData(e.currentTarget)); await send({ action: 'add_line', mode: 'item', estimateId: estimate.id, itemId: values.itemId, quantity: values.quantity, isAlternate: values.isAlternate === 'true' }).catch(() => null); }}>
              <small>ADD FROM LIBRARY</small>
              <label>Library item<select name="itemId" required defaultValue=""><option value="" disabled>Select item</option>{data.items.filter(i => i.active).map(i => <option key={i.id} value={i.id}>{i.description} — {money(i.unit_price_cents)}/{i.unit}{i.is_sample ? ' (sample)' : ''}</option>)}</select></label>
              <div className="est-two"><label>Quantity<input name="quantity" type="number" step="0.001" min="0.001" defaultValue="1" required /></label><label className="est-check">Alternate (priced separately)<input name="isAlternate" type="checkbox" value="true" /></label></div>
              <button disabled={busy}>Add item line</button>
            </form>

            <form className="command-panel compact-panel" onSubmit={async (e: FormEvent<HTMLFormElement>) => { e.preventDefault(); const values = Object.fromEntries(new FormData(e.currentTarget)); const result = await send({ action: 'add_line', mode: 'assembly', estimateId: estimate.id, ...values }).catch(() => null); if (result) setNotice('Assembly added. Its lines start unconfirmed — review the prices, then confirm.'); }}>
              <small>ADD AN ASSEMBLY</small>
              <label>Assembly<select name="assemblyId" required defaultValue=""><option value="" disabled>Select assembly</option>{data.assemblies.filter(a => a.active).map(a => <option key={a.id} value={a.id}>{a.name} (per {a.unit}){a.is_sample ? ' — sample' : ''}</option>)}</select></label>
              <label>Quantity of assembly<input name="quantity" type="number" step="0.001" min="0.001" defaultValue="1" required /></label>
              <button disabled={busy}>Add assembly lines</button>
              <p className="field-help">Assembly lines land as Draft until you confirm them — quantities and prices stay yours to check.</p>
            </form>

            <form className="command-panel compact-panel" onSubmit={async (e: FormEvent<HTMLFormElement>) => { e.preventDefault(); const form = e.currentTarget; const values = Object.fromEntries(new FormData(form)); await send({ action: 'add_line', mode: 'manual', estimateId: estimate.id, ...values }).then(() => form.reset()).catch(() => null); }}>
              <small>ADD A LINE BY HAND</small>
              <label>Description<input name="description" required placeholder="What is being priced?" /></label>
              <div className="est-two"><label>Section<select name="section">{data.sections.map(s => <option key={s} value={s}>{s}</option>)}</select></label><label>Unit<select name="unit">{data.units.map(u => <option key={u} value={u}>{u}</option>)}</select></label></div>
              <div className="est-two"><label>Quantity<input name="quantity" type="number" step="0.001" min="0.001" defaultValue="1" required /></label><label>Unit price $<input name="unitPrice" type="number" step="0.01" min="0" defaultValue="0" required /></label></div>
              <div className="est-three"><label>Labor $<input name="labor" type="number" step="0.01" min="0" defaultValue="0" /></label><label>Material $<input name="material" type="number" step="0.01" min="0" defaultValue="0" /></label><label>Equip. $<input name="equipment" type="number" step="0.01" min="0" defaultValue="0" /></label></div>
              <button disabled={busy}>Add manual line</button>
            </form>
          </div>

          <form key={estimate.id + estimate.status} className="command-panel compact-panel est-settings" onSubmit={async (e: FormEvent<HTMLFormElement>) => { e.preventDefault(); const values = Object.fromEntries(new FormData(e.currentTarget)); const result = await send({ action: 'update_estimate', id: estimate.id, ...values }).catch(() => null); if (result) setNotice('Estimate settings saved.'); }}>
            <small>ESTIMATE SETTINGS</small>
            <div className="est-grid">
              <label>Title<input name="title" defaultValue={estimate.title} required /></label>
              <label>Status<select name="status" defaultValue={estimate.status === 'won' ? 'approved' : estimate.status}><option value="draft">Draft</option><option value="sent">Sent</option><option value="approved">Approved</option><option value="lost">Lost</option><option value="void">Void</option></select></label>
              <label>Customer<select name="customerId" defaultValue={estimate.customer_id || ''}><option value="">No customer</option>{data.customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
              <label>Linked job<select name="projectId" defaultValue={estimate.project_id || ''}><option value="">Not linked</option>{data.projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
              <label>Job address<input name="jobAddress" defaultValue={estimate.job_address} /></label>
              <label>Valid until<input name="validUntil" type="date" defaultValue={estimate.valid_until} /></label>
              <label>Markup / OH&amp;P %<input name="markup" type="number" step="0.01" min="0" defaultValue={percent(estimate.markup_basis_points)} /></label>
              <label>Tax %<input name="tax" type="number" step="0.01" min="0" defaultValue={percent(estimate.tax_basis_points)} /></label>
            </div>
            <label>Note shown on the client PDF<textarea name="clientNote" rows={3} defaultValue={estimate.client_note} placeholder="Scope notes, exclusions, or terms the client should see" /></label>
            <label>Internal notes (never on the PDF)<textarea name="internalNotes" rows={2} defaultValue={estimate.internal_notes} /></label>
            <div className="est-actions"><button className="command-primary" disabled={busy}>Save settings</button>
              <button type="button" className="est-danger" disabled={busy} onClick={async () => { if (window.confirm('Delete this estimate and all of its lines?')) { await send({ action: 'delete_estimate', id: estimate.id }).catch(() => null); setEstimateId(''); } }}>Delete estimate</button></div>
          </form>

          <div className="command-panel compact-panel est-docs">
            <small>ESTIMATE DOCUMENTS</small>
            <p className="field-help">Plan and spec files get attached in the next phase. For now, register a file name so the team knows which documents this estimate was priced from.</p>
            {(data.documents.filter(d => d.estimate_id === estimate.id)).map(d => <p key={d.id} className="est-doc-row"><b>{d.kind}</b> {d.file_name} <span>{new Date(d.created_at).toLocaleDateString()}</span></p>)}
            <form onSubmit={async (e: FormEvent<HTMLFormElement>) => { e.preventDefault(); const form = e.currentTarget; const values = Object.fromEntries(new FormData(form)); await send({ action: 'register_document', estimateId: estimate.id, ...values }).then(() => form.reset()).catch(() => null); }}>
              <div className="est-two"><label>Kind<select name="kind"><option value="plan">Plan</option><option value="spec">Spec</option><option value="photo">Photo</option><option value="other">Other</option></select></label><label>File name<input name="fileName" required placeholder="Site plan set, revision 2" /></label></div>
              <button disabled={busy}>Register document</button>
            </form>
          </div>
        </>}
      </div>
    </section>}

    {tab === 'library' && <section>
      <div className="est-toolbar"><p>Your library is your price book. Sample rows are clearly labeled — replace their placeholder prices with your own numbers, or archive them.</p>
        <button disabled={busy} onClick={async () => { const result = await send({ action: 'install_starters' }).catch(() => null); if (result) setNotice(`Sample library ready: ${result.itemsAdded || 0} items and ${result.assembliesAdded || 0} assemblies added. Anything already installed was skipped.`); }}>Install sample library &amp; assemblies</button></div>
      <div className="est-layout">
        <form key={editingItem?.id || 'new-item'} className="command-panel compact-panel" onSubmit={async (e: FormEvent<HTMLFormElement>) => { e.preventDefault(); const values = Object.fromEntries(new FormData(e.currentTarget)); const result = await send({ action: 'save_item', id: editingItem?.id || '', active: values.active === 'on', description: values.description, section: values.section, unit: values.unit, unitPrice: values.unitPrice, labor: values.labor, material: values.material, equipment: values.equipment }).catch(() => null); if (result) { setEditingItem(null); setNotice('Library item saved.'); } }}>
          <small>{editingItem ? 'EDIT ITEM' : 'NEW ITEM'}</small>
          <label>Description<input name="description" required defaultValue={editingItem?.description || ''} /></label>
          <div className="est-two"><label>Section<select name="section" defaultValue={editingItem?.section || data.sections[0]}>{data.sections.map(s => <option key={s} value={s}>{s}</option>)}</select></label><label>Unit<select name="unit" defaultValue={editingItem?.unit || 'EA'}>{data.units.map(u => <option key={u} value={u}>{u}</option>)}</select></label></div>
          <label>Unit price (sell) $<input name="unitPrice" type="number" step="0.01" min="0" required defaultValue={editingItem ? dollars(editingItem.unit_price_cents) : '0'} /></label>
          <div className="est-three"><label>Labor $<input name="labor" type="number" step="0.01" min="0" defaultValue={editingItem ? dollars(editingItem.labor_cents) : '0'} /></label><label>Material $<input name="material" type="number" step="0.01" min="0" defaultValue={editingItem ? dollars(editingItem.material_cents) : '0'} /></label><label>Equip. $<input name="equipment" type="number" step="0.01" min="0" defaultValue={editingItem ? dollars(editingItem.equipment_cents) : '0'} /></label></div>
          {editingItem && <label className="est-check">Active<input name="active" type="checkbox" defaultChecked={editingItem.active === 1} /></label>}
          <div className="est-actions"><button className="command-primary" disabled={busy}>{editingItem ? 'Save item' : 'Add item'}</button>{editingItem && <button type="button" onClick={() => setEditingItem(null)}>Cancel</button>}</div>
        </form>
        <div className="est-table">
          <div className="est-row est-row-head library"><span>Item</span><span>Unit</span><span>Price</span><span>L / M / E</span><span></span></div>
          {data.items.map(item => <div key={item.id} className={`est-row library${item.active ? '' : ' inactive'}`}>
            <span><b>{item.description}</b><small>{item.section}{item.is_sample ? ' · SAMPLE — placeholder price' : ''}{item.active ? '' : ' · archived'}</small></span>
            <span>{item.unit}</span><span>{money(item.unit_price_cents)}</span>
            <span>{money(item.labor_cents)} / {money(item.material_cents)} / {money(item.equipment_cents)}</span>
            <span className="est-row-actions"><button onClick={() => setEditingItem(item)}>Edit</button><button onClick={async () => { if (window.confirm('Remove this library item? Items already used stay on their estimates; unused items are deleted, used items are archived.')) await send({ action: 'delete_item', id: item.id }).catch(() => null); }}>Remove</button></span>
          </div>)}
          {data.items.length === 0 && <p className="field-help">Library is empty. Install the sample library to see the shape, then replace the placeholder prices with your own.</p>}
        </div>
      </div>
    </section>}

    {tab === 'assemblies' && <section>
      <div className="est-toolbar"><p>An assembly is a repeatable chunk of work. Its lines carry per-one-unit quantities, so dropping an assembly into an estimate pre-wires the math.</p>
        <button disabled={busy} onClick={() => setEditingAssembly('new')}>New assembly</button></div>
      <div className="est-assembly-grid">
        {data.assemblies.map(assembly => {
          const lines = data.assemblyLines.filter(line => line.assembly_id === assembly.id);
          const perUnit = lines.reduce((sum, line) => sum + lineAmount(line), 0);
          return <article key={assembly.id} className={`est-assembly-card${assembly.active ? '' : ' inactive'}`}>
            <small>PER {assembly.unit}{assembly.is_sample ? ' · SAMPLE' : ''}</small>
            <h3>{assembly.name}</h3>
            {assembly.description && <p>{assembly.description}</p>}
            <ul>{lines.map(line => <li key={line.id}><span>{line.description}</span><b>{Number(line.quantity_milli) / 1000} {line.unit} · {money(line.unit_price_cents)}</b></li>)}</ul>
            <p className="est-assembly-total">Priced at {money(perUnit)} per {assembly.unit}</p>
            <div className="est-actions"><button onClick={() => setEditingAssembly(assembly.id)}>Edit</button><button onClick={async () => { if (window.confirm('Delete this assembly? Estimates that already used it keep their lines.')) await send({ action: 'delete_assembly', id: assembly.id }).catch(() => null); }}>Delete</button></div>
          </article>;
        })}
        {data.assemblies.length === 0 && <p className="field-help">No assemblies yet. Install the sample library from the Library tab, or build your first assembly.</p>}
      </div>
      {(editingAssembly === 'new' || data.assemblies.some(a => a.id === editingAssembly)) && <AssemblyEditor key={editingAssembly} assembly={data.assemblies.find(a => a.id === editingAssembly) || null} lines={data.assemblyLines.filter(line => line.assembly_id === editingAssembly)} items={data.items} units={data.units} sections={data.sections} busy={busy} send={send} close={() => setEditingAssembly('')} />}
    </section>}

    <aside className="est-module-notes"><small>ABOUT THIS MODULE</small><ul>{module.limitations.map(note => <li key={note}>{note}</li>)}</ul></aside>
  </div>;
}

function LineRow({ line, units, sections, send }: { line: Line; units: string[]; sections: string[]; send: (body: Record<string, unknown>) => Promise<unknown> }) {
  const [quantity, setQuantity] = useState(String(Number(line.quantity_milli) / 1000));
  const [price, setPrice] = useState(dollars(line.unit_price_cents));
  const dirty = quantity !== String(Number(line.quantity_milli) / 1000) || price !== dollars(line.unit_price_cents);
  return <div className={`est-row${line.status === 'draft' ? ' draft' : ''}`} role="row">
    <span className="est-line-desc"><b>{line.description}</b><small>{line.section} · {line.source === 'template' ? 'from assembly' : line.source === 'ai-draft' ? 'AI draft' : 'manual'}{line.status === 'draft' ? ' · UNCONFIRMED' : ''}</small></span>
    <span><input aria-label="Quantity" type="number" step="0.001" min="0.001" value={quantity} onChange={e => setQuantity(e.target.value)} /></span>
    <span>{line.unit}<select aria-label="Unit" value={line.unit} onChange={async e => { await send({ action: 'update_line', id: line.id, description: line.description, section: line.section, unit: e.target.value, quantity: Number(line.quantity_milli) / 1000, unitPrice: Number(line.unit_price_cents) / 100, labor: Number(line.labor_cents) / 100, material: Number(line.material_cents) / 100, equipment: Number(line.equipment_cents) / 100, isAlternate: line.is_alternate === 1 }).catch(() => null); }}>{units.map(u => <option key={u} value={u}>{u}</option>)}</select></span>
    <span><input aria-label="Unit price" type="number" step="0.01" min="0" value={price} onChange={e => setPrice(e.target.value)} /></span>
    <span className="est-line-amount">{money(Math.round((Number(quantity) || 0) * 1000 * (Number(price) || 0) * 100 / 1000))}</span>
    <span><input aria-label="Alternate" type="checkbox" checked={line.is_alternate === 1} onChange={async e => { await send({ action: 'update_line', id: line.id, description: line.description, section: line.section, unit: line.unit, quantity: Number(line.quantity_milli) / 1000, unitPrice: Number(line.unit_price_cents) / 100, labor: Number(line.labor_cents) / 100, material: Number(line.material_cents) / 100, equipment: Number(line.equipment_cents) / 100, isAlternate: e.target.checked }).catch(() => null); }} /></span>
    <span className="est-row-actions">
      {dirty && <button onClick={async () => { await send({ action: 'update_line', id: line.id, description: line.description, section: line.section, unit: line.unit, quantity: Number(quantity), unitPrice: Number(price), labor: Number(line.labor_cents) / 100, material: Number(line.material_cents) / 100, equipment: Number(line.equipment_cents) / 100, isAlternate: line.is_alternate === 1 }).catch(() => null); }}>Save</button>}
      <select aria-label="Section" value={line.section} onChange={async e => { await send({ action: 'update_line', id: line.id, description: line.description, section: e.target.value, unit: line.unit, quantity: Number(line.quantity_milli) / 1000, unitPrice: Number(line.unit_price_cents) / 100, labor: Number(line.labor_cents) / 100, material: Number(line.material_cents) / 100, equipment: Number(line.equipment_cents) / 100, isAlternate: line.is_alternate === 1 }).catch(() => null); }}>{sections.map(s => <option key={s} value={s}>{s}</option>)}</select>
      {line.status === 'draft' && <button onClick={() => send({ action: 'confirm_line', estimateId: line.estimate_id, id: line.id }).catch(() => null)}>Confirm ✓</button>}
      <button onClick={async () => { if (window.confirm('Remove this line?')) await send({ action: 'remove_line', id: line.id }).catch(() => null); }}>Remove</button>
    </span>
  </div>;
}

type DraftLine = { itemId: string; description: string; section: string; unit: string; quantity: string; unitPrice: string; labor: string; material: string; equipment: string };
function AssemblyEditor({ assembly, lines, items, units, sections, busy, send, close }: { assembly: Assembly | null; lines: AssemblyLine[]; items: Item[]; units: string[]; sections: string[]; busy: boolean; send: (body: Record<string, unknown>) => Promise<unknown>; close: () => void }) {
  const [draft, setDraft] = useState<DraftLine[]>(lines.length ? lines.map(line => ({ itemId: line.item_id || '', description: line.description, section: line.section, unit: line.unit, quantity: String(Number(line.quantity_milli) / 1000), unitPrice: dollars(line.unit_price_cents), labor: dollars(line.labor_cents), material: dollars(line.material_cents), equipment: dollars(line.equipment_cents) })) : [{ itemId: '', description: '', section: sections[0] || 'General', unit: 'EA', quantity: '1', unitPrice: '0', labor: '0', material: '0', equipment: '0' }]);
  const update = (index: number, patch: Partial<DraftLine>) => setDraft(current => current.map((line, i) => i === index ? { ...line, ...patch } : line));
  return <form className="command-panel est-assembly-editor" onSubmit={async (e: FormEvent<HTMLFormElement>) => { e.preventDefault(); const values = Object.fromEntries(new FormData(e.currentTarget)); const result = await send({ action: 'save_assembly', id: assembly?.id || '', name: values.name, description: values.description, unit: values.unit, lines: draft.map(line => ({ itemId: line.itemId, description: line.description, section: line.section, unit: line.unit, quantity: Number(line.quantity), unitPrice: Number(line.unitPrice), labor: Number(line.labor), material: Number(line.material), equipment: Number(line.equipment) })) }).catch(() => null); if (result) close(); }}>
    <small>{assembly ? 'EDIT ASSEMBLY' : 'NEW ASSEMBLY'}</small>
    <div className="est-grid">
      <label>Assembly name<input name="name" required defaultValue={assembly?.name || ''} placeholder="Slab on Grade" /></label>
      <label>Priced per<select name="unit" defaultValue={assembly?.unit || 'EA'}>{units.map(u => <option key={u} value={u}>{u}</option>)}</select></label>
    </div>
    <label>Description<textarea name="description" rows={2} defaultValue={assembly?.description || ''} placeholder="What this chunk of work covers" /></label>
    <div className="est-assembly-lines">
      {draft.map((line, index) => <div key={index} className="est-assembly-line">
        <label>Library item<select value={line.itemId} onChange={e => { const item = items.find(i => i.id === e.target.value); update(index, item ? { itemId: item.id, description: item.description, section: item.section, unit: item.unit, unitPrice: dollars(item.unit_price_cents), labor: dollars(item.labor_cents), material: dollars(item.material_cents), equipment: dollars(item.equipment_cents) } : { itemId: '' }); }}><option value="">Type it myself</option>{items.filter(i => i.active).map(i => <option key={i.id} value={i.id}>{i.description}</option>)}</select></label>
        <label>Description<input value={line.description} required onChange={e => update(index, { description: e.target.value })} /></label>
        <label>Section<select value={line.section} onChange={e => update(index, { section: e.target.value })}>{sections.map(s => <option key={s} value={s}>{s}</option>)}</select></label>
        <label>Qty per unit<input type="number" step="0.001" min="0.001" value={line.quantity} onChange={e => update(index, { quantity: e.target.value })} /></label>
        <label>Unit<select value={line.unit} onChange={e => update(index, { unit: e.target.value })}>{units.map(u => <option key={u} value={u}>{u}</option>)}</select></label>
        <label>Price $<input type="number" step="0.01" min="0" value={line.unitPrice} onChange={e => update(index, { unitPrice: e.target.value })} /></label>
        <label>Labor $<input type="number" step="0.01" min="0" value={line.labor} onChange={e => update(index, { labor: e.target.value })} /></label>
        <label>Material $<input type="number" step="0.01" min="0" value={line.material} onChange={e => update(index, { material: e.target.value })} /></label>
        <label>Equip. $<input type="number" step="0.01" min="0" value={line.equipment} onChange={e => update(index, { equipment: e.target.value })} /></label>
        <button type="button" onClick={() => setDraft(current => current.filter((_, i) => i !== index))} disabled={draft.length === 1}>Remove line</button>
      </div>)}
    </div>
    <div className="est-actions"><button type="button" onClick={() => setDraft(current => [...current, { itemId: '', description: '', section: sections[0] || 'General', unit: 'EA', quantity: '1', unitPrice: '0', labor: '0', material: '0', equipment: '0' }])}>+ Add line</button>
      <button className="command-primary" disabled={busy}>{assembly ? 'Save assembly' : 'Create assembly'}</button>
      <button type="button" onClick={close}>Cancel</button></div>
  </form>;
}
