import { hasWorkspaceAccess, workspaceAccessResponse, workspaceContext, workspaceModuleAccessResponse } from '../../../contractor-auth';
import { estimateSections, estimateUnits, starterEstimateAssemblies, starterEstimateItems, type EstimateUnit } from '../../../estimate-builder';

const clean = (value: unknown, max = 500) => String(value ?? '').trim().slice(0, max);
const stamp = () => new Date().toISOString();
const cents = (value: unknown) => Math.max(0, Math.round(Number(value || 0) * 100));
const basisPoints = (value: unknown) => Math.max(0, Math.min(100000, Math.round(Number(value || 0) * 100)));
const milli = (value: unknown) => Math.max(0, Math.round(Number(value || 0) * 1000));
function unit(value: unknown): EstimateUnit | null { const candidate = clean(value, 10).toUpperCase() as EstimateUnit; return estimateUnits.includes(candidate) ? candidate : null; }
function section(value: unknown) { const candidate = clean(value, 80); return candidate || 'General'; }

type Ctx = NonNullable<Awaited<ReturnType<typeof workspaceContext>>>;
async function access() {
  const context = await workspaceContext();
  if (!hasWorkspaceAccess(context)) return { context: null, response: workspaceAccessResponse(context)! };
  const denied = workspaceModuleAccessResponse(context, 'job-management');
  return denied ? { context: null, response: denied } : { context, response: null };
}
async function owned(context: Ctx, table: string, id: string) {
  return context.db.prepare(`SELECT id FROM ${table} WHERE id=? AND workspace_id=? LIMIT 1`).bind(id, context.workspaceId).first();
}
async function draftLineCount(context: Ctx, estimateId: string) {
  const row = await context.db.prepare("SELECT COUNT(*) count FROM estimate_lines WHERE workspace_id=? AND estimate_id=? AND status='draft'").bind(context.workspaceId, estimateId).first<{ count: number }>();
  return Number(row?.count || 0);
}

export async function GET() {
  const gate = await access(); if (!gate.context) return gate.response!;
  const context = gate.context;
  const [items, assemblies, assemblyLines, estimates, lines, documents, customers, projects] = await context.db.batch([
    context.db.prepare('SELECT * FROM estimate_items WHERE workspace_id=? ORDER BY active DESC,section,description').bind(context.workspaceId),
    context.db.prepare('SELECT * FROM estimate_assemblies WHERE workspace_id=? ORDER BY active DESC,name').bind(context.workspaceId),
    context.db.prepare('SELECT * FROM estimate_assembly_lines WHERE workspace_id=? ORDER BY assembly_id,sort_order').bind(context.workspaceId),
    context.db.prepare(`SELECT e.*,c.name customer_name,c.company customer_company,p.name linked_project_name FROM estimates e LEFT JOIN customers c ON c.id=e.customer_id AND c.workspace_id=e.workspace_id LEFT JOIN projects p ON p.id=e.project_id AND p.workspace_id=e.workspace_id WHERE e.workspace_id=? ORDER BY e.updated_at DESC`).bind(context.workspaceId),
    context.db.prepare('SELECT * FROM estimate_lines WHERE workspace_id=? ORDER BY estimate_id,sort_order,created_at').bind(context.workspaceId),
    context.db.prepare('SELECT * FROM estimate_documents WHERE workspace_id=? ORDER BY created_at DESC').bind(context.workspaceId),
    context.db.prepare('SELECT id,name,company FROM customers WHERE workspace_id=? ORDER BY name').bind(context.workspaceId),
    context.db.prepare("SELECT id,name,customer_id,pipeline_stage FROM projects WHERE workspace_id=? AND status='active' ORDER BY updated_at DESC").bind(context.workspaceId),
  ]);
  return Response.json({
    items: items.results, assemblies: assemblies.results, assemblyLines: assemblyLines.results,
    estimates: estimates.results, lines: lines.results, documents: documents.results,
    customers: customers.results, projects: projects.results,
    units: estimateUnits, sections: estimateSections, trialDaysRemaining: context.trialDaysRemaining,
  });
}

