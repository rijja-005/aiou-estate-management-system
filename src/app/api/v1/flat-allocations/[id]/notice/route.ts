import { requireRequestContext } from '../../../../../../server/api/auth-context';
import { prisma } from '../../../../../../server/db/prisma';

function escapeHtml(value: string): string { return value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[char]!); }
export async function GET(_request: Request, context: RouteContext<'/api/v1/flat-allocations/[id]/notice'>): Promise<Response> {
  await requireRequestContext('flat.read');
  const { id } = await context.params;
  const row = await prisma.flatAllocation.findUnique({ where: { id }, include: { employee: true, property: true } });
  if (!row) return new Response('Not found', { status: 404 });
  const date = row.expectedVacationDate.toLocaleDateString('en-PK', { dateStyle: 'long', timeZone: 'UTC' });
  const html = `<!doctype html><html><head><title>Vacation notice ${escapeHtml(row.referenceNumber)}</title><style>body{font-family:serif;max-width:800px;margin:60px auto;line-height:1.7}h1{text-align:center}footer{margin-top:80px}.no-print{font-family:sans-serif}@media print{.no-print{display:none}}</style></head><body><button class="no-print" onclick="print()">Print</button><h1>Residential Flat Vacation Notice</h1><p>Reference: <strong>${escapeHtml(row.referenceNumber)}</strong></p><p>To: ${escapeHtml(row.employee.name)} (${escapeHtml(row.employee.employeeNumber)})</p><p>You are requested to vacate residential property <strong>${escapeHtml(row.property.propertyCode)} — ${escapeHtml(row.property.displayName)}</strong> on or before <strong>${date}</strong>.</p><p>This notice reflects the currently approved vacation date. Any subsequent extension must be separately approved and recorded in the Estate Management System.</p><footer>Estate Office<br/>Allama Iqbal Open University</footer></body></html>`;
  return new Response(html, { headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' } });
}
