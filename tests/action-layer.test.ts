import assert from "node:assert/strict";
import test from "node:test";
import { ACTION_IDS, actionByPath, actionPath, actionRegistry, type ActionId } from "../lib/actions/registry";
import { serverActionRegistry } from "../lib/server/action-registry";
import { ActionValidationError, validateActionPayload } from "../lib/server/action-validation";
import { createActionSession } from "../lib/server/action-security";
import { executeAction } from "../lib/server/action-service";

process.env.ACTION_SIGNING_SECRET="xp04-test-signing-secret-with-more-than-32-characters";
process.env.NOTION_ACTION_TOKEN="test-action-token";
delete process.env.VERCEL;

const minimal:Record<ActionId,Record<string,string>>={
  "A-P01":{title:"Commitment"},"A-P02":{title:"Decision"},"A-P03":{title:"Signal"},"A-P04":{title:"Insight"},"A-P05":{title:"Brand idea"},
  "A-B01":{title:"Opportunity"},"A-B02":{title:"Business decision"},"A-B03":{title:"Exception",exceptionType:"STRATEGIC BLOCKER"},
  "A-B04":{title:"Business signal"},"A-B05":{title:"Research Worker",function:"RESEARCH"},"A-B06":{title:"Governed workflow"},
};
const optional:Record<ActionId,Record<string,string>>={
  "A-P01":{...minimal["A-P01"],dueDate:"2026-10-01"},"A-P02":{...minimal["A-P02"],reviewDate:"2026-10-02"},"A-P03":{...minimal["A-P03"],evidence:"Observed context"},
  "A-P04":{...minimal["A-P04"],sourceUrl:"https://example.com/source"},"A-P05":{...minimal["A-P05"],nextAction:"Draft outline"},
  "A-B01":{...minimal["A-B01"],targetCloseDate:"2026-11-01"},"A-B02":{...minimal["A-B02"],category:"ARCHITECTURE"},
  "A-B03":{...minimal["A-B03"],severity:"HIGH"},"A-B04":{...minimal["A-B04"],source:"ENGINEERING"},
  "A-B05":{...minimal["A-B05"],mission:"Research a bounded question"},"A-B06":{...minimal["A-B06"],capabilityDomain:"GOVERNANCE"},
};
const key=(suffix:string)=>`123e4567-e89b-42d3-a456-${suffix.padStart(12,"0")}`;

function body(actionId:ActionId,input:Record<string,string>,idempotencyKey=key(String(ACTION_IDS.indexOf(actionId)+1))){return {actionId,idempotencyKey,input}}
function signedRequest(actionId:ActionId,input:Record<string,string>,idempotencyKey?:string,ip="127.0.0.1"){
  const session=createActionSession(),url=`https://craig-os-widget-kit.vercel.app${actionPath(actionId)}`;
  return new Request(url,{method:"POST",headers:{origin:new URL(url).origin,"sec-fetch-site":"same-origin",cookie:`${session.cookieName}=${session.cookieValue}`,"x-craig-os-csrf":session.token,"x-idempotency-key":idempotencyKey??key(String(ACTION_IDS.indexOf(actionId)+1)),"x-forwarded-for":ip,"content-type":"application/json"},body:JSON.stringify(body(actionId,input,idempotencyKey))});
}

test("registry contains exactly the 11 authorized action-specific routes and destinations",()=>{
  assert.equal(ACTION_IDS.length,11);assert.equal(new Set(ACTION_IDS).size,11);assert.equal(actionByPath.size,11);
  assert.deepEqual(ACTION_IDS.map(id=>actionRegistry[id].destination),["P03 Personal Commitments","P09 Personal Decisions","P10 Personal Signals","P08 Personal Knowledge","P07 Brand Assets","B03 Opportunities","B05 Decisions","B07 Exceptions","B06 Signals","B08 Digital Workers","B10 Worktelli Capabilities"]);
  for(const id of ACTION_IDS){assert.equal(actionByPath.get(actionPath(id).replace("/api/actions/",""))?.id,id);assert.equal(serverActionRegistry[id].id,id)}
});

test("every action accepts its required minimum and authorized optional fields",()=>{
  for(const id of ACTION_IDS){assert.deepEqual(validateActionPayload(id,body(id,minimal[id])).input,minimal[id]);assert.deepEqual(validateActionPayload(id,body(id,optional[id])).input,optional[id])}
});

test("every action rejects missing required data and unexpected fields",()=>{
  for(const id of ACTION_IDS){assert.throws(()=>validateActionPayload(id,body(id,{})),ActionValidationError);assert.throws(()=>validateActionPayload(id,body(id,{...minimal[id],databaseId:"attacker"})),ActionValidationError);assert.throws(()=>validateActionPayload(id,{...body(id,minimal[id]),properties:{Archive:{checkbox:false}}}),ActionValidationError)}
});

test("enums, dates, URLs, action identity, and credential-bearing URLs fail closed",()=>{
  for(const [id,field] of [["A-B02","category"],["A-B03","exceptionType"],["A-B04","source"],["A-B05","function"],["A-B06","capabilityDomain"]] as const)assert.throws(()=>validateActionPayload(id,body(id,{...minimal[id],[field]:"INVENTED"})),ActionValidationError);
  assert.throws(()=>validateActionPayload("A-P01",body("A-P01",{title:"x",dueDate:"2026-02-31"})),ActionValidationError);
  assert.throws(()=>validateActionPayload("A-P04",body("A-P04",{title:"x",sourceUrl:"http://example.com"})),ActionValidationError);
  assert.throws(()=>validateActionPayload("A-P04",body("A-P04",{title:"x",sourceUrl:"https://user:pass@example.com"})),ActionValidationError);
  assert.throws(()=>validateActionPayload("A-P01",body("A-P02",minimal["A-P02"])),ActionValidationError);
});

