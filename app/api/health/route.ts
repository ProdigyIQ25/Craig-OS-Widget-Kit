import { NextResponse } from "next/server";
import { success } from "@/lib/api-contract";
import packageJson from "../../../package.json";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json(
    success({
      status: "ok",
      app: "craig-os-widget-kit",
      environment: process.env.APP_ENV ?? process.env.VERCEL_ENV ?? "development",
      version: packageJson.version,
      timestamp: new Date().toISOString()
    }),
    { status: 200, headers: { "Cache-Control": "no-store" } }
  );
}
