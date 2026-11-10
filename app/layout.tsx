import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SectorX83 | Independent Research Network",
  description: "A private society and independent public-source research platform.",
  applicationName: "SectorX83",
  icons: { icon: "/favicon.ico" },
};

export const viewport: Viewport = { themeColor: "#090a0b", colorScheme: "dark", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
