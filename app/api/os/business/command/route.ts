import { NextResponse } from "next/server";
import { businessCommandResponse } from "@/lib/server/os-responses";
export const dynamic="force-dynamic";
export async function GET(){return NextResponse.json(await businessCommandResponse(),{headers:{"Cache-Control":"private, no-store"}})}
