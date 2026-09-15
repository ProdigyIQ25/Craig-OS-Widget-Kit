import type { Metadata } from "next";
import { ActionLayer } from "@/components/actions/action-layer";
import "./globals.css";

export const metadata: Metadata = {
  title: "Craig OS Widget Kit",
  description: "Secure widget foundation for Craig OS",
  robots: { index: false, follow: false }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body><ActionLayer>{children}</ActionLayer></body>
    </html>
  );
}
