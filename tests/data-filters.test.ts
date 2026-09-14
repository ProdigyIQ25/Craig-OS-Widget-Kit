import assert from "node:assert/strict";
import test from "node:test";
import type { NotionRow } from "../lib/notion-values";
import { deriveExceptions, derivePulse, deriveWorktelli } from "../lib/widget-data/derive";

function row(values: Record<string,string|number|boolean>, edited="2026-09-14T12:00:00.000Z"): NotionRow {
  const properties: NotionRow["properties"]={};
  for(const [name,value] of Object.entries(values)){
    if(typeof value==="boolean") properties[name]={type:"checkbox",checkbox:value};
    else if(typeof value==="number") properties[name]={type:"number",number:value};
    else if(["Opportunity","Decision","Exception","Digital Worker","Metric","Capability","Packet"].includes(name)) properties[name]={type:"title",title:[{plain_text:value}]};
    else properties[name]={type:"select",select:{name:value}};
  }
  return {id:crypto.randomUUID(),last_edited_time:edited,properties};
}

test("executive pulse handles zero, one, archived-only equivalent, and mixed active records",()=>{
  const empty={B03:[],B05:[],B07:[],B08:[],B09:[],B10:[]};
  assert.equal(derivePulse(empty).length,6);
  assert.equal(derivePulse({...empty,B03:[row({Opportunity:"One",Stage:"QUALIFIED"})]})[0].value,"1");
  assert.equal(derivePulse(empty)[0].value,"0"); // archived-only rows never reach derivation
  const mixed=derivePulse({...empty,B03:[row({Opportunity:"One",Stage:"QUALIFIED"}),row({Opportunity:"Lost",Stage:"LOST"})]});
  assert.equal(mixed[0].value,"1");
});

test("exception filter covers none, attention, high, critical, resolved, and archived-only equivalent",()=>{
  assert.deepEqual(deriveExceptions([]),[]);
  assert.deepEqual(deriveExceptions([row({Exception:"FYI",Severity:"ATTENTION",Status:"OPEN"})]),[]);
  assert.equal(deriveExceptions([row({Exception:"High",Severity:"HIGH",Status:"OPEN"})]).length,1);
  assert.equal(deriveExceptions([row({Exception:"Critical",Severity:"CRITICAL",Status:"OPEN"})]).length,1);
  assert.deepEqual(deriveExceptions([row({Exception:"Done",Severity:"CRITICAL",Status:"RESOLVED"})]),[]);
  assert.deepEqual(deriveExceptions([]),[]); // archived-only excluded by queryActive
});

test("worktelli state stays explicit for empty and missing packet/certification",()=>{
  const empty=deriveWorktelli({B10:[],B11:[],B07:[],B05:[],B09:[]});
  assert.equal(empty.generation,"NOT YET POPULATED");assert.equal(empty.currentPacket,"NOT YET POPULATED");assert.equal(empty.latestQualification,"NOT YET POPULATED");
  const active=deriveWorktelli({B10:[row({Capability:"Runtime",Generation:"G2",Maturity:"PRODUCTION"})],B11:[row({Packet:"Q-01",Result:"PASS","Packet Type":"QUALIFICATION"})],B07:[],B05:[],B09:[]});
  assert.equal(active.generation,"G2");assert.equal(active.certification,"NOT YET POPULATED");assert.equal(active.currentPacket,"Q-01");assert.match(active.latestQualification,/PASS/);
});
