import type { Metadata } from "next";
import { BusinessCommandShell } from "@/components/os/command-shell";
export const metadata:Metadata={title:"Executive Command · Craig OS"};
export default function BusinessCommandPage(){return <BusinessCommandShell/>}
