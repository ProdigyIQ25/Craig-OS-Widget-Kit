import { NextResponse } from "next/server"; import { executivePulseResponse } from "@/lib/server/widget-responses";
export const dynamic="force-dynamic"; export async function GET(){return NextResponse.json(await executivePulseResponse(),{headers:{"Cache-Control":"private, no-store"}})}
