import { NextResponse } from "next/server"; import { decisionQueueResponse } from "@/lib/server/widget-responses";
export const dynamic="force-dynamic";export async function GET(){return NextResponse.json(await decisionQueueResponse(),{headers:{"Cache-Control":"private, no-store"}})}
