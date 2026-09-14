"use client";

import { useSearchParams } from "next/navigation";
import type { ReactNode } from "react";
import { parseWidgetConfig } from "@/lib/widget-config";
import { WidgetShell } from "./widget-shell";

export function ClientWidgetPage({ code, title, children, footer }: { code: string; title: string; children: (config: ReturnType<typeof parseWidgetConfig>) => ReactNode; footer?: string }) {
  const params = useSearchParams();
  const config = parseWidgetConfig(params);
  return <WidgetShell code={code} title={title} theme={config.theme} footer={footer}>{children(config)}</WidgetShell>;
}
