'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { BarChart3, Building2, CalendarDays, FileText, House, LayoutDashboard, Menu, Settings2, Store, X } from 'lucide-react';
import { GlobalSearch } from './global-search';
import { LogoutButton } from './logout-button';
import { NotificationMenu } from './notification-menu';

const navigation = [
  { href:'/dashboard', label:'Dashboard', description:'Overview', icon:LayoutDashboard },
  { href:'/master-data', label:'Master data', description:'Classification', icon:Settings2 },
  { href:'/properties', label:'Properties', description:'Estate register', icon:Building2 },
  { href:'/bookings', label:'Bookings', description:'Reservations', icon:CalendarDays },
  { href:'/allocations', label:'Office allocations', description:'Department use', icon:FileText },
  { href:'/shop-billing', label:'Shops & billing', description:'Tenancy finance', icon:Store },
  { href:'/flats', label:'Residential flats', description:'Staff housing', icon:House },
  { href:'/reports', label:'Reports', description:'Oversight & exports', icon:BarChart3 },
] as const;

function routeTitle(pathname:string):string { return navigation.find(item=>pathname===item.href||pathname.startsWith(`${item.href}/`))?.label ?? 'Estate Management'; }
function Navigation({pathname,onNavigate}:{pathname:string;onNavigate?:()=>void}):React.ReactElement{return <nav aria-label="Primary navigation" className="space-y-1.5">{navigation.map(({href,label,description,icon:Icon})=>{const active=pathname===href||pathname.startsWith(`${href}/`);return <a key={href} href={href} onClick={onNavigate} aria-current={active?'page':undefined} className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 ${active?'bg-[#fff1f3] text-[#9f1239]':'text-slate-600 hover:bg-[#fff1f3] hover:text-[#9f1239]'}`}><span className={`grid size-9 place-items-center rounded-lg ${active?'bg-white shadow-sm':'bg-[#fff1f3] text-[#a71930]'}`}><Icon size={18}/></span><span><strong className="block text-sm font-semibold">{label}</strong><span className="block text-xs opacity-65">{description}</span></span></a>})}</nav>}

export function AppShell({displayName,children}:{displayName:string;children:React.ReactNode}):React.ReactElement{
 const pathname=usePathname();const [mobileOpen,setMobileOpen]=useState(false);const title=routeTitle(pathname);
 return <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
  <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 border-r bg-[var(--surface)] px-5 py-6 lg:flex lg:flex-col"><a href="/dashboard" className="mb-8 flex items-center gap-3 px-2"><span className="grid size-11 place-items-center rounded-xl bg-[#a71930] text-lg font-bold text-white shadow-sm">A</span><span><span className="block text-xs font-bold uppercase tracking-[.2em] text-[#a71930]">AIOU Estate</span><span className="mt-0.5 block font-semibold">Management System</span></span></a><Navigation pathname={pathname}/><div className="mt-auto rounded-xl border bg-[var(--surface-muted)] p-3"><p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">Signed in as</p><p className="mt-1 truncate text-sm font-semibold">{displayName}</p></div></aside>
  {mobileOpen?<button aria-label="Close navigation overlay" className="fixed inset-0 z-40 bg-slate-950/40 lg:hidden" onClick={()=>setMobileOpen(false)}/>:null}
  <aside className={`fixed inset-y-0 left-0 z-50 w-72 border-r bg-[var(--surface)] p-5 shadow-xl transition-transform lg:hidden ${mobileOpen?'translate-x-0':'-translate-x-full'}`}><div className="mb-6 flex items-center justify-between"><strong>AIOU Estate</strong><button aria-label="Close menu" className="rounded-lg border p-2" onClick={()=>setMobileOpen(false)}><X size={18}/></button></div><Navigation pathname={pathname} onNavigate={()=>setMobileOpen(false)}/></aside>
  <div className="min-w-0 lg:pl-72"><header className="sticky top-0 z-30 border-b bg-white/95 backdrop-blur"><div className="flex h-18 items-center gap-3 px-4 sm:px-6 xl:px-8"><button aria-label="Open navigation" className="rounded-lg border p-2 lg:hidden" onClick={()=>setMobileOpen(true)}><Menu size={20}/></button><div className="min-w-0 flex-1"><p className="text-[11px] font-bold uppercase tracking-[.18em] text-[#a71930]">Estate Office</p><h1 className="truncate text-lg font-semibold sm:text-xl">{title}</h1></div><div className="hidden sm:block"><GlobalSearch/></div><NotificationMenu/><div className="hidden h-8 w-px bg-[var(--border)] xl:block"/><span className="hidden max-w-36 truncate text-sm font-semibold xl:block">{displayName}</span><LogoutButton/></div><div className="border-t px-4 py-2 sm:hidden"><GlobalSearch/></div></header><main className="mx-auto w-full max-w-[1500px] p-4 sm:p-6 xl:p-8">{children}</main></div>
 </div>;
}
