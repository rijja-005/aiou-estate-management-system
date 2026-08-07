'use client';
import { useEffect, useState } from 'react';
type Result={type:string;id:string;title:string;subtitle:string;href:string};
export function GlobalSearch():React.ReactElement{
 const [q,setQ]=useState(''),[rows,setRows]=useState<Result[]>([]),[open,setOpen]=useState(false);
 useEffect(()=>{if(q.trim().length<2)return;const controller=new AbortController();const timer=window.setTimeout(()=>void fetch(`/api/v1/search?q=${encodeURIComponent(q)}`,{signal:controller.signal}).then(r=>r.json()).then((x:{data?:Result[]})=>setRows(x.data??[])).catch(()=>undefined),250);return()=>{window.clearTimeout(timer);controller.abort();};},[q]);
 return <div className="relative"><label className="sr-only" htmlFor="global-search">Global search</label><input id="global-search" value={q} onFocus={()=>setOpen(true)} onChange={e=>{setQ(e.target.value);setOpen(true);}} onBlur={()=>window.setTimeout(()=>setOpen(false),150)} placeholder="Search everything…" className="w-44 rounded-lg border px-3 py-2 text-sm sm:w-64"/>{open&&q.length>=2?<div className="absolute right-0 z-30 mt-2 max-h-96 w-80 overflow-auto rounded-xl border bg-white p-2 shadow-xl">{rows.length?rows.map(x=><a key={`${x.type}-${x.id}`} href={x.href} className="block rounded-lg p-2 text-sm hover:bg-slate-50"><span className="text-xs uppercase text-red-700">{x.type}</span><strong className="block">{x.title}</strong><span className="text-slate-500">{x.subtitle}</span></a>):<p className="p-3 text-sm text-slate-500">No matches</p>}</div>:null}</div>;
}
