import type { NotionRow } from "@/lib/notion-values";
import { numberValue, textValue, value } from "@/lib/notion-values";
import type { AttentionItem, BusinessCommandData, PersonalCommandData } from "@/lib/os-data/types";
import { derivePulse, deriveWorktelli } from "@/lib/widget-data/derive";
import { deriveOpportunityRadar, deriveWorkforceStatus } from "@/lib/widget-data/wave2";

const openStatuses=new Set(["OPEN","REVIEWING"]);
const activeStatuses=new Set(["ACTIVE","ATTENTION","BLOCKED","WAITING"]);
const notionHref=(row:NotionRow)=>row.url??`https://www.notion.so/${row.id.replaceAll("-","")}`;
const rank:Record<string,number>={CRITICAL:6,CORE:5,HIGH:4,ATTENTION:3,NORMAL:2,MEDIUM:2,LOW:1};
const byPriority=(a:NotionRow,b:NotionRow)=>(rank[textValue(b,"Priority",textValue(b,"Impact",textValue(b,"Severity",""))).toUpperCase()]??0)-(rank[textValue(a,"Priority",textValue(a,"Impact",textValue(a,"Severity",""))).toUpperCase()]??0)||(b.last_edited_time??"").localeCompare(a.last_edited_time??"");

function dueDetail(row:NotionRow){const due=textValue(row,"Due Date","");return due?`Due ${due}`:textValue(row,"Status","Current commitment")}
function personalAttention(rows:{P02:NotionRow[];P03:NotionRow[];P04:NotionRow[];P09:NotionRow[];P10:NotionRow[]}):AttentionItem[]{
  const items:AttentionItem[]=[];
  for(const row of rows.P03.filter(r=>activeStatuses.has(textValue(r,"Status","").toUpperCase())).sort(byPriority))items.push({kind:"COMMITMENT",title:textValue(row,"Commitment"),detail:dueDetail(row),tone:textValue(row,"Status","").toUpperCase()==="BLOCKED"?"critical":"attention",href:notionHref(row)});
  for(const row of rows.P02.filter(r=>textValue(r,"Horizon","").toUpperCase()==="NOW"&&activeStatuses.has(textValue(r,"Status","").toUpperCase())).sort(byPriority))items.push({kind:"OUTCOME",title:textValue(row,"Outcome"),detail:`${textValue(row,"Status","ACTIVE")} · ${numberValue(row,"Progress %")??0}%`,tone:"neutral",href:notionHref(row)});
  for(const row of rows.P09.filter(r=>openStatuses.has(textValue(r,"Status","").toUpperCase())).sort(byPriority))items.push({kind:"DECISION",title:textValue(row,"Decision"),detail:`${textValue(row,"Impact","UNRATED")} impact`,tone:"attention",href:notionHref(row)});
  for(const row of rows.P10.filter(r=>textValue(r,"Strength","").toUpperCase()==="STRONG"&&activeStatuses.has(textValue(r,"Status","").toUpperCase())).sort(byPriority))items.push({kind:"SIGNAL",title:textValue(row,"Signal"),detail:textValue(row,"Direction","STRONG"),tone:"neutral",href:notionHref(row)});
  return items.slice(0,5);
}

export function derivePersonalCommand(rows:{P02:NotionRow[];P03:NotionRow[];P04:NotionRow[];P09:NotionRow[];P10:NotionRow[];P11:NotionRow[]}):PersonalCommandData{
  const outcome=rows.P02.filter(r=>textValue(r,"Horizon","").toUpperCase()==="NOW"&&activeStatuses.has(textValue(r,"Status","").toUpperCase())).sort(byPriority)[0];
  const media=[...rows.P11].filter(r=>Boolean(value(r,"URL"))).sort((a,b)=>Number(value(b,"Favorite")===true)-Number(value(a,"Favorite")===true)||(b.last_edited_time??"").localeCompare(a.last_edited_time??""))[0];
  const decisions=rows.P09.filter(r=>openStatuses.has(textValue(r,"Status","").toUpperCase())).sort(byPriority).slice(0,3).map(r=>({title:textValue(r,"Decision"),meta:`${textValue(r,"Impact","UNRATED")} · ${textValue(r,"Status","OPEN")}`,href:notionHref(r)}));
  const signals=rows.P10.filter(r=>activeStatuses.has(textValue(r,"Status","").toUpperCase())).sort((a,b)=>(rank[textValue(b,"Strength","").toUpperCase()]??0)-(rank[textValue(a,"Strength","").toUpperCase()]??0)).slice(0,3).map(r=>({title:textValue(r,"Signal"),meta:`${textValue(r,"Strength","UNRATED")} · ${textValue(r,"Direction","UNKNOWN")}`,href:notionHref(r)}));
  const rhythms=rows.P04.filter(r=>activeStatuses.has(textValue(r,"Status","").toUpperCase()));
  return {identity:{name:"David Craig",context:"Personal Intelligence System"},attention:personalAttention(rows),focus:outcome?{title:textValue(outcome,"Outcome"),detail:textValue(outcome,"Success Definition","Current NOW outcome"),progress:numberValue(outcome,"Progress %"),href:notionHref(outcome)}:null,decisions,signals,media:media?{title:textValue(media,"Title"),detail:`${textValue(media,"Mode","GENERAL")} · ${textValue(media,"Media Type","MEDIA")}`,href:notionHref(media)}:null,rhythms:{active:rhythms.length,attention:rhythms.filter(r=>["ATTENTION","BLOCKED","WAITING"].includes(textValue(r,"Status","").toUpperCase())||(numberValue(r,"Consistency %")??100)<70).length,healthy:rhythms.filter(r=>(numberValue(r,"Consistency %")??0)>=85).length},navigation:[]};
}

