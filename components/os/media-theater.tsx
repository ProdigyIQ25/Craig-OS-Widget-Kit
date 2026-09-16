"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useWidgetData } from "@/components/widgets/data-widgets";
import { mediaTheaterRegistry, parseMediaTheaterMode, type MediaTheaterMode, type TheaterDefinition } from "@/lib/media-theater";
import { ActionButton } from "@/components/actions/action-layer";
import type { MediaItem } from "@/lib/widget-data/media";
import { notion } from "@/lib/os-data/modes";

type TheaterItem=Omit<MediaItem,"favorite">;
type NativeState="LOADING"|"READY"|"PLAYING"|"PAUSED"|"ENDED"|"ERROR";

const personalTheaterModes:MediaTheaterMode[]=["focus","spiritual","growth","brand"];

function allowedEmbed(src:string|null){
  if(!src)return false;
  try {const url=new URL(src);return url.protocol==="https:"&&["www.youtube-nocookie.com","open.spotify.com","player.vimeo.com","www.loom.com"].includes(url.hostname)} catch {return false}
}

function TheaterPlayer({item,onState}:{item:TheaterItem;onState:(state:NativeState)=>void}){
  const media=useRef<HTMLMediaElement|null>(null);
  useEffect(()=>()=>{media.current?.pause()},[item.id]);
  if(item.provider==="direct-audio"&&item.url)return <audio ref={node=>{media.current=node}} className="theater-native" controls preload="metadata" src={item.url} onLoadStart={()=>onState("LOADING")} onCanPlay={()=>onState("READY")} onPlay={()=>onState("PLAYING")} onPause={()=>onState("PAUSED")} onEnded={()=>onState("ENDED")} onError={()=>onState("ERROR")}/>;
  if(item.provider==="direct-video"&&item.url)return <video ref={node=>{media.current=node}} className="theater-native theater-video" controls playsInline preload="metadata" src={item.url} onLoadStart={()=>onState("LOADING")} onCanPlay={()=>onState("READY")} onPlay={()=>onState("PLAYING")} onPause={()=>onState("PAUSED")} onEnded={()=>onState("ENDED")} onError={()=>onState("ERROR")}/>;
  if(item.embedUrl&&allowedEmbed(item.embedUrl))return <iframe key={item.id} className="theater-iframe" src={item.embedUrl} title={`${item.title} on ${item.platform}`} loading="lazy" allow="encrypted-media; picture-in-picture; fullscreen" allowFullScreen/>;
  return <div className="theater-fallback"><p>{item.provider==="unavailable"?"This record does not contain a valid supported public media URL.":"This provider does not allow inline playback."}</p>{item.url?<a href={item.url} target="_blank" rel="noreferrer">Open in provider ↗</a>:null}</div>;
}

function TheaterStatus({state,detail,empty}:{state:string;detail?:string;empty:string}){
  const title=state==="loading"?"Loading media context…":state==="disabled"?"Media connection is not configured":state==="error"?"Media is temporarily unavailable":empty;
  return <section className="theater-status" data-state={state} role={state==="error"?"alert":"status"}><span>{state.toUpperCase()}</span><h3>{title}</h3><p>{detail??(state==="empty"?"P11 remains canonical. No media record has been fabricated.":"Canonical media state is being resolved.")}</p>{state==="empty"?<a href={notion.mediaLibrary} target="_blank" rel="noreferrer">Open Media Library in Notion ↗</a>:null}</section>;
}

