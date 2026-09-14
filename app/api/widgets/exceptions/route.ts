import { NextResponse } from "next/server"; import { exceptionsResponse } from "@/lib/server/widget-responses";
export const dynamic="force-dynamic"; export async function GET(){return NextResponse.json(await exceptionsResponse(),{headers:{"Cache-Control":"private, no-store"}})}
