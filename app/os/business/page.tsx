import type { Metadata } from "next";
import { Suspense } from "react";
import { BusinessCommandShell } from "@/components/os/command-shell";

export const metadata: Metadata = { title: "ProdigyIQ OS · Craig OS" };

export default function BusinessAppPage() {
  return <Suspense fallback={<main className="os-shell os-business"><div className="os-loading" role="status" aria-busy="true"><span/><span/><span/><span/></div></main>}><BusinessCommandShell/></Suspense>;
}