export function deriveBusinessCommand(rows:{B03:NotionRow[];B05:NotionRow[];B06:NotionRow[];B07:NotionRow[];B08:NotionRow[];B09:NotionRow[];B10:NotionRow[];B11:NotionRow[]}):BusinessCommandData{
  const decisions=rows.B05.filter(r=>openStatuses.has(textValue(r,"Status","").toUpperCase())).sort(byPriority);
  const exceptions=rows.B07.filter(r=>!["RESOLVED","CLOSED"].includes(textValue(r,"Status","").toUpperCase())).sort(byPriority);
  const decisionItems=decisions.slice(0,3).map(r=>({title:textValue(r,"Decision"),meta:`${textValue(r,"Impact","UNRATED")} · ${textValue(r,"Urgency","NORMAL")}`,href:notionHref(r)}));
  const exceptionItems:AttentionItem[]=exceptions.slice(0,3).map(r=>({kind:"EXCEPTION",title:textValue(r,"Exception"),detail:`${textValue(r,"Severity","UNRATED")} · ${textValue(r,"Status","OPEN")}`,tone:["HIGH","CRITICAL"].includes(textValue(r,"Severity","").toUpperCase())?"critical":"attention",href:notionHref(r)}));
  const requiresDavid=[...decisions.slice(0,3).map<AttentionItem>(r=>({kind:"DECISION",title:textValue(r,"Decision"),detail:`${textValue(r,"Impact","UNRATED")} · ${textValue(r,"Urgency","NORMAL")}`,tone:textValue(r,"Impact","").toUpperCase()==="CRITICAL"?"critical":"attention",href:notionHref(r)})),...exceptionItems].slice(0,5);
  const radar=deriveOpportunityRadar(rows.B03);const activeRows=rows.B03.filter(r=>!["LOST","HOLD"].includes(textValue(r,"Stage","").toUpperCase()));
  const top=radar[0];const topRow=top?rows.B03.find(r=>textValue(r,"Opportunity")==top.opportunity):undefined;
  const signals=rows.B06.filter(r=>activeStatuses.has(textValue(r,"Status","").toUpperCase())).sort((a,b)=>(rank[textValue(b,"Strategic Relevance","").toUpperCase()]??0)-(rank[textValue(a,"Strategic Relevance","").toUpperCase()]??0)).slice(0,3).map(r=>({title:textValue(r,"Signal"),meta:`${textValue(r,"Strategic Relevance","UNRATED")} · ${textValue(r,"Source","UNKNOWN")}`,href:notionHref(r)}));
  const worktelli=deriveWorktelli({B10:rows.B10,B11:rows.B11,B07:rows.B07,B05:rows.B05,B09:rows.B09});
  return {identity:{name:"ProdigyIQ Technologies",context:"Executive Command"},requiresDavid,pulse:derivePulse({B03:rows.B03,B05:rows.B05,B07:rows.B07,B08:rows.B08,B09:rows.B09,B10:rows.B10}),worktelli:{generation:worktelli.generation,certification:worktelli.certification,productState:worktelli.productState,primaryConstraint:worktelli.primaryConstraint,currentPacket:worktelli.currentPacket,latestQualification:worktelli.latestQualification},revenue:{activeCount:activeRows.length,estimatedValue:activeRows.reduce((sum,r)=>sum+(numberValue(r,"Estimated Value")??0),0),topOpportunity:top&&topRow?{title:top.opportunity,detail:`${top.stage||"UNSTAGED"} · ${top.estimatedValue===null?"Value not populated":new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",maximumFractionDigits:0}).format(top.estimatedValue)}`,href:notionHref(topRow)}:null},workforce:deriveWorkforceStatus(rows.B08),decisions:decisionItems,exceptions:exceptionItems,signals,navigation:[]};
}
