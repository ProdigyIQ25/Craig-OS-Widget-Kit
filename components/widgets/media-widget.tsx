"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { MediaItem } from "@/lib/widget-data/media";
import { parseWidgetConfig } from "@/lib/widget-config";
import { useWidgetData } from "./data-widgets";
import { StatusCard, WidgetShell } from "./widget-shell";

type PlaybackState="READY"|"PLAYING"|"PAUSED"|"ENDED"|"ERROR";

function emptyCopy(mode:string,context:string){
  if(mode==="spiritual")return context==="teaching"?"No teaching media is ready":"No worship media is ready";
  if(mode==="learning")return "No learning media is ready";
  if(mode==="writing")return "No writing or reference media is ready";
  return "No deep-work media is ready";
}

export function MediaWidget(){
  const search=useSearchParams();
  const config=parseWidgetConfig(search);
  const apiPath=useMemo(()=>{const query=new URLSearchParams();query.set("mode",search.get("mode")??"deep-work");for(const type of search.getAll("mediaType"))query.append("mediaType",type);const favorite=search.get("favorite");if(favorite!==null)query.set("favorite",favorite);return `/api/widgets/media?${query}`},[search]);
  const result=useWidgetData<{items:Array<Omit<MediaItem,"favorite">>}>(apiPath);
  const items=result.data?.items??[];
  const [selected,setSelected]=useState(0);
  const [playback,setPlayback]=useState<PlaybackState>("READY");
  const activeIndex=Math.min(selected,Math.max(0,items.length-1));
  const item=items[activeIndex];
  const state=item?.provider==="unavailable"?"UNAVAILABLE":item?.provider==="direct-audio"||item?.provider==="direct-video"?playback:item?"EXTERNAL PROVIDER":"EMPTY";

  return <WidgetShell code="CW-08 · MEDIA CONTROLLER" title="Media Context" theme={config.theme} footer="Read-only · P11 only · Archive=false · no autoplay">
    {result.state!=="success"?<StatusCard state={result.state} detail={result.detail}/>:!items.length?<StatusCard state="empty" title={emptyCopy((search.get("mode")??"deep-work").toLowerCase(),(search.get("context")??"").toLowerCase())} detail="Add an approved public URL to P11 Media Library. Nothing has been fabricated."/>:<>
      <div className="media-toolbar">
        <label htmlFor="media-selection">Selected media</label>
        <select id="media-selection" value={activeIndex} onChange={event=>{setSelected(Number(event.target.value));setPlayback("READY")}}>{items.map((entry,index)=><option key={entry.id} value={index}>{entry.title}</option>)}</select>
        <button onClick={()=>{setSelected((activeIndex-1+items.length)%items.length);setPlayback("READY")}} disabled={items.length<2}>Previous</button>
        <button onClick={()=>{setSelected((activeIndex+1)%items.length);setPlayback("READY")}} disabled={items.length<2}>Next</button>
      </div>
      <section className="media-stage" aria-live="polite">
        <div className="media-meta"><div><p className="eyebrow">{item.mediaType} · {item.platform}</p><h2>{item.title}</h2></div><span className="media-state">{state}</span></div>
        {item.provider==="direct-audio"&&item.url?<audio className="media-player" controls preload="metadata" src={item.url} onPlay={()=>setPlayback("PLAYING")} onPause={()=>setPlayback("PAUSED")} onEnded={()=>setPlayback("ENDED")} onError={()=>setPlayback("ERROR")}/>:item.provider==="direct-video"&&item.url?<video className="media-player media-video" controls playsInline preload="metadata" src={item.url} onPlay={()=>setPlayback("PLAYING")} onPause={()=>setPlayback("PAUSED")} onEnded={()=>setPlayback("ENDED")} onError={()=>setPlayback("ERROR")}/>:item.embedUrl?<div className="media-player"><iframe className="media-iframe" src={item.embedUrl} title={`${item.title} on ${item.platform}`} loading="lazy" allow="encrypted-media; picture-in-picture" allowFullScreen/></div>:<div className="media-fallback"><p>{item.provider==="unavailable"?"This record has no valid public HTTPS media URL.":"Media unavailable inline. Open in provider."}</p>{item.url&&<a className="primary-link" href={item.url} target="_blank" rel="noreferrer">Open in provider ↗</a>}</div>}
        <dl className="media-details"><div><dt>Mode</dt><dd>{item.mode}</dd></div><div><dt>Duration</dt><dd>{item.duration===null?"Not provided":`${item.duration} min`}</dd></div>{item.purpose&&<div><dt>Purpose</dt><dd>{item.purpose}</dd></div>}</dl>
      </section>
    </>}
  </WidgetShell>
}
