import { NextResponse } from "next/server"; import { opportunityRadarResponse } from "@/lib/server/widget-responses";
export const dynamic="force-dynamic";export async function GET(){return NextResponse.json(await opportunityRadarResponse(),{headers:{"Cache-Control":"private, no-store"}})}
