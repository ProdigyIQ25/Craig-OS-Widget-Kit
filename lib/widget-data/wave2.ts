import type { NotionRow } from "@/lib/notion-values";
import { numberValue, relationCount, textValue } from "@/lib/notion-values";

export type MatrixRow={domain:string;scoreOrState:string;status:"HEALTHY"|"ATTENTION"|"HIGH RISK"|"CRITICAL"|"UNKNOWN";trend:string};
export type WorkforceCounts={healthy:number;attention:number;waiting:number;degraded:number;offline:number;totalActive:number};
export type RadarItem={opportunity:string;company:string;score:number|null;tier:string;stage:string;estimatedValue:number|null};
export type DecisionItem={decision:string;impact:string;urgency:string;domain:string;ageDays:number|null;recommendation:string};

export function clampProgress(value:number){return Math.max(0,Math.min(100,Number.isFinite(value)?value:0))}
export function countdownParts(target:number,now:number){if(!Number.isFinite(target)||!Number.isFinite(now))return null;const total=Math.max(0,target-now);return {total,complete:total===0,days:Math.floor(total/86_400_000),hours:Math.floor(total%86_400_000/3_600_000),minutes:Math.floor(total%3_600_000/60_000)}}
export function alignmentStatus(value:number){const score=clampProgress(value);return score>=85?"HEALTHY":score>=70?"ATTENTION":score>=50?"HIGH RISK":"CRITICAL"}
export function attentionValidation(total:number){return total===100?"TARGET ALLOCATION VALID":`TARGET TOTAL ${total}% · REVIEW REQUIRED`}
export function deltaStatus(current:number|null,prior:number|null){if(current===null)return {delta:null,status:"UNKNOWN"};if(prior===null)return {delta:null,status:"NO PRIOR"};const delta=current-prior;return {delta,status:delta>0?"UP":delta<0?"DOWN":"FLAT"}}

function matrixStatus(raw:string):MatrixRow["status"]{const value=raw.toUpperCase();if(value.includes("CRITICAL"))return "CRITICAL";if(value.includes("HIGH")||value.includes("DEGRADED")||value.includes("AT RISK"))return "HIGH RISK";if(value.includes("ATTENTION")||value.includes("WAIT")||value.includes("BLOCK"))return "ATTENTION";if(value.includes("HEALTHY")||value.includes("ON TRACK")||value.includes("ACTIVE")||value.includes("PRODUCTION")||value.includes("CERTIFIED"))return "HEALTHY";return "UNKNOWN"}

export function deriveHealthMatrix(rows:{B09:NotionRow[];B10:NotionRow[];B08:NotionRow[]}):MatrixRow[]{
  const metrics=rows.B09.map(row=>{const health=textValue(row,"Health",textValue(row,"Status","UNKNOWN"));const current=numberValue(row,"Current Value");return {domain:textValue(row,"Domain","METRIC"),scoreOrState:current===null?health:String(current),status:matrixStatus(health),trend:textValue(row,"Direction","UNKNOWN")}});
  const capabilities=rows.B10.map(row=>{const state=textValue(row,"Maturity","UNKNOWN"), certification=textValue(row,"Certification State","UNKNOWN");return {domain:`WORKTELLI · ${textValue(row,"Capability","CAPABILITY")}`,scoreOrState:state,status:matrixStatus(`${state} ${certification}`),trend:"UNKNOWN" as const}});
  const workers=rows.B08.filter(row=>textValue(row,"Status","").toUpperCase()!=="RETIRED").map(row=>{const health=textValue(row,"Health",textValue(row,"Status","UNKNOWN"));return {domain:`WORKFORCE · ${textValue(row,"Function","UNASSIGNED")}`,scoreOrState:health,status:matrixStatus(health),trend:"UNKNOWN" as const}});
  return [...metrics,...capabilities,...workers].slice(0,12);
}

