import "server-only";
import type { ActionId } from "@/lib/actions/registry";
import { serverActionRegistry } from "@/lib/server/action-registry";

export class NotionWriteError extends Error {
  constructor(message:string,public readonly upstreamStatus?:number,public readonly responseShape?:string){super(message)}
}

export async function createActionRecord(actionId:ActionId,input:Record<string,string>){
  const token=process.env.NOTION_ACTION_TOKEN;
  if(!token)throw new NotionWriteError("Write connection is not configured.");
  const action=serverActionRegistry[actionId];
  // P07 and P08 retain canonical database IDs from the pre-data-source API.
  // All other destinations use current data source IDs.
  const notionVersion="data_source_id" in action.parent?"2025-09-03":"2022-06-28";
  const response=await fetch("https://api.notion.com/v1/pages",{
    method:"POST",
    headers:{Authorization:`Bearer ${token}`,"Notion-Version":notionVersion,"Content-Type":"application/json"},
    body:JSON.stringify({parent:action.parent,properties:action.buildProperties(input)}),
    cache:"no-store",
  });
  if(!response.ok)throw new NotionWriteError("Notion create failed.",response.status);
  const page=await response.json() as {id?:string;url?:string;created_time?:string};
  if(!page.id)throw new NotionWriteError("Notion returned an incomplete creation response.",undefined,"id:false");
  const compactId=page.id.replaceAll("-","");
  return {ok:true as const,actionId,recordId:page.id,recordUrl:page.url??`https://www.notion.so/${compactId}`,createdAt:page.created_time??new Date().toISOString()};
}
