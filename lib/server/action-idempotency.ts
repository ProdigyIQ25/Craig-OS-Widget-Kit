import "server-only";
import { createHash } from "node:crypto";

export type ActionSuccess={ok:true;actionId:string;recordId:string;recordUrl:string;createdAt:string};
type Stored={fingerprint:string;result:ActionSuccess};
const completed=new Map<string,Stored>();
const pending=new Map<string,{fingerprint:string;promise:Promise<ActionSuccess>}>();
const TTL_SECONDS=60*60*24;

const digest=(value:string)=>createHash("sha256").update(value).digest("hex");
export const requestFingerprint=(actionId:string,input:Record<string,string>)=>digest(`${actionId}:${JSON.stringify(input,Object.keys(input).sort())}`);
export const idempotencyHash=(actionId:string,key:string)=>digest(`${actionId}:${key}`);

async function remoteGet(key:string):Promise<Stored|undefined>{
  if (process.env.NODE_ENV==="test"||!process.env.VERCEL)return undefined;
  try {
    const {getCache}=await import("@vercel/functions"),value=await getCache({namespace:"craig-os-actions"}).get(key);
    return value&&typeof value==="object"&&"fingerprint" in value&&"result" in value?value as Stored:undefined;
  } catch { return undefined; }
}
async function remoteSet(key:string,value:Stored){
  if (process.env.NODE_ENV==="test"||!process.env.VERCEL)return;
  try { const {getCache}=await import("@vercel/functions"); await getCache({namespace:"craig-os-actions"}).set(key,value,{ttl:TTL_SECONDS,name:"XP-04 idempotency result"}); } catch { /* local in-flight and completed guards remain active */ }
}

export async function runIdempotent(actionId:string,key:string,fingerprint:string,create:()=>Promise<ActionSuccess>):Promise<ActionSuccess>{
  const storageKey=idempotencyHash(actionId,key);
  const existing=completed.get(storageKey)??await remoteGet(storageKey);
  if(existing){if(existing.fingerprint!==fingerprint)throw new Error("DUPLICATE_REQUEST");return existing.result}
  const active=pending.get(storageKey);
  if(active){if(active.fingerprint!==fingerprint)throw new Error("DUPLICATE_REQUEST");return active.promise}
  const operation=create().then(async result=>{const stored={fingerprint,result};completed.set(storageKey,stored);await remoteSet(storageKey,stored);return result}).finally(()=>pending.delete(storageKey));
  pending.set(storageKey,{fingerprint,promise:operation});return operation;
}
