import type { Metadata, Viewport } from "next";
import { ActionLayer } from "@/components/actions/action-layer";
import "./globals.css";

export const metadata: Metadata = {
  title: "Craig OS",
  description: "Craig OS direct operating application",
  applicationName: "Craig OS",
  appleWebApp: { capable: true, title: "Craig OS", statusBarStyle: "black-translucent" },
  robots: { index: false, follow: false }
};

export const viewport: Viewport = { themeColor: "#12161c", colorScheme: "dark", width: "device-width", initialScale: 1, viewportFit: "cover" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body><ActionLayer>{children}</ActionLayer></body>
    </html>
  );
}
