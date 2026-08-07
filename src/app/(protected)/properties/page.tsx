'use client';

import { useCallback, useEffect, useState } from 'react';

type Option = { id: string; name: string; buildingId?: string };
type PropertyRow = { id: string; propertyCode: string; displayName: string; capacity?: number; operationalStatus: string; availabilityStatus: string; occupancyStatus: string; building: Option; floor: Option; propertyType: Option };
type Envelope<T> = { data?: T; error?: { message: string } };
function csrfToken(): string { return decodeURIComponent(document.cookie.split('; ').find((item) => item.startsWith('ems_csrf_token='))?.split('=')[1] ?? ''); }

export default function PropertiesPage(): React.ReactElement {
  const [rows, setRows] = useState<PropertyRow[]>([]);
  const [buildings, setBuildings] = useState<Option[]>([]);
  const [floors, setFloors] = useState<Option[]>([]);
  const [types, setTypes] = useState<Option[]>([]);
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState<string>();
  const load = useCallback(async () => { const response = await fetch(`/api/v1/properties?pageSize=100&search=${encodeURIComponent(search)}`); const payload = await response.json() as Envelope<PropertyRow[]>; setRows(payload.data ?? []); }, [search]);
  useEffect(() => { let active = true; void fetch(`/api/v1/properties?pageSize=100&search=${encodeURIComponent(search)}`).then((response) => response.json() as Promise<Envelope<PropertyRow[]>>).then((payload) => { if (active) setRows(payload.data ?? []); }); return () => { active = false; }; }, [search]);
  useEffect(() => { void Promise.all([
    fetch('/api/v1/master-data/buildings?pageSize=100').then((r) => r.json() as Promise<Envelope<Option[]>>),
    fetch('/api/v1/master-data/floors?pageSize=100').then((r) => r.json() as Promise<Envelope<Option[]>>),
    fetch('/api/v1/master-data/property-types?pageSize=100').then((r) => r.json() as Promise<Envelope<Option[]>>),
  ]).then(([b, f, t]) => { setBuildings(b.data ?? []); setFloors(f.data ?? []); setTypes(t.data ?? []); }); }, []);

  async function create(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault(); const form = new FormData(event.currentTarget);
    const body = { propertyCode: form.get('propertyCode'), displayName: form.get('displayName'), buildingId: form.get('buildingId'), floorId: form.get('floorId'), propertyTypeId: form.get('propertyTypeId'), capacity: Number(form.get('capacity') || 0), isPaid: form.get('isPaid') === 'on', operationalStatus: 'ACTIVE', availabilityStatus: 'AVAILABLE', occupancyStatus: 'VACANT', facilityIds: [] };
    const response = await fetch('/api/v1/properties', { method: 'POST', headers: { 'content-type': 'application/json', 'x-csrf-token': csrfToken() }, body: JSON.stringify(body) });
    const payload = await response.json() as Envelope<unknown>; setMessage(response.ok ? 'Property created.' : payload.error?.message ?? 'Unable to create property'); if (response.ok) { event.currentTarget.reset(); await load(); }
  }
  async function archive(id: string): Promise<void> { if (!window.confirm('Archive this property?')) return; const response = await fetch(`/api/v1/properties/${id}`, { method: 'DELETE', headers: { 'x-csrf-token': csrfToken() } }); const payload = await response.json() as Envelope<unknown>; setMessage(response.ok ? 'Property archived.' : payload.error?.message); if (response.ok) await load(); }

  return <div className="space-y-6"><header><h1 className="text-2xl font-semibold">Properties</h1><p className="text-sm text-slate-600 dark:text-slate-300">Shared register for rooms, offices, shops, flats, and event spaces.</p></header>
    <section className="rounded-2xl border bg-white p-4 shadow-sm dark:bg-slate-900"><form onSubmit={create} className="grid gap-3 md:grid-cols-2 xl:grid-cols-4"><input required name="propertyCode" placeholder="Property code" className="rounded-lg border bg-transparent px-3 py-2"/><input required name="displayName" placeholder="Display name" className="rounded-lg border bg-transparent px-3 py-2"/><select required name="buildingId" className="rounded-lg border bg-transparent px-3 py-2"><option value="">Building</option>{buildings.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select><select required name="floorId" className="rounded-lg border bg-transparent px-3 py-2"><option value="">Floor</option>{floors.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select><select required name="propertyTypeId" className="rounded-lg border bg-transparent px-3 py-2"><option value="">Property type</option>{types.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select><input name="capacity" type="number" min="0" placeholder="Capacity" className="rounded-lg border bg-transparent px-3 py-2"/><label className="flex items-center gap-2 px-2"><input name="isPaid" type="checkbox"/> Paid property</label><button className="rounded-lg bg-red-600 px-4 py-2 font-medium text-white">Add property</button></form>{message ? <p role="status" className="mt-3 text-sm">{message}</p> : null}</section>
    <section className="overflow-hidden rounded-2xl border bg-white shadow-sm dark:bg-slate-900"><div className="border-b p-4"><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search properties" className="w-full max-w-sm rounded-lg border bg-transparent px-3 py-2"/></div>{rows.length === 0 ? <p className="p-6 text-slate-500">No properties found.</p> : <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-slate-50 dark:bg-slate-800"><tr><th className="p-3">Code</th><th className="p-3">Property</th><th className="p-3">Location</th><th className="p-3">Type</th><th className="p-3">Statuses</th><th className="p-3">Action</th></tr></thead><tbody>{rows.map((row) => <tr key={row.id} className="border-t"><td className="p-3 font-medium">{row.propertyCode}</td><td className="p-3">{row.displayName}</td><td className="p-3">{row.building.name} / {row.floor.name}</td><td className="p-3">{row.propertyType.name}</td><td className="p-3">{row.operationalStatus} · {row.availabilityStatus} · {row.occupancyStatus}</td><td className="p-3"><button onClick={() => void archive(row.id)} className="text-red-700 hover:underline">Archive</button></td></tr>)}</tbody></table></div>}</section></div>;
}
