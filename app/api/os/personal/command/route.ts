import { NextResponse } from "next/server";
import { personalCommandResponse } from "@/lib/server/os-responses";
export const dynamic="force-dynamic";
export async function GET(){return NextResponse.json(await personalCommandResponse(),{headers:{"Cache-Control":"private, no-store"}})}
