'use client';

import { useCallback, useEffect, useState } from 'react';

const resources = ['buildings', 'floors', 'departments', 'property-types', 'room-types', 'facilities'] as const;
type Resource = typeof resources[number];
type Row = { id: string; code: string; name: string; category?: string; sortOrder?: number; isEnabled: boolean; building?: { name: string } };
type Envelope = { success: boolean; data?: Row[]; meta?: { total: number }; error?: { message: string } };

function csrfToken(): string { return decodeURIComponent(document.cookie.split('; ').find((item) => item.startsWith('ems_csrf_token='))?.split('=')[1] ?? ''); }

export default function MasterDataPage(): React.ReactElement {
  const [resource, setResource] = useState<Resource>('buildings');
  const [rows, setRows] = useState<Row[]>([]);
  const [buildings, setBuildings] = useState<Row[]>([]);
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState<string>();
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (): Promise<void> => {
    const response = await fetch(`/api/v1/master-data/${resource}?pageSize=100&search=${encodeURIComponent(search)}`);
    const payload = await response.json() as Envelope;
    setRows(payload.data ?? []); setMessage(response.ok ? undefined : payload.error?.message); setLoading(false);
  }, [resource, search]);

  useEffect(() => { let active = true; void fetch(`/api/v1/master-data/${resource}?pageSize=100&search=${encodeURIComponent(search)}`).then((response) => response.json() as Promise<Envelope>).then((payload) => { if (active) { setRows(payload.data ?? []); setMessage(payload.error?.message); setLoading(false); } }); return () => { active = false; }; }, [resource, search]);
  useEffect(() => { void fetch('/api/v1/master-data/buildings?pageSize=100').then((response) => response.json()).then((payload: Envelope) => setBuildings(payload.data ?? [])); }, []);

  async function create(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const body: Record<string, unknown> = { code: form.get('code'), name: form.get('name'), isEnabled: true };
    if (resource === 'floors') { body.buildingId = form.get('buildingId'); body.sortOrder = Number(form.get('sortOrder') ?? 0); }
    if (resource === 'property-types') body.category = form.get('category');
    const response = await fetch(`/api/v1/master-data/${resource}`, { method: 'POST', headers: { 'content-type': 'application/json', 'x-csrf-token': csrfToken() }, body: JSON.stringify(body) });
    const payload = await response.json() as Envelope;
    setMessage(response.ok ? 'Record created.' : payload.error?.message ?? 'Unable to create record');
    if (response.ok) { event.currentTarget.reset(); await load(); }
  }

  async function archive(id: string): Promise<void> {
    if (!window.confirm('Archive this record? Historical references will be preserved.')) return;
    const response = await fetch(`/api/v1/master-data/${resource}/${id}`, { method: 'DELETE', headers: { 'x-csrf-token': csrfToken() } });
    const payload = await response.json() as Envelope;
    setMessage(response.ok ? 'Record archived.' : payload.error?.message ?? 'Unable to archive record');
    if (response.ok) await load();
  }

  return <div className="space-y-6"><header><h1 className="text-2xl font-semibold">Master data</h1><p className="text-sm text-slate-600 dark:text-slate-300">Manage reusable estate classifications without deleting historical references.</p></header>
    <div className="flex gap-2 overflow-x-auto pb-2">{resources.map((item) => <button key={item} onClick={() => setResource(item)} className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium ${resource === item ? 'bg-red-600 text-white' : 'border bg-white dark:bg-slate-900'}`}>{item.replaceAll('-', ' ')}</button>)}</div>
    <section className="rounded-2xl border bg-white p-4 shadow-sm dark:bg-slate-900"><form onSubmit={create} className="grid gap-3 md:grid-cols-2 xl:grid-cols-5"><input required name="code" placeholder="Code" className="rounded-lg border bg-transparent px-3 py-2"/><input required name="name" placeholder="Name" className="rounded-lg border bg-transparent px-3 py-2"/>{resource === 'property-types' ? <input required name="category" placeholder="Category" className="rounded-lg border bg-transparent px-3 py-2"/> : null}{resource === 'floors' ? <><select required name="buildingId" className="rounded-lg border bg-transparent px-3 py-2"><option value="">Select building</option>{buildings.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select><input name="sortOrder" type="number" min="0" defaultValue="0" className="rounded-lg border bg-transparent px-3 py-2"/></> : null}<button className="rounded-lg bg-red-600 px-4 py-2 font-medium text-white">Add record</button></form>{message ? <p role="status" className="mt-3 text-sm">{message}</p> : null}</section>
    <section className="overflow-hidden rounded-2xl border bg-white shadow-sm dark:bg-slate-900"><div className="border-b p-4"><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search code or name" className="w-full max-w-sm rounded-lg border bg-transparent px-3 py-2"/></div>{loading ? <p className="p-6">Loading…</p> : rows.length === 0 ? <p className="p-6 text-slate-500">No records found.</p> : <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-slate-50 dark:bg-slate-800"><tr><th className="p-3">Code</th><th className="p-3">Name</th><th className="p-3">Details</th><th className="p-3">Status</th><th className="p-3">Action</th></tr></thead><tbody>{rows.map((row) => <tr key={row.id} className="border-t"><td className="p-3 font-medium">{row.code}</td><td className="p-3">{row.name}</td><td className="p-3">{row.building?.name ?? row.category ?? (row.sortOrder ?? '—')}</td><td className="p-3">{row.isEnabled ? 'Enabled' : 'Disabled'}</td><td className="p-3"><button onClick={() => void archive(row.id)} className="text-red-700 hover:underline">Archive</button></td></tr>)}</tbody></table></div>}</section></div>;
}
