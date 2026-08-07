import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { AUTH_COOKIE_NAMES } from '../../server/auth/constants';
import { getUserFromAccessToken } from '../../server/auth/service';
import { LogoutButton } from './logout-button';
import { ThemeToggle } from '../../components/theme-toggle';
import { NotificationMenu } from './notification-menu';
import { GlobalSearch } from './global-search';

export default async function ProtectedLayout({ children }: Readonly<{ children: React.ReactNode }>): Promise<React.ReactElement> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(AUTH_COOKIE_NAMES.accessToken)?.value;
  const currentUser = await getUserFromAccessToken(accessToken);

  if (!currentUser) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto flex min-h-screen max-w-[1600px]">
        <aside className="hidden w-72 shrink-0 border-r bg-white/90 p-6 lg:block">
          <div className="mb-8">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-red-600">AIOU Estate</p>
            <h2 className="mt-2 text-xl font-semibold">Estate Management</h2>
          </div>
          <nav className="space-y-1 text-sm text-slate-700">
            <a className="block rounded-lg bg-red-50 px-3 py-2 font-medium text-red-700" href="/dashboard">Dashboard</a>
            <a className="block rounded-lg px-3 py-2 hover:bg-slate-100" href="/master-data">Master Data</a>
            <a className="block rounded-lg px-3 py-2 hover:bg-slate-100" href="/properties">Properties</a>
            <a className="block rounded-lg px-3 py-2 hover:bg-slate-100" href="/bookings">Bookings</a>
            <a className="block rounded-lg px-3 py-2 hover:bg-slate-100" href="/allocations">Allocations</a>
            <a className="block rounded-lg px-3 py-2 hover:bg-slate-100" href="/shop-billing">Shop Billing</a>
            <a className="block rounded-lg px-3 py-2 hover:bg-slate-100" href="/flats">Flats</a>
            <a className="block rounded-lg px-3 py-2 hover:bg-slate-100" href="/reports">Reports</a>
          </nav>
        </aside>
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex items-center justify-between border-b bg-white px-4 py-3 sm:px-6">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Estate Office</p>
              <h1 className="text-lg font-semibold">Dashboard</h1>
            </div>
            <div className="flex items-center gap-3">
              <GlobalSearch />
              <NotificationMenu />
              <ThemeToggle />
              <span className="hidden text-sm font-medium sm:inline">{currentUser.displayName}</span>
              <LogoutButton />
            </div>
          </header>
          <nav aria-label="Mobile navigation" className="flex gap-1 overflow-x-auto border-b bg-white px-3 py-2 text-sm lg:hidden">
            {[['Dashboard','/dashboard'],['Properties','/properties'],['Bookings','/bookings'],['Allocations','/allocations'],['Shops','/shop-billing'],['Flats','/flats'],['Reports','/reports']].map(([label,href]) => <a key={href} className="whitespace-nowrap rounded-lg px-3 py-2 hover:bg-slate-100" href={href}>{label}</a>)}
          </nav>
          <main className="flex-1 px-4 py-6 sm:px-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
