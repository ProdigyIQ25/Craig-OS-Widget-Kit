import assert from "node:assert/strict";
import test from "node:test";
import type { NotionRow } from "@/lib/notion-values";
import { deriveBusinessCommand, derivePersonalCommand } from "@/lib/widget-data/os-shell";

const prop=(type:string,raw:unknown)=>({type,[type]:raw});
const text=(value:string,type="title")=>prop(type,[{plain_text:value}]);
const select=(value:string)=>prop("select",{name:value});
const status=(value:string)=>prop("status",{name:value});
const number=(value:number)=>prop("number",value);
const checkbox=(value:boolean)=>prop("checkbox",value);
const url=(value:string)=>prop("url",value);
function row(id:string,properties:NotionRow["properties"]):NotionRow{return {id,url:`https://www.notion.so/${id}`,last_edited_time:"2026-09-14T12:00:00.000Z",properties:{Archive:checkbox(false),...properties}}}

test("personal command derives deterministic attention, focus, media, decisions, signals, and rhythms",()=>{
  const data=derivePersonalCommand({
    P02:[row("outcome",{Outcome:text("Ship the meaningful work"),Horizon:select("NOW"),Status:status("ACTIVE"),Priority:select("CORE"),"Progress %":number(42),"Success Definition":text("A verified result","rich_text")})],
    P03:[row("commitment",{Commitment:text("Keep the promise"),Status:status("ATTENTION"),Priority:select("HIGH")})],
    P04:[row("rhythm",{Rhythm:text("Morning reset"),Status:status("ACTIVE"),"Consistency %":number(90)})],
    P09:[row("decision",{Decision:text("Choose the next move"),Status:status("OPEN"),Impact:select("HIGH")})],
    P10:[row("signal",{Signal:text("Capacity is improving"),Status:status("ACTIVE"),Strength:select("STRONG"),Direction:select("POSITIVE")})],
    P11:[row("media",{Title:text("Focus soundtrack"),URL:url("https://example.com"),Mode:select("DEEP WORK"),"Media Type":select("MUSIC"),Favorite:checkbox(true)})]
  });
  assert.equal(data.focus?.title,"Ship the meaningful work");assert.equal(data.focus?.progress,42);assert.equal(data.media?.title,"Focus soundtrack");assert.equal(data.decisions.length,1);assert.equal(data.signals.length,1);assert.equal(data.rhythms.healthy,1);assert.deepEqual(data.attention.map(item=>item.kind),["COMMITMENT","OUTCOME","DECISION","SIGNAL"]);
});

test("personal command remains truthful when canonical state is empty",()=>{const data=derivePersonalCommand({P02:[],P03:[],P04:[],P09:[],P10:[],P11:[]});assert.equal(data.focus,null);assert.equal(data.media,null);assert.deepEqual(data.attention,[]);assert.deepEqual(data.decisions,[]);assert.deepEqual(data.signals,[])});

test("business command aggregates only canonical deterministic state",()=>{
  const data=deriveBusinessCommand({
    B03:[row("opportunity",{Opportunity:text("Priority account"),Stage:select("PROPOSAL"),Status:status("ACTIVE"),"Estimated Value":number(125000)})],
    B05:[row("decision",{Decision:text("Approve the proposal"),Status:status("OPEN"),Impact:select("HIGH"),Urgency:select("IMMEDIATE")})],
    B06:[row("signal",{Signal:text("Strong customer pull"),Status:status("ACTIVE"),"Strategic Relevance":select("HIGH"),Source:select("CLIENT")})],
    B07:[row("exception",{Exception:text("Qualification evidence gap"),Status:status("TRIAGE"),Severity:select("HIGH")})],
    B08:[row("worker",{"Digital Worker":text("Revenue monitor"),Status:select("HEALTHY")})],
    B09:[],B10:[],B11:[]
  });
  assert.equal(data.requiresDavid.length,2);assert.equal(data.revenue.activeCount,1);assert.equal(data.revenue.estimatedValue,125000);assert.equal(data.workforce.healthy,1);assert.equal(data.signals[0]?.title,"Strong customer pull");assert.equal(data.worktelli.productState,"NOT YET POPULATED");
});