export async function POST(request: Request) {
  const gate = await access(); if (!gate.context) return gate.response!;
  const context = gate.context;
  let body: Record<string, unknown>;
  try { body = await request.json() as Record<string, unknown>; } catch { return Response.json({ error: 'Invalid request.' }, { status: 400 }); }
  const action = clean(body.action, 40), now = stamp();

  if (action === 'install_starters') {
    let itemsAdded = 0, assembliesAdded = 0;
    for (const [key, description, itemSection, itemUnit, price, labor, material, equipment] of starterEstimateItems) {
      const result = await context.db.prepare(`INSERT OR IGNORE INTO estimate_items (id,workspace_id,sample_key,description,section,unit,unit_price_cents,labor_cents,material_cents,equipment_cents,is_sample,created_by,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,1,?,?,?)`)
        .bind(crypto.randomUUID(), context.workspaceId, key, description, itemSection, itemUnit, price, labor, material, equipment, context.user.id, now, now).run();
      itemsAdded += Number(result.meta.changes || 0);
    }
    const itemIds = new Map<string, Record<string, unknown>>();
    const itemRows = await context.db.prepare('SELECT * FROM estimate_items WHERE workspace_id=? AND sample_key IS NOT NULL').bind(context.workspaceId).all<Record<string, unknown>>();
    for (const row of itemRows.results) itemIds.set(String(row.sample_key), row);
    for (const [key, name, description, assemblyUnit, lines] of starterEstimateAssemblies) {
      const existing = await context.db.prepare('SELECT id FROM estimate_assemblies WHERE workspace_id=? AND sample_key=?').bind(context.workspaceId, key).first<{ id: string }>();
      if (existing) continue;
      const assemblyId = crypto.randomUUID();
      await context.db.prepare(`INSERT INTO estimate_assemblies (id,workspace_id,sample_key,name,description,unit,is_sample,created_by,created_at,updated_at) VALUES (?,?,?,?,?,?,1,?,?,?)`)
        .bind(assemblyId, context.workspaceId, key, name, description, assemblyUnit, context.user.id, now, now).run();
      assembliesAdded += 1;
      let order = 0;
      for (const [itemKey, quantity] of lines) {
        const item = itemIds.get(itemKey); if (!item) continue;
        await context.db.prepare(`INSERT INTO estimate_assembly_lines (id,workspace_id,assembly_id,item_id,section,description,unit,quantity_milli,unit_price_cents,labor_cents,material_cents,equipment_cents,sort_order,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
          .bind(crypto.randomUUID(), context.workspaceId, assemblyId, String(item.id), String(item.section), String(item.description), String(item.unit), Math.round(quantity * 1000), Number(item.unit_price_cents), Number(item.labor_cents), Number(item.material_cents), Number(item.equipment_cents), order++, now, now).run();
      }
    }
    return Response.json({ ok: true, itemsAdded, assembliesAdded });
  }

  if (action === 'save_item') {
    const id = clean(body.id, 100) || crypto.randomUUID();
    const description = clean(body.description, 300), itemUnit = unit(body.unit);
    if (!description || !itemUnit) return Response.json({ error: 'Description and a valid unit are required.' }, { status: 400 });
    const values = [description, section(body.section), itemUnit, cents(body.unitPrice), cents(body.labor), cents(body.material), cents(body.equipment), body.active === false ? 0 : 1];
    if (await owned(context, 'estimate_items', id)) {
      await context.db.prepare('UPDATE estimate_items SET description=?,section=?,unit=?,unit_price_cents=?,labor_cents=?,material_cents=?,equipment_cents=?,active=?,is_sample=0,updated_at=? WHERE id=? AND workspace_id=?').bind(...values, now, id, context.workspaceId).run();
    } else {
      await context.db.prepare(`INSERT INTO estimate_items (id,workspace_id,description,section,unit,unit_price_cents,labor_cents,material_cents,equipment_cents,active,created_by,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(id, context.workspaceId, ...values, context.user.id, now, now).run();
    }
    return Response.json({ ok: true, id });
  }

  if (action === 'delete_item') {
    const id = clean(body.id, 100);
    const used = await context.db.prepare(`SELECT (SELECT COUNT(*) FROM estimate_assembly_lines WHERE workspace_id=? AND item_id=?)+(SELECT COUNT(*) FROM estimate_lines WHERE workspace_id=? AND item_id=?) count`).bind(context.workspaceId, id, context.workspaceId, id).first<{ count: number }>();
    if (Number(used?.count)) {
      await context.db.prepare('UPDATE estimate_items SET active=0,updated_at=? WHERE id=? AND workspace_id=?').bind(now, id, context.workspaceId).run();
      return Response.json({ ok: true, archived: true });
    }
    const result = await context.db.prepare('DELETE FROM estimate_items WHERE id=? AND workspace_id=?').bind(id, context.workspaceId).run();
    return result.meta.changes ? Response.json({ ok: true }) : Response.json({ error: 'Library item not found.' }, { status: 404 });
  }

  if (action === 'save_assembly') {
    const id = clean(body.id, 100) || crypto.randomUUID();
    const name = clean(body.name, 160), assemblyUnit = unit(body.unit);
    if (!name || !assemblyUnit) return Response.json({ error: 'Assembly name and a valid unit are required.' }, { status: 400 });
    const rawLines = Array.isArray(body.lines) ? body.lines as Array<Record<string, unknown>> : [];
    const lines = rawLines.map((line, index) => ({
      itemId: clean(line.itemId, 100), section: section(line.section), description: clean(line.description, 300),
      unit: unit(line.unit) || 'EA', quantityMilli: Math.max(1, milli(line.quantity ?? 1)),
      unitPrice: cents(line.unitPrice), labor: cents(line.labor), material: cents(line.material), equipment: cents(line.equipment), sortOrder: index,
    })).filter(line => line.description);
    if (!lines.length) return Response.json({ error: 'Add at least one line to the assembly.' }, { status: 400 });
    for (const line of lines) if (line.itemId && !await owned(context, 'estimate_items', line.itemId)) return Response.json({ error: 'One assembly line points at a library item outside this workspace.' }, { status: 400 });
    if (await owned(context, 'estimate_assemblies', id)) {
      await context.db.prepare('UPDATE estimate_assemblies SET name=?,description=?,unit=?,active=?,is_sample=0,updated_at=? WHERE id=? AND workspace_id=?').bind(name, clean(body.description, 800), assemblyUnit, body.active === false ? 0 : 1, now, id, context.workspaceId).run();
      await context.db.prepare('DELETE FROM estimate_assembly_lines WHERE assembly_id=? AND workspace_id=?').bind(id, context.workspaceId).run();
    } else {
      await context.db.prepare(`INSERT INTO estimate_assemblies (id,workspace_id,name,description,unit,active,created_by,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?)`).bind(id, context.workspaceId, name, clean(body.description, 800), assemblyUnit, body.active === false ? 0 : 1, context.user.id, now, now).run();
    }
    for (const line of lines) {
      await context.db.prepare(`INSERT INTO estimate_assembly_lines (id,workspace_id,assembly_id,item_id,section,description,unit,quantity_milli,unit_price_cents,labor_cents,material_cents,equipment_cents,sort_order,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
        .bind(crypto.randomUUID(), context.workspaceId, id, line.itemId || null, line.section, line.description, line.unit, line.quantityMilli, line.unitPrice, line.labor, line.material, line.equipment, line.sortOrder, now, now).run();
    }
    return Response.json({ ok: true, id });
  }

  if (action === 'delete_assembly') {
    const id = clean(body.id, 100);
    const result = await context.db.prepare('DELETE FROM estimate_assemblies WHERE id=? AND workspace_id=?').bind(id, context.workspaceId).run();
    return result.meta.changes ? Response.json({ ok: true }) : Response.json({ error: 'Assembly not found.' }, { status: 404 });
  }

  if (action === 'create_estimate') {
    const title = clean(body.title, 200);
    if (!title) return Response.json({ error: 'Give the estimate a title.' }, { status: 400 });
    const customerId = clean(body.customerId, 100), projectId = clean(body.projectId, 100);
    if (customerId && !await owned(context, 'customers', customerId)) return Response.json({ error: 'Customer not found in this workspace.' }, { status: 404 });
    if (projectId && !await owned(context, 'projects', projectId)) return Response.json({ error: 'Job not found in this workspace.' }, { status: 404 });
    const id = crypto.randomUUID();
    const countRow = await context.db.prepare('SELECT COUNT(*) count FROM estimates WHERE workspace_id=?').bind(context.workspaceId).first<{ count: number }>();
    let sequence = Number(countRow?.count || 0) + 1, inserted = false;
    for (let attempt = 0; attempt < 25 && !inserted; attempt++, sequence++) {
      try {
        await context.db.prepare(`INSERT INTO estimates (id,workspace_id,estimate_number,title,customer_id,project_id,job_address,markup_basis_points,tax_basis_points,client_note,valid_until,created_by,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
          .bind(id, context.workspaceId, `EST-${String(sequence).padStart(3, '0')}`, title, customerId || null, projectId || null, clean(body.jobAddress, 300), basisPoints(body.markup), basisPoints(body.tax), clean(body.clientNote, 1500), clean(body.validUntil, 20), context.user.id, now, now).run();
        inserted = true;
      } catch { /* number already used; try the next one */ }
    }
    if (!inserted) return Response.json({ error: 'Could not assign an estimate number. Try again.' }, { status: 500 });
    return Response.json({ ok: true, id });
  }

  if (action === 'update_estimate') {
    const id = clean(body.id, 100);
    const existing = await context.db.prepare('SELECT * FROM estimates WHERE id=? AND workspace_id=?').bind(id, context.workspaceId).first<Record<string, unknown>>();
    if (!existing) return Response.json({ error: 'Estimate not found.' }, { status: 404 });
    // Partial update: fields the caller did not send keep their current values.
    const pick = (key: string, current: unknown) => body[key] === undefined ? current : body[key];
    const customerId = clean(pick('customerId', existing.customer_id), 100), projectId = clean(pick('projectId', existing.project_id), 100);
    if (customerId && !await owned(context, 'customers', customerId)) return Response.json({ error: 'Customer not found in this workspace.' }, { status: 404 });
    if (projectId && !await owned(context, 'projects', projectId)) return Response.json({ error: 'Job not found in this workspace.' }, { status: 404 });
    const status = clean(body.status, 20);
    const allowed = ['draft', 'sent', 'approved', 'lost', 'void'];
    if (status && !allowed.includes(status)) return Response.json({ error: 'Use the Mark won action to convert an estimate into a job.' }, { status: 400 });
    if ((status === 'sent' || status === 'approved') && await draftLineCount(context, id) > 0) {
      return Response.json({ error: 'Confirm every line before sending or approving this estimate. Unconfirmed lines are still marked Draft.' }, { status: 409 });
    }
    await context.db.prepare('UPDATE estimates SET title=?,customer_id=?,project_id=?,job_address=?,status=CASE WHEN ?<>"" THEN ? ELSE status END,markup_basis_points=?,tax_basis_points=?,client_note=?,internal_notes=?,valid_until=?,updated_at=? WHERE id=? AND workspace_id=?')
      .bind(clean(pick('title', existing.title), 200) || 'Untitled estimate', customerId || null, projectId || null, clean(pick('jobAddress', existing.job_address), 300), status, status, basisPoints(pick('markup', Number(existing.markup_basis_points) / 100)), basisPoints(pick('tax', Number(existing.tax_basis_points) / 100)), clean(pick('clientNote', existing.client_note), 1500), clean(pick('internalNotes', existing.internal_notes), 1500), clean(pick('validUntil', existing.valid_until), 20), now, id, context.workspaceId).run();
    return Response.json({ ok: true });
  }

  if (action === 'delete_estimate') {
    const id = clean(body.id, 100);
    const result = await context.db.prepare('DELETE FROM estimates WHERE id=? AND workspace_id=?').bind(id, context.workspaceId).run();
    return result.meta.changes ? Response.json({ ok: true }) : Response.json({ error: 'Estimate not found.' }, { status: 404 });
  }

  if (action === 'add_line') {
    const estimateId = clean(body.estimateId, 100);
    if (!await owned(context, 'estimates', estimateId)) return Response.json({ error: 'Estimate not found.' }, { status: 404 });
    const mode = clean(body.mode, 20);
    const maxRow = await context.db.prepare('SELECT COALESCE(MAX(sort_order),-1) max_order FROM estimate_lines WHERE workspace_id=? AND estimate_id=?').bind(context.workspaceId, estimateId).first<{ max_order: number }>();
    let order = Number(maxRow?.max_order ?? -1) + 1;
    const insert = async (values: Record<string, unknown>) => {
      await context.db.prepare(`INSERT INTO estimate_lines (id,workspace_id,estimate_id,item_id,assembly_id,section,description,unit,quantity_milli,unit_price_cents,labor_cents,material_cents,equipment_cents,source,status,is_alternate,sort_order,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
        .bind(crypto.randomUUID(), context.workspaceId, estimateId, values.itemId ?? null, values.assemblyId ?? null, values.section, values.description, values.unit, values.quantityMilli, values.unitPrice, values.labor, values.material, values.equipment, values.source, values.status, values.isAlternate ? 1 : 0, order++, now, now).run();
    };
    if (mode === 'item') {
      const itemId = clean(body.itemId, 100);
      const item = await context.db.prepare('SELECT * FROM estimate_items WHERE id=? AND workspace_id=?').bind(itemId, context.workspaceId).first<Record<string, unknown>>();
      if (!item) return Response.json({ error: 'Library item not found.' }, { status: 404 });
      await insert({ itemId, section: String(item.section), description: String(item.description), unit: String(item.unit), quantityMilli: Math.max(1, milli(body.quantity ?? 1)), unitPrice: Number(item.unit_price_cents), labor: Number(item.labor_cents), material: Number(item.material_cents), equipment: Number(item.equipment_cents), source: 'manual', status: 'confirmed', isAlternate: body.isAlternate === true });
      return Response.json({ ok: true, added: 1 });
    }
    if (mode === 'assembly') {
      const assemblyId = clean(body.assemblyId, 100);
      const assembly = await owned(context, 'estimate_assemblies', assemblyId);
      if (!assembly) return Response.json({ error: 'Assembly not found.' }, { status: 404 });
      const multiplier = Number(body.quantity || 1);
      if (!(multiplier > 0)) return Response.json({ error: 'Assembly quantity must be greater than zero.' }, { status: 400 });
      const assemblyLines = await context.db.prepare('SELECT * FROM estimate_assembly_lines WHERE assembly_id=? AND workspace_id=? ORDER BY sort_order').bind(assemblyId, context.workspaceId).all<Record<string, unknown>>();
      if (!assemblyLines.results.length) return Response.json({ error: 'That assembly has no lines yet.' }, { status: 400 });
      for (const line of assemblyLines.results) {
        await insert({ itemId: line.item_id, assemblyId, section: String(line.section), description: String(line.description), unit: String(line.unit), quantityMilli: Math.max(1, Math.round(Number(line.quantity_milli) * multiplier)), unitPrice: Number(line.unit_price_cents), labor: Number(line.labor_cents), material: Number(line.material_cents), equipment: Number(line.equipment_cents), source: 'template', status: 'draft', isAlternate: body.isAlternate === true });
      }
      return Response.json({ ok: true, added: assemblyLines.results.length });
    }
    if (mode === 'manual') {
      const description = clean(body.description, 300), lineUnit = unit(body.unit);
      if (!description || !lineUnit) return Response.json({ error: 'Description and a valid unit are required.' }, { status: 400 });
      await insert({ section: section(body.section), description, unit: lineUnit, quantityMilli: Math.max(1, milli(body.quantity ?? 1)), unitPrice: cents(body.unitPrice), labor: cents(body.labor), material: cents(body.material), equipment: cents(body.equipment), source: 'manual', status: 'confirmed', isAlternate: body.isAlternate === true });
      return Response.json({ ok: true, added: 1 });
    }
    return Response.json({ error: 'Choose how to add the line: library item, assembly, or manual.' }, { status: 400 });
  }

  if (action === 'update_line') {
    const id = clean(body.id, 100);
    if (!await owned(context, 'estimate_lines', id)) return Response.json({ error: 'Estimate line not found.' }, { status: 404 });
    const lineUnit = unit(body.unit);
    if (!lineUnit) return Response.json({ error: 'Choose a valid unit.' }, { status: 400 });
    await context.db.prepare('UPDATE estimate_lines SET section=?,description=?,unit=?,quantity_milli=?,unit_price_cents=?,labor_cents=?,material_cents=?,equipment_cents=?,is_alternate=?,updated_at=? WHERE id=? AND workspace_id=?')
      .bind(section(body.section), clean(body.description, 300), lineUnit, Math.max(1, milli(body.quantity ?? 1)), cents(body.unitPrice), cents(body.labor), cents(body.material), cents(body.equipment), body.isAlternate === true ? 1 : 0, now, id, context.workspaceId).run();
    return Response.json({ ok: true });
  }

  if (action === 'confirm_line' || action === 'confirm_all_lines') {
    const estimateId = clean(body.estimateId, 100);
    if (!await owned(context, 'estimates', estimateId)) return Response.json({ error: 'Estimate not found.' }, { status: 404 });
    if (action === 'confirm_all_lines') {
      await context.db.prepare("UPDATE estimate_lines SET status='confirmed',updated_at=? WHERE workspace_id=? AND estimate_id=? AND status='draft'").bind(now, context.workspaceId, estimateId).run();
    } else {
      const id = clean(body.id, 100);
      await context.db.prepare("UPDATE estimate_lines SET status='confirmed',updated_at=? WHERE id=? AND workspace_id=? AND estimate_id=?").bind(now, id, context.workspaceId, estimateId).run();
    }
    return Response.json({ ok: true });
  }

  if (action === 'remove_line') {
    const id = clean(body.id, 100);
    const result = await context.db.prepare('DELETE FROM estimate_lines WHERE id=? AND workspace_id=?').bind(id, context.workspaceId).run();
    return result.meta.changes ? Response.json({ ok: true }) : Response.json({ error: 'Estimate line not found.' }, { status: 404 });
  }

  if (action === 'win_estimate') {
    const id = clean(body.estimateId, 100);
    const estimate = await context.db.prepare('SELECT * FROM estimates WHERE id=? AND workspace_id=?').bind(id, context.workspaceId).first<Record<string, unknown>>();
    if (!estimate) return Response.json({ error: 'Estimate not found.' }, { status: 404 });
    if (estimate.status === 'won' && estimate.converted_project_id) return Response.json({ ok: true, projectId: String(estimate.converted_project_id), alreadyWon: true });
    if (await draftLineCount(context, id) > 0) return Response.json({ error: 'Confirm every line before marking this estimate won.' }, { status: 409 });
    const lineCount = await context.db.prepare('SELECT COUNT(*) count FROM estimate_lines WHERE workspace_id=? AND estimate_id=?').bind(context.workspaceId, id).first<{ count: number }>();
    if (!Number(lineCount?.count)) return Response.json({ error: 'Add at least one line before marking this estimate won.' }, { status: 400 });
    let projectId = estimate.project_id ? String(estimate.project_id) : '';
    if (projectId) {
      await context.db.prepare("UPDATE projects SET pipeline_stage='approved',updated_at=? WHERE id=? AND workspace_id=?").bind(now, projectId, context.workspaceId).run();
    } else {
      projectId = crypto.randomUUID();
      let customerName = '';
      if (estimate.customer_id) {
        const customer = await context.db.prepare('SELECT name FROM customers WHERE id=? AND workspace_id=?').bind(String(estimate.customer_id), context.workspaceId).first<{ name: string }>();
        customerName = customer?.name || '';
      }
      await context.db.prepare('INSERT INTO projects (id,owner_id,workspace_id,name,client_name,location,status,created_at,customer_id,pipeline_stage,next_action,scheduled_for,updated_at,crew_intake_token) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)')
        .bind(projectId, context.user.id, context.workspaceId, String(estimate.title), customerName, String(estimate.job_address || ''), 'active', now, estimate.customer_id ?? null, 'approved', 'Schedule the work and confirm the start date', '', now, crypto.randomUUID()).run();
    }
    await context.db.prepare("UPDATE estimates SET status='won',converted_project_id=?,project_id=?,updated_at=? WHERE id=? AND workspace_id=?").bind(projectId, projectId, now, id, context.workspaceId).run();
    return Response.json({ ok: true, projectId });
  }

  if (action === 'register_document') {
    const estimateId = clean(body.estimateId, 100);
    if (!await owned(context, 'estimates', estimateId)) return Response.json({ error: 'Estimate not found.' }, { status: 404 });
    const fileName = clean(body.fileName, 240);
    if (!fileName) return Response.json({ error: 'File name is required.' }, { status: 400 });
    const kind = ['plan', 'spec', 'photo', 'other'].includes(clean(body.kind, 20)) ? clean(body.kind, 20) : 'other';
    const docId = crypto.randomUUID();
    await context.db.prepare(`INSERT INTO estimate_documents (id,workspace_id,estimate_id,kind,file_name,object_key,content_type,size_bytes,created_by,created_at) VALUES (?,?,?,?,?,?,?,?,?,?)`)
      .bind(docId, context.workspaceId, estimateId, kind, fileName, clean(body.objectKey, 400), clean(body.contentType, 120), Math.max(0, Math.round(Number(body.sizeBytes || 0))), context.user.id, now).run();
    return Response.json({ ok: true, id: docId });
  }

  return Response.json({ error: 'Unknown Estimate Builder action.' }, { status: 400 });
}