export function MediaTheater({mode,embedded=false}:{mode:MediaTheaterMode;embedded?:boolean}){
  const definition=mediaTheaterRegistry[mode];
  const path=useMemo(()=>`/api/widgets/media?mode=${encodeURIComponent(definition.apiMode)}`,[definition.apiMode]);
  const result=useWidgetData<{items:TheaterItem[]}>(path);
  const items=result.data?.items??[];
  const [selectedId,setSelectedId]=useState<string|null>(null);
  const [nativeState,setNativeState]=useState<NativeState>("LOADING");
  const activeIndex=Math.max(0,selectedId?items.findIndex(item=>item.id===selectedId):0);
  const item=items[activeIndex]??items[0];
  const next=items.length>1?items[(activeIndex+1)%items.length]:null;
  const playerState=item?.provider==="unavailable"?"UNAVAILABLE":item?.provider==="external"?"EXTERNAL PROVIDER":item?.embedUrl?"EXTERNAL PROVIDER":nativeState;
  const select=(id:string)=>{setNativeState("LOADING");setSelectedId(id)};

  return <section className={`media-theater media-theater-${mode}${embedded?" is-embedded":""}`} data-theater-mode={mode} data-active-players={item?"1":"0"}>
    <header className="theater-header"><div><p className="os-eyebrow">{definition.eyebrow}</p><h2>{definition.heading}</h2><p>{definition.description}</p></div><span>{definition.label}</span></header>
    {result.state!=="success"?<TheaterStatus state={result.state} detail={result.detail} empty={definition.emptyState}/>:!items.length?<TheaterStatus state="empty" empty={definition.emptyState}/>:<>
      <div className="theater-layout">
        <div className="theater-stage">
          <div className="theater-state"><span>{item.mediaType} · {item.platform}</span><strong>{playerState}</strong></div>
          <TheaterPlayer key={item.id} item={item} onState={setNativeState}/>
        </div>
        <aside className="theater-context" aria-label="Media context and queue">
          <div><p className="os-eyebrow">CURRENT</p><h3>{item.title}</h3><p>{item.purpose||definition.description}</p></div>
          <dl><div><dt>Mode</dt><dd>{item.mode}</dd></div><div><dt>Purpose</dt><dd>{item.purpose||"Not provided"}</dd></div><div><dt>Duration</dt><dd>{item.duration===null?"Not provided":`${item.duration} min`}</dd></div><div><dt>Related context</dt><dd>{item.relatedContext||item.purpose||"Not provided"}</dd></div></dl>
          <div className="theater-next"><p className="os-eyebrow">NEXT</p>{next?<button onClick={()=>select(next.id)}><span>{next.mediaType}</span><strong>{next.title}</strong></button>:<p>No additional eligible media.</p>}</div>
          <div className="theater-queue"><p className="os-eyebrow">AVAILABLE</p>{items.map(entry=><button key={entry.id} aria-pressed={entry.id===item.id} onClick={()=>select(entry.id)}><span>{entry.mediaType}</span><strong>{entry.title}</strong></button>)}</div>
        </aside>
      </div>
    </>}
    <footer className="theater-capture"><div><p className="os-eyebrow">CAPTURE IN CONTEXT</p><p>Approved insights and brand ideas use bounded capture. Sensitive actions remain native.</p></div><nav aria-label={`${definition.label} media capture`}>{definition.captures.map(action=>action.actionId?<ActionButton key={action.label} actionId={action.actionId} label={action.label} preset={action.actionId==="A-P04"&&item?.url?{sourceUrl:item.url}:undefined}/>:<a key={action.label} href={action.href} target="_blank" rel="noreferrer">{action.label}</a>)}</nav></footer>
  </section>;
}

function TheaterModeRail({definition}:{definition:TheaterDefinition}){
  const router=useRouter(),pathname=usePathname();
  return <nav className="theater-mode-rail" aria-label="Media Theater contexts">{personalTheaterModes.map(mode=>{const item=mediaTheaterRegistry[mode],href=`${pathname}?mode=${mode}`;return <a key={mode} href={href} aria-current={mode===definition.mode?"page":undefined} onClick={event=>{event.preventDefault();if(mode!==definition.mode)router.push(href,{scroll:false})}}>{item.label}</a>})}</nav>;
}

export function MediaTheaterRoute(){
  const search=useSearchParams(),mode=parseMediaTheaterMode(search.get("mode")),definition=mediaTheaterRegistry[mode];
  return <main className={`os-shell os-personal media-theater-page`} data-mode={mode}><header className="os-header"><div><p className="os-eyebrow">CRAIG OS · MEDIA</p><h1>Craig Media Theater</h1><p>Watch, listen, learn, reflect, and capture without leaving the operating system.</p></div><a className="theater-return" href={`/os/personal?mode=${personalTheaterModes.includes(mode)?mode:"focus"}`}>Return to Personal OS ↗</a></header><TheaterModeRail definition={definition}/><MediaTheater key={mode} mode={mode}/><footer className="os-footer"><span>Craig OS v0.11.0</span><span>Read-only P11 media · bounded capture · autoplay off</span></footer></main>;
}
