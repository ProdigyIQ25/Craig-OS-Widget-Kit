"use client";

import { useEffect, useState } from "react";

export type DetailRecord = {
  title: string;
  type: string;
  status?: string;
  summary?: string;
  href: string;
  context: string;
  properties?: Array<{ label: string; value: string | number | null | undefined }>;
};

export function DetailDrawerTrigger({record,label="Inspect"}:{record:DetailRecord;label?:string}){
  const [open,setOpen]=useState(false);
  useEffect(()=>{if(!open)return;const close=(event:KeyboardEvent)=>{if(event.key==="Escape")setOpen(false)};window.addEventListener("keydown",close);return()=>window.removeEventListener("keydown",close)},[open]);
  return <>
    <button type="button" className="os-detail-trigger" onClick={()=>setOpen(true)} aria-label={`${label} ${record.title}`}>{label}</button>
    {open?<div className="os-detail-backdrop" role="presentation" onMouseDown={event=>{if(event.target===event.currentTarget)setOpen(false)}}>
      <aside className="os-detail-drawer" role="dialog" aria-modal="true" aria-label={`${record.type} detail`}>
        <header><div><p className="os-eyebrow">{record.type}</p><h2>{record.title}</h2><p>{record.context}</p></div><button type="button" onClick={()=>setOpen(false)} aria-label="Close detail">Close</button></header>
        <section><p className="os-eyebrow">STATUS</p><strong>{record.status??"AVAILABLE FOR REVIEW"}</strong></section>
        {record.summary?<section><p className="os-eyebrow">CONTEXT</p><p>{record.summary}</p></section>:null}
        {record.properties?.length?<section><p className="os-eyebrow">KEY PROPERTIES</p><dl>{record.properties.filter(property=>property.value!==null&&property.value!==undefined&&property.value!=="").map(property=><div key={property.label}><dt>{property.label}</dt><dd>{property.value}</dd></div>)}</dl></section>:null}
        <section><p className="os-eyebrow">RELATED RECORDS</p><p>Related-record inspection remains in the canonical Notion record; no additional relationship data is inferred in Craig OS.</p></section>
        <footer><button type="button" onClick={()=>setOpen(false)}>Back to {record.context}</button><a href={record.href} target="_blank" rel="noreferrer">Open in Notion ↗</a></footer>
      </aside>
    </div>:null}
  </>;
}
