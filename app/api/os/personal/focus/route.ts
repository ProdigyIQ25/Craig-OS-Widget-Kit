import { aggregateResponse } from "@/lib/phase15/http";

export const dynamic = "force-dynamic";

export function GET() {
  return aggregateResponse("/api/os/personal/focus");
}
