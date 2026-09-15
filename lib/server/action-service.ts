import "server-only";
import type { ActionId } from "@/lib/actions/registry";
import { idempotencyHash, requestFingerprint, runIdempotent } from "@/lib/server/action-idempotency";
import { createActionRecord, NotionWriteError } from "@/lib/server/notion-write";
import { rateLimit, validateActionRequest } from "@/lib/server/action-security";
import { ActionValidationError, validateActionPayload } from "@/lib/server/action-validation";

export type ActionErrorCode="VALIDATION_ERROR"|"UNAUTHORIZED_ACTION"|"UPSTREAM_UNAVAILABLE"|"WRITE_FAILED"|"DUPLICATE_REQUEST"|"RATE_LIMITED";
export const failure=(actionId:string,errorCode:ActionErrorCode)=>({ok:false as const,actionId,errorCode});

export async function executeAction(request:Request,actionId:ActionId){
  const started=Date.now();let code="WRITE_FAILED",upstreamStatus:number|undefined;
  try{
    if(!validateActionRequest(request)){code="UNAUTHORIZED_ACTION";return {status:403,body:failure(actionId,"UNAUTHORIZED_ACTION")}}
    if(!rateLimit(request,actionId)){code="RATE_LIMITED";return {status:429,body:failure(actionId,"RATE_LIMITED")}}
    const length=Number(request.headers.get("content-length")??0);if(length>12_000)throw new ActionValidationError("Request too large.");
    const text=await request.text();if(text.length>12_000)throw new ActionValidationError("Request too large.");
    let raw:unknown;try{raw=JSON.parse(text)}catch{throw new ActionValidationError("Invalid JSON.")}
    const payload=validateActionPayload(actionId,raw),headerKey=request.headers.get("x-idempotency-key");
    if(headerKey!==payload.idempotencyKey)throw new ActionValidationError("Idempotency key mismatch.");
    const fingerprint=requestFingerprint(actionId,payload.input);
    const result=await runIdempotent(actionId,payload.idempotencyKey,fingerprint,()=>createActionRecord(actionId,payload.input));
    code="OK";return {status:200,body:result};
  }catch(error){
    if(error instanceof ActionValidationError){code="VALIDATION_ERROR";return {status:400,body:failure(actionId,"VALIDATION_ERROR")}}
    if(error instanceof Error&&error.message==="DUPLICATE_REQUEST"){code="DUPLICATE_REQUEST";return {status:409,body:failure(actionId,"DUPLICATE_REQUEST")}}
    if(error instanceof NotionWriteError){upstreamStatus=error.upstreamStatus;code=error.message.includes("configured")?"UPSTREAM_UNAVAILABLE":"WRITE_FAILED";return {status:503,body:failure(actionId,code as ActionErrorCode)}}
    code="UPSTREAM_UNAVAILABLE";return {status:503,body:failure(actionId,"UPSTREAM_UNAVAILABLE")};
  }finally{
    const marker=idempotencyHash(actionId,request.headers.get("x-idempotency-key")??"body").slice(0,12);
    console.info(JSON.stringify({event:"craig_os_action",actionId,code,durationMs:Date.now()-started,requestMarker:marker,...(upstreamStatus?{upstreamStatus}:{})}));
  }
}
