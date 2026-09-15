"use client";

import { createContext, type FormEvent, type ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { actionPath, actionRegistry, type ActionId } from "@/lib/actions/registry";

type OpenAction={actionId:ActionId;preset?:Record<string,string>};
type ActionContextValue={open:(value:OpenAction)=>void};
const ActionContext=createContext<ActionContextValue|null>(null);
type Result={state:"idle"|"submitting"|"success"|"error";recordUrl?:string;errorCode?:string};
const errorCopy:Record<string,string>={VALIDATION_ERROR:"Review the highlighted information and try again.",UNAUTHORIZED_ACTION:"This request was not authorized. Nothing was saved.",UPSTREAM_UNAVAILABLE:"The canonical connection is unavailable. Nothing was saved.",WRITE_FAILED:"Could not capture this record. Nothing was saved.",DUPLICATE_REQUEST:"This capture key was already used for different content. Nothing new was saved.",RATE_LIMITED:"Capture is temporarily paused to prevent accidental activity. Try again shortly."};

export function ActionLayer({children}:{children:ReactNode}){
  const [active,setActive]=useState<OpenAction|null>(null),[values,setValues]=useState<Record<string,string>>({}),[result,setResult]=useState<Result>({state:"idle"});
  const key=useRef(""),titleRef=useRef<HTMLTextAreaElement|HTMLInputElement|null>(null),definition=active?actionRegistry[active.actionId]:null;
  const open=useCallback((value:OpenAction)=>{key.current=crypto.randomUUID();setValues(value.preset??{});setResult({state:"idle"});setActive(value)},[]);
  const close=useCallback(()=>{if(result.state!=="submitting")setActive(null)},[result.state]);
  useEffect(()=>{if(active)setTimeout(()=>titleRef.current?.focus(),0)},[active]);
  useEffect(()=>{const escape=(event:KeyboardEvent)=>{if(event.key==="Escape")close()};window.addEventListener("keydown",escape);return()=>window.removeEventListener("keydown",escape)},[close]);
  const value=useMemo(()=>({open}),[open]);
  const submit=async(event:FormEvent)=>{event.preventDefault();if(!definition||result.state==="submitting")return;setResult({state:"submitting"});try{
    const sessionResponse=await fetch("/api/actions/session",{cache:"no-store"}),session=await sessionResponse.json() as {ok:boolean;csrfToken?:string;errorCode?:string};
    if(!sessionResponse.ok||!session.ok||!session.csrfToken)throw new Error(session.errorCode??"UPSTREAM_UNAVAILABLE");
    const response=await fetch(actionPath(definition.id),{method:"POST",headers:{"Content-Type":"application/json","X-Craig-OS-CSRF":session.csrfToken,"X-Idempotency-Key":key.current},body:JSON.stringify({actionId:definition.id,idempotencyKey:key.current,input:values})});
    const body=await response.json() as {ok:boolean;recordUrl?:string;errorCode?:string};if(!response.ok||!body.ok)throw new Error(body.errorCode??"WRITE_FAILED");
    setResult({state:"success",recordUrl:body.recordUrl});window.dispatchEvent(new CustomEvent("craig-os:action-created",{detail:{scope:definition.scope,actionId:definition.id}}));
  }catch(error){setResult({state:"error",errorCode:error instanceof Error?error.message:"WRITE_FAILED"})}};
  return <ActionContext.Provider value={value}>{children}{definition?<div className="action-backdrop" role="presentation" onMouseDown={event=>{if(event.target===event.currentTarget)close()}}><section className="action-sheet" role="dialog" aria-modal="true" aria-labelledby="action-title" data-action-id={definition.id}>
    <header><div><p className="os-eyebrow">{definition.id} · {definition.destination}</p><h2 id="action-title">{definition.displayName}</h2></div><button type="button" className="action-close" aria-label="Close capture" onClick={close} disabled={result.state==="submitting"}>×</button></header>
    {result.state==="success"?<div className="action-success" role="status"><span>✓</span><h3>{definition.shortLabel} captured.</h3><p>Notion confirmed the new canonical record.</p><div className="action-sheet-actions"><button type="button" onClick={close}>Done</button>{result.recordUrl?<a href={result.recordUrl} target="_blank" rel="noreferrer">Open record ↗</a>:null}</div></div>:<form onSubmit={submit}>
      <p className="action-guidance">Only the fields needed for this capture are shown. Full editing remains in Notion.</p>
      {definition.fields.map((field,index)=><label key={field.key}><span>{field.label}{field.required?<b>Required</b>:<em>Optional</em>}</span>{field.kind==="textarea"?<textarea ref={index===0?node=>{titleRef.current=node}:undefined} name={field.key} value={values[field.key]??""} maxLength={field.maxLength} placeholder={field.placeholder} required={field.required} onChange={event=>setValues(current=>({...current,[field.key]:event.target.value}))}/>:field.kind==="select"?<select name={field.key} value={values[field.key]??""} required={field.required} onChange={event=>setValues(current=>({...current,[field.key]:event.target.value}))}><option value="">Choose…</option>{field.options?.map(option=><option key={option} value={option}>{option}</option>)}</select>:<input ref={index===0?node=>{titleRef.current=node}:undefined} name={field.key} type={field.kind} value={values[field.key]??""} maxLength={field.maxLength} placeholder={field.placeholder} required={field.required} onChange={event=>setValues(current=>({...current,[field.key]:event.target.value}))}/>}</label>)}
      {result.state==="error"?<div className="action-error" role="alert"><strong>Could not capture this record.</strong><p>{errorCopy[result.errorCode??""]??errorCopy.WRITE_FAILED}</p></div>:null}
      <div className="action-sheet-actions"><button type="button" onClick={close} disabled={result.state==="submitting"}>Cancel</button><button type="submit" className="action-submit" disabled={result.state==="submitting"}>{result.state==="submitting"?"Capturing…":result.state==="error"?"Retry":"Capture"}</button></div>
    </form>}
  </section></div>:null}</ActionContext.Provider>;
}

export function ActionButton({actionId,label,className,preset}:{actionId:ActionId;label?:string;className?:string;preset?:Record<string,string>}){const context=useContext(ActionContext);if(!context)throw new Error("ActionButton requires ActionLayer.");return <button type="button" className={className} data-action-id={actionId} onClick={()=>context.open({actionId,preset})}>{label??`+ ${actionRegistry[actionId].shortLabel}`}</button>}
