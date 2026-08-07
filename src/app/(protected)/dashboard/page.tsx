import { prisma } from '../../../server/db/prisma';

export default async function DashboardPage(): Promise<React.ReactElement> {
  const [total, active, vacant, maintenance, recent] = await Promise.all([
    prisma.property.count({ where: { deletedAt: null } }),
    prisma.property.count({ where: { deletedAt: null, operationalStatus: 'ACTIVE' } }),
    prisma.property.count({ where: { deletedAt: null, occupancyStatus: 'VACANT' } }),
    prisma.property.count({ where: { deletedAt: null, operationalStatus: 'MAINTENANCE' } }),
    prisma.auditLog.findMany({ where: { entityType: { in: ['Property', 'Building', 'Floor', 'Department', 'PropertyType', 'RoomType', 'Facility'] } }, orderBy: { createdAt: 'desc' }, take: 6, include: { actor: { select: { displayName: true } } } }),
  ]);
  const stats = [{ label: 'Registered properties', value: total }, { label: 'Active properties', value: active }, { label: 'Vacant properties', value: vacant }, { label: 'Under maintenance', value: maintenance }];
  return <div className="space-y-6"><section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{stats.map((item) => <article key={item.label} className="rounded-2xl border bg-white p-5 shadow-sm dark:bg-slate-900"><p className="text-sm text-slate-500 dark:text-slate-400">{item.label}</p><p className="mt-3 text-3xl font-semibold">{item.value}</p></article>)}</section><section className="grid gap-4 xl:grid-cols-2"><article className="rounded-2xl border bg-white p-5 shadow-sm dark:bg-slate-900"><h2 className="font-semibold">Recent property activity</h2>{recent.length ? <ul className="mt-4 space-y-3 text-sm">{recent.map((entry) => <li key={entry.id} className="border-b pb-2 last:border-0"><span className="font-medium">{entry.action.replaceAll('_', ' ')}</span><span className="block text-slate-500">{entry.actor?.displayName ?? 'System'} · {entry.createdAt.toLocaleString('en-PK', { timeZone: 'Asia/Karachi' })}</span></li>)}</ul> : <p className="mt-2 text-sm text-slate-600">No activity recorded yet.</p>}</article><article className="rounded-2xl border bg-white p-5 shadow-sm dark:bg-slate-900"><h2 className="font-semibold">Quick actions</h2><div className="mt-4 flex flex-wrap gap-2"><a href="/properties" className="rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white">Add property</a><a href="/master-data" className="rounded-lg border px-3 py-2 text-sm font-medium">Manage master data</a></div></article></section></div>;
}