test("request and body idempotency identities must match",async()=>{const request=signedRequest("A-P01",minimal["A-P01"],key("550"),"10.55.0.1"),raw=await request.json() as Record<string,unknown>,mismatch=new Request(request.url,{method:"POST",headers:request.headers,body:JSON.stringify({...raw,idempotencyKey:key("551")})});const result=await executeAction(mismatch,"A-P01");assert.equal(result.status,400);assert.equal(result.body.ok,false)});

test("property builders apply only certified defaults and supplied optional values",()=>{
  const expected:Record<ActionId,string[]>={
    "A-P01":["Commitment","Status","Due Date"],"A-P02":["Decision","Status","Review Date"],"A-P03":["Signal","Status","Evidence"],"A-P04":["Knowledge Asset","Source URL"],"A-P05":["Asset","Asset Type","Lifecycle","Next Action"],
    "A-B01":["Opportunity","Stage","Target Close Date"],"A-B02":["Decision","Status","Decision Type","Domain"],"A-B03":["Exception","Status","Exception Type","Severity"],"A-B04":["Signal","Source"],"A-B05":["Digital Worker","Function","Mission"],"A-B06":["Capability","Capability Domain"],
  };
  for(const id of ACTION_IDS)assert.deepEqual(Object.keys(serverActionRegistry[id].buildProperties(optional[id])),expected[id]);
  assert.deepEqual(serverActionRegistry["A-P01"].buildProperties(minimal["A-P01"]).Status,{status:{name:"PLANNED"}});
  assert.deepEqual(serverActionRegistry["A-P05"].buildProperties(minimal["A-P05"])["Asset Type"],{select:{name:"IDEA"}});
  assert.deepEqual(serverActionRegistry["A-B01"].buildProperties(minimal["A-B01"]).Stage,{select:{name:"IDENTIFIED"}});
  assert.deepEqual(serverActionRegistry["A-B02"].buildProperties({...minimal["A-B02"],category:"ARCHITECTURE"}).Domain,{select:{name:"ENGINEERING"}});
});

test("all 11 actions return minimal confirmed success metadata",async()=>{
  const original=global.fetch;let calls=0;
  global.fetch=async()=>{calls++;return Response.json({id:`record-${calls}`,url:`https://www.notion.so/record-${calls}`,created_time:"2026-09-15T12:00:00.000Z"})};
  try{for(const [index,id] of ACTION_IDS.entries()){const result=await executeAction(signedRequest(id,optional[id],key(`1${index}`),`10.0.0.${index+1}`),id);assert.equal(result.status,200);assert.deepEqual(Object.keys(result.body),["ok","actionId","recordId","recordUrl","createdAt"]);assert.equal(result.body.actionId,id)}assert.equal(calls,11)}finally{global.fetch=original}
});

test("same-key retries and rapid repeats create once; changed content is rejected",async()=>{
  const original=global.fetch;let calls=0;global.fetch=async()=>{calls++;await new Promise(resolve=>setTimeout(resolve,10));return Response.json({id:"once",url:"https://www.notion.so/once",created_time:"2026-09-15T12:00:00.000Z"})};
  const requestKey=key("777"),ip="10.77.0.1";
  try{const first=executeAction(signedRequest("A-P01",minimal["A-P01"],requestKey,ip),"A-P01"),concurrentConflict=executeAction(signedRequest("A-P01",{title:"Changed concurrently"},requestKey,"10.77.0.2"),"A-P01"),results=await Promise.all([first,...Array.from({length:4},()=>executeAction(signedRequest("A-P01",minimal["A-P01"],requestKey,ip),"A-P01"))]);assert.equal(calls,1);assert.ok(results.every(result=>result.status===200));assert.equal((await concurrentConflict).status,409);const conflict=await executeAction(signedRequest("A-P01",{title:"Changed"},requestKey,"10.77.0.3"),"A-P01");assert.equal(conflict.status,409);assert.equal(conflict.body.ok,false);if(!conflict.body.ok)assert.equal(conflict.body.errorCode,"DUPLICATE_REQUEST")}finally{global.fetch=original}
});

test("origin, CSRF, rate, and upstream failures return bounded error contracts",async()=>{
  const unsigned=new Request("https://craig-os-widget-kit.vercel.app/api/actions/personal/commitment",{method:"POST",headers:{origin:"https://evil.example"},body:JSON.stringify(body("A-P01",minimal["A-P01"],key("881")))});
  assert.equal((await executeAction(unsigned,"A-P01")).status,403);
  const original=global.fetch;global.fetch=async()=>new Response("private upstream detail",{status:500});
  try{const upstream=await executeAction(signedRequest("A-P01",minimal["A-P01"],key("882"),"10.88.0.2"),"A-P01");assert.equal(upstream.status,503);assert.deepEqual(upstream.body,{ok:false,actionId:"A-P01",errorCode:"WRITE_FAILED"});assert.equal(JSON.stringify(upstream.body).includes("private upstream detail"),false)}finally{global.fetch=original}
  const original2=global.fetch;global.fetch=async()=>Response.json({id:"rate",url:"https://www.notion.so/rate",created_time:"2026-09-15T12:00:00.000Z"});
  try{let last;for(let i=0;i<13;i++)last=await executeAction(signedRequest("A-P03",minimal["A-P03"],key(`9${i}`),"10.99.0.1"),"A-P03");assert.equal(last?.status,429);assert.equal(last?.body.ok,false);if(last&&!last.body.ok)assert.equal(last.body.errorCode,"RATE_LIMITED")}finally{global.fetch=original2}
});
