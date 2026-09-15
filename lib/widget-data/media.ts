import type { NotionRow } from "@/lib/notion-values";
import { textValue, value } from "@/lib/notion-values";

export const MEDIA_TYPES=["VIDEO","MUSIC","PLAYLIST","PODCAST","SERMON","COURSE","AUDIO","MEDITATION","REFERENCE"] as const;
export const MEDIA_MODES=["DEEP WORK","SPIRITUAL","LEARNING","WRITING","REFLECTION","EXERCISE","RELAXATION","GENERAL"] as const;
export type MediaType=typeof MEDIA_TYPES[number]; export type MediaMode=typeof MEDIA_MODES[number];
export type ProviderKind="youtube"|"spotify"|"vimeo"|"loom"|"direct-audio"|"direct-video"|"external"|"unavailable";
export type MediaItem={id:string;title:string;mediaType:string;platform:string;url:string|null;mode:string;purpose:string;duration:number|null;relatedContext:string;favorite:boolean;provider:ProviderKind;embedUrl:string|null};

const MODE_FILTERS:Record<string,MediaMode[]>={"deep-work":["DEEP WORK","WRITING"],focus:["DEEP WORK","WRITING"],spiritual:["SPIRITUAL"],learning:["LEARNING"],writing:["WRITING"],reflection:["REFLECTION"],exercise:["EXERCISE"],relaxation:["RELAXATION"],general:["GENERAL"]};
export function normalizeMode(input:string|null):MediaMode[]|null {const key=(input??"deep-work").trim().toLowerCase();return MODE_FILTERS[key]??null}
export function normalizeMediaTypes(inputs:string[]):MediaType[]|null {const normalized=inputs.map(v=>v.trim().toUpperCase());if(normalized.some(v=>!(MEDIA_TYPES as readonly string[]).includes(v)))return null;return [...new Set(normalized)] as MediaType[]}

export function providerFor(raw:string|null|undefined):{provider:ProviderKind;safeUrl:string|null;embedUrl:string|null}{
  if(!raw)return {provider:"unavailable",safeUrl:null,embedUrl:null};let url:URL;try{url=new URL(raw)}catch{return {provider:"unavailable",safeUrl:null,embedUrl:null}}if(url.protocol!=="https:"||url.username||url.password)return {provider:"unavailable",safeUrl:null,embedUrl:null};
  const host=url.hostname.toLowerCase().replace(/^www\./,"");const path=url.pathname.split("/").filter(Boolean);
  if(host==="youtube.com"||host==="youtu.be"||host==="m.youtube.com"){const id=host==="youtu.be"?path[0]:url.searchParams.get("v")??(path[0]==="shorts"||path[0]==="embed"?path[1]:null);return id&&/^[\w-]{6,20}$/.test(id)?{provider:"youtube",safeUrl:url.toString(),embedUrl:`https://www.youtube-nocookie.com/embed/${id}`}:{provider:"unavailable",safeUrl:null,embedUrl:null}}
  if(host==="open.spotify.com"){const [type,id]=path[0]==="embed"?[path[1],path[2]]:[path[0],path[1]];return type&&id&&/^[a-z]+$/.test(type)&&/^[A-Za-z0-9]+$/.test(id)?{provider:"spotify",safeUrl:url.toString(),embedUrl:`https://open.spotify.com/embed/${type}/${id}`}:{provider:"unavailable",safeUrl:null,embedUrl:null}}
  if(host==="vimeo.com"||host==="player.vimeo.com"){const id=path.find(part=>/^\d+$/.test(part));return id?{provider:"vimeo",safeUrl:url.toString(),embedUrl:`https://player.vimeo.com/video/${id}`}:{provider:"unavailable",safeUrl:null,embedUrl:null}}
  if(host==="loom.com"){const shareIndex=path.findIndex(part=>part==="share"||part==="embed"),id=shareIndex>=0?path[shareIndex+1]:null;return id&&/^[A-Za-z0-9]+$/.test(id)?{provider:"loom",safeUrl:url.toString(),embedUrl:`https://www.loom.com/embed/${id}`}:{provider:"unavailable",safeUrl:null,embedUrl:null}}
  if(/\.(mp3|wav|ogg|m4a)(?:$|\?)/i.test(url.toString()))return {provider:"direct-audio",safeUrl:url.toString(),embedUrl:null};
  if(/\.(mp4|webm|ogv)(?:$|\?)/i.test(url.toString()))return {provider:"direct-video",safeUrl:url.toString(),embedUrl:null};
  return {provider:"external",safeUrl:url.toString(),embedUrl:null};
}

export function deriveMedia(rows:NotionRow[],filters:{modes:MediaMode[];mediaTypes:MediaType[];favorite:boolean|null}):MediaItem[]{return rows.map(row=>{const url=providerFor(String(value(row,"URL")??""));return {id:row.id,title:textValue(row,"Title","UNTITLED MEDIA"),mediaType:textValue(row,"Media Type","UNKNOWN"),platform:textValue(row,"Platform","UNSPECIFIED"),url:url.safeUrl,mode:textValue(row,"Mode","GENERAL"),purpose:textValue(row,"Purpose",""),duration:typeof value(row,"Duration")==="number"?value(row,"Duration") as number:null,relatedContext:textValue(row,"Related Context",""),favorite:value(row,"Favorite")===true,provider:url.provider,embedUrl:url.embedUrl}}).filter(item=>filters.modes.includes(item.mode as MediaMode)&&(filters.mediaTypes.length===0||filters.mediaTypes.includes(item.mediaType as MediaType))&&(filters.favorite===null||item.favorite===filters.favorite)).sort((a,b)=>Number(b.favorite)-Number(a.favorite)||a.title.localeCompare(b.title));}
