import type { Metadata } from "next";
import { Suspense } from "react";
import { PersonalCommandShell } from "@/components/os/command-shell";

export const metadata: Metadata = { title: "Personal OS · Craig OS" };

export default function PersonalAppPage() {
  return <Suspense fallback={<main className="os-shell os-personal"><div className="os-loading" role="status" aria-busy="true"><span/><span/><span/><span/></div></main>}><PersonalCommandShell/></Suspense>;
}
