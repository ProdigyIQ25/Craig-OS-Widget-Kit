import type { Metadata } from "next";
import { PersonalCommandShell } from "@/components/os/command-shell";
export const metadata:Metadata={title:"David Command · Craig OS"};
export default function PersonalCommandPage(){return <PersonalCommandShell/>}
