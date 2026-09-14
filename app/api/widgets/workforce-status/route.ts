import { NextResponse } from "next/server"; import { workforceStatusResponse } from "@/lib/server/widget-responses";
export const dynamic="force-dynamic";export async function GET(){return NextResponse.json(await workforceStatusResponse(),{headers:{"Cache-Control":"private, no-store"}})}
