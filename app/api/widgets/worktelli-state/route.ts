import { NextResponse } from "next/server"; import { worktelliStateResponse } from "@/lib/server/widget-responses";
export const dynamic="force-dynamic"; export async function GET(){return NextResponse.json(await worktelliStateResponse(),{headers:{"Cache-Control":"private, no-store"}})}
