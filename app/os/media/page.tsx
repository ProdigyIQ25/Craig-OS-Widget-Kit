import type { Metadata } from "next";
import { Suspense } from "react";
import { MediaTheaterRoute } from "@/components/os/media-theater";

export const metadata:Metadata={title:"Craig Media Theater · Craig OS"};
export default function Page(){return <Suspense fallback={<main className="os-shell os-personal"><div className="os-loading" role="status" aria-busy="true"><span/><span/><span/><span/></div></main>}><MediaTheaterRoute/></Suspense>}
