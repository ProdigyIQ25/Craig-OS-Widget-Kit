"use client";

import { useEffect, useState } from "react";
import { ClientWidgetPage } from "./client-page";
import { StatusCard } from "./widget-shell";

type Envelope<T> = { ok: true; data: T; generatedAt: string } | { ok: false; data: null; error: { code: string; message: string }; generatedAt: string };

function useWidgetData<T>(path: string) {
  const [result,setResult]=useState<{state:"loading"|"success"|"empty"|"error"|"disabled"; data?:T; generatedAt?:string; detail?:string}>({state:"loading"});
  useEffect(()=>{const controller=new AbortController();fetch(path,{signal:controller.signal,cache:"no-store"}).then(r=>r.json() as Promise<Envelope<T>>).then(body=>{
    if(!body.ok){setResult({state:body.error.code==="NOT_CONFIGURED"?"disabled":"error",detail:body.error.message,generatedAt:body.generatedAt});return}
    setResult({state:"success",data:body.data,generatedAt:body.generatedAt});
  }).catch(error=>{if(error.name!=="AbortError")setResult({state:"error"})});return()=>controller.abort()},[path]);
  return result;
}

function Freshness({at}:{at?:string}){return <p className="freshness">Generated {at?new Date(at).toLocaleTimeString("en-US",{timeZone:"America/Chicago",hour:"numeric",minute:"2-digit"}):"now"} CT</p>}

export function ExecutivePulseWidget(){const result=useWidgetData<{indicators:Array<{label:string;value:string;tone:string}>}>("/api/widgets/executive-pulse");return <ClientWidgetPage code="CW-11 · EXECUTIVE PULSE" title="Executive Pulse" footer="Read-only · B03/B05/B07/B08/B09/B10 · Archive=false">{()=>{
  if(result.state!=="success")return <StatusCard state={result.state} detail={result.detail}/>;const items=result.data?.indicators??[];if(!items.length)return <StatusCard state="empty"/>;return <><section className="pulse-grid">{items.slice(0,6).map(item=><article key={item.label}><p className="eyebrow">{item.label}</p><strong className={item.tone}>{item.value}</strong></article>)}</section><Freshness at={result.generatedAt}/></>}}</ClientWidgetPage>}

export function WorktelliStateWidget(){const result=useWidgetData<Record<string,unknown>>("/api/widgets/worktelli-state");const labels=[['generation','Generation'],['certification','Certification'],['productState','Product State'],['primaryConstraint','Primary Constraint'],['currentPacket','Current Packet'],['latestQualification','Latest Qualification']];return <ClientWidgetPage code="CW-14 · WORKTELLI STATE" title="Worktelli State" footer="Read-only · B10/B11/B07/B05/B09 · Archive=false">{()=>{
  if(result.state!=="success")return <StatusCard state={result.state} detail={result.detail}/>;return <><section className="state-grid">{labels.map(([key,label])=><article key={key}><p className="eyebrow">{label}</p><strong>{String(result.data?.[key]??"NOT YET POPULATED")}</strong></article>)}</section><Freshness at={result.generatedAt}/></>}}</ClientWidgetPage>}

type ExceptionItem={exception:string;severity:string;impact:string;owner:string;immediateAction:string};
export function ExceptionWidget(){const result=useWidgetData<{exceptions:ExceptionItem[]}>("/api/widgets/exceptions");return <ClientWidgetPage code="CW-17 · EXCEPTION ALERT" title="Exception Alert" footer="Read-only · B07 · active HIGH/CRITICAL · Archive=false">{()=>{
  if(result.state!=="success")return <StatusCard state={result.state} detail={result.detail}/>;const items=result.data?.exceptions??[];if(!items.length)return <section className="all-clear"><span>✓</span><div><p className="eyebrow">CLEAR</p><h2>No active high-severity exceptions</h2><p className="muted">Critical attention is not required.</p></div></section>;return <><section className="exception-list">{items.map(item=><article key={`${item.exception}-${item.severity}`}><span className={`severity ${item.severity.toLowerCase()}`}>{item.severity}</span><h2>{item.exception}</h2><dl><dt>Impact</dt><dd>{item.impact}</dd><dt>Owner</dt><dd>{item.owner}</dd><dt>Immediate action</dt><dd>{item.immediateAction}</dd></dl></article>)}</section><Freshness at={result.generatedAt}/></>}}</ClientWidgetPage>}
