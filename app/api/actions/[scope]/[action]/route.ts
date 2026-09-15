import { NextResponse } from "next/server";
import { actionByPath } from "@/lib/actions/registry";
import { executeAction, failure } from "@/lib/server/action-service";

export const dynamic="force-dynamic";
const headers={"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"};

export async function POST(request:Request,{params}:{params:Promise<{scope:string;action:string}>}){
  const path=await params,definition=actionByPath.get(`${path.scope}/${path.action}`);
  if(!definition)return NextResponse.json(failure("UNKNOWN","UNAUTHORIZED_ACTION"),{status:404,headers});
  const result=await executeAction(request,definition.id);
  return NextResponse.json(result.body,{status:result.status,headers});
}
