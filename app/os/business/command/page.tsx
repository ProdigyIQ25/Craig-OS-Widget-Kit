import type { Metadata } from "next";
import { Suspense } from "react";
import { BusinessCommandShell } from "@/components/os/command-shell";
export const metadata:Metadata={title:"Executive Command · Craig OS"};
export default function BusinessCommandPage(){return <Suspense fallback={<main className="os-shell os-business"><div className="os-loading" role="status" aria-busy="true"><span/><span/><span/><span/></div></main>}><BusinessCommandShell/></Suspense>}