export function deriveWorkforceStatus(rows:NotionRow[]):WorkforceCounts{
  const active=rows.filter(row=>textValue(row,"Status","").toUpperCase()!=="RETIRED");const counts:WorkforceCounts={healthy:0,attention:0,waiting:0,degraded:0,offline:0,totalActive:active.length};
  for(const row of active){const state=`${textValue(row,"Health","")} ${textValue(row,"Status","")}`.toUpperCase();if(state.includes("OFFLINE")||state.includes("INACTIVE"))counts.offline++;else if(state.includes("WAIT")||state.includes("BLOCK"))counts.waiting++;else if(state.includes("DEGRADED")||state.includes("HIGH RISK")||state.includes("CRITICAL"))counts.degraded++;else if(state.includes("ATTENTION"))counts.attention++;else counts.healthy++;}
  return counts;
}

export function deriveOpportunityRadar(rows:NotionRow[]):RadarItem[]{return rows.filter(row=>textValue(row,"Stage","").toUpperCase()!=="LOST").map(row=>({
  opportunity:textValue(row,"Opportunity"),company:relationCount(row,"Company")?"LINKED COMPANY":"NOT YET POPULATED",score:numberValue(row,"Opportunity Score"),tier:textValue(row,"Tier"),stage:textValue(row,"Stage"),estimatedValue:numberValue(row,"Estimated Value")
})).sort((a,b)=>(b.score??-Infinity)-(a.score??-Infinity)||(b.estimatedValue??-Infinity)-(a.estimatedValue??-Infinity)||a.opportunity.localeCompare(b.opportunity)).slice(0,6)}

const impactRank:Record<string,number>={CRITICAL:4,HIGH:3,MEDIUM:2,LOW:1};const urgencyRank:Record<string,number>={IMMEDIATE:4,HIGH:3,NORMAL:2,LOW:1};
export function deriveDecisionQueue(rows:NotionRow[],now=new Date()):DecisionItem[]{return rows.filter(row=>["OPEN","REVIEWING"].includes(textValue(row,"Status","").toUpperCase())).map(row=>{const opened=textValue(row,"Date Opened","");const time=Date.parse(opened);return {decision:textValue(row,"Decision"),impact:textValue(row,"Impact","UNKNOWN"),urgency:textValue(row,"Urgency","UNKNOWN"),domain:textValue(row,"Domain","UNKNOWN"),ageDays:Number.isFinite(time)?Math.max(0,Math.floor((now.getTime()-time)/86_400_000)):null,recommendation:textValue(row,"Recommendation")}}).sort((a,b)=>(impactRank[b.impact]??0)-(impactRank[a.impact]??0)||(urgencyRank[b.urgency]??0)-(urgencyRank[a.urgency]??0)||(b.ageDays??-1)-(a.ageDays??-1)||a.decision.localeCompare(b.decision))}

export function deriveDailyBrief(rows:{B03:NotionRow[];B05:NotionRow[];B07:NotionRow[];B08:NotionRow[];B10:NotionRow[]}){
  const decisions=deriveDecisionQueue(rows.B05).length;const exceptions=rows.B07.filter(row=>["HIGH","CRITICAL"].includes(textValue(row,"Severity","").toUpperCase())&&!["RESOLVED","CLOSED"].includes(textValue(row,"Status","").toUpperCase())).length;const opportunity=deriveOpportunityRadar(rows.B03)[0];const workforce=deriveWorkforceStatus(rows.B08);const capability=rows.B10[0];
  const needsAttention=workforce.attention+workforce.waiting+workforce.degraded+workforce.offline;
  return {items:[`${decisions} open decision${decisions===1?"":"s"}`,`${exceptions} high-severity exception${exceptions===1?"":"s"}`,opportunity?`Top opportunity: ${opportunity.opportunity}`:"No live opportunities populated",capability?`Worktelli state: ${textValue(capability,"Maturity")}`:"Worktelli state not yet populated",`${needsAttention} workforce item${needsAttention===1?"":"s"} ${needsAttention===1?"needs":"need"} attention`]};
}
