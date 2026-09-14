import { NextResponse } from "next/server"; import { healthMatrixResponse } from "@/lib/server/widget-responses";
export const dynamic="force-dynamic";export async function GET(){return NextResponse.json(await healthMatrixResponse(),{headers:{"Cache-Control":"private, no-store"}})}
