import "server-only";
import { actionRegistry, type ActionId } from "@/lib/actions/registry";

type NotionProperty = Record<string, unknown>;
type Parent = { type:"data_source_id"; data_source_id:string } | { type:"database_id"; database_id:string };
export type ServerAction = {
  id: ActionId;
  parent: Parent;
  titleProperty: string;
  buildProperties: (input: Record<string, string>) => Record<string, NotionProperty>;
};

const title=(content:string)=>({title:[{type:"text",text:{content}}]});
const richText=(content:string)=>({rich_text:[{type:"text",text:{content}}]});
const date=(start:string)=>({date:{start}});
const select=(name:string)=>({select:{name}});
const status=(name:string)=>({status:{name}});
const url=(value:string)=>({url:value});
const source=(data_source_id:string):Parent=>({type:"data_source_id",data_source_id});
const database=(database_id:string):Parent=>({type:"database_id",database_id});
const optional=(input:Record<string,string>,key:string,value:(content:string)=>NotionProperty)=>input[key]?value(input[key]):undefined;
const compact=(entries:Array<[string,NotionProperty|undefined]>)=>Object.fromEntries(entries.filter((entry):entry is [string,NotionProperty]=>Boolean(entry[1])));

export const serverActionRegistry: Record<ActionId, ServerAction> = {
  "A-P01": {id:"A-P01",parent:source("27e4fc83-87bd-4f13-a34f-919ea1dc0a1e"),titleProperty:"Commitment",buildProperties:i=>compact([["Commitment",title(i.title)],["Status",status("PLANNED")],["Due Date",optional(i,"dueDate",date)]])},
  "A-P02": {id:"A-P02",parent:source("853d333f-8f8a-414e-8140-ca747bfeb0d8"),titleProperty:"Decision",buildProperties:i=>compact([["Decision",title(i.title)],["Status",status("OPEN")],["Review Date",optional(i,"reviewDate",date)]])},
  "A-P03": {id:"A-P03",parent:source("782c1d0a-9bef-46d6-a0ae-033a38d69fe9"),titleProperty:"Signal",buildProperties:i=>compact([["Signal",title(i.title)],["Status",status("ACTIVE")],["Evidence",optional(i,"evidence",richText)]])},
  "A-P04": {id:"A-P04",parent:database("e7075ed9959141d89382b515a0c09397"),titleProperty:"Knowledge Asset",buildProperties:i=>compact([["Knowledge Asset",title(i.title)],["Source URL",optional(i,"sourceUrl",url)]])},
  "A-P05": {id:"A-P05",parent:database("fc7b4765360e47b48d6063f3837038ee"),titleProperty:"Asset",buildProperties:i=>compact([["Asset",title(i.title)],["Asset Type",select("IDEA")],["Lifecycle",select("CAPTURED")],["Next Action",optional(i,"nextAction",richText)]])},
  "A-B01": {id:"A-B01",parent:source("04d61791-c4f1-4306-a781-c1ce86f88009"),titleProperty:"Opportunity",buildProperties:i=>compact([["Opportunity",title(i.title)],["Stage",select("IDENTIFIED")],["Target Close Date",optional(i,"targetCloseDate",date)]])},
  "A-B02": {id:"A-B02",parent:source("d6a48c06-9b0c-4a5d-a929-d055f9d281a0"),titleProperty:"Decision",buildProperties:i=>{const category=i.category;return compact([["Decision",title(i.title)],["Status",status("OPEN")],["Decision Type",category==="COMMERCIAL"||category==="ARCHITECTURE"?select(category):undefined],["Domain",category==="EXECUTIVE"||category==="WORKTELLI"?select(category):category==="ARCHITECTURE"?select("ENGINEERING"):undefined]])}},
  "A-B03": {id:"A-B03",parent:source("f109259e-dbc5-49d3-89d2-50a2ecf54d3b"),titleProperty:"Exception",buildProperties:i=>compact([["Exception",title(i.title)],["Status",status("OPEN")],["Exception Type",select(i.exceptionType)],["Severity",optional(i,"severity",select)]])},
  "A-B04": {id:"A-B04",parent:source("a921ce1c-fa70-4524-9c08-16469cd0c0e7"),titleProperty:"Signal",buildProperties:i=>compact([["Signal",title(i.title)],["Source",optional(i,"source",select)]])},
  "A-B05": {id:"A-B05",parent:source("60e4d094-16a2-4912-ab62-308d2f5da5c7"),titleProperty:"Digital Worker",buildProperties:i=>compact([["Digital Worker",title(i.title)],["Function",select(i.function)],["Mission",optional(i,"mission",richText)]])},
  "A-B06": {id:"A-B06",parent:source("c1e6281e-dc06-4ddf-b2d9-00402126975b"),titleProperty:"Capability",buildProperties:i=>compact([["Capability",title(i.title)],["Capability Domain",optional(i,"capabilityDomain",select)]])},
};

export const PERSONAL_WRITE_ALLOWLIST = Object.values(actionRegistry).filter(action=>action.scope==="personal").map(action=>action.destination);
export const BUSINESS_WRITE_ALLOWLIST = Object.values(actionRegistry).filter(action=>action.scope==="business").map(action=>action.destination);
