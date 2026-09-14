import { NextResponse } from "next/server"; import { dailyBriefResponse } from "@/lib/server/widget-responses";
export const dynamic="force-dynamic";export async function GET(){return NextResponse.json(await dailyBriefResponse(),{headers:{"Cache-Control":"private, no-store"}})}
