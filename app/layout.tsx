import type { Metadata, Viewport } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "SectorX83 | Independent Institutional Network",
  description: "The digital home of SectorX83: governance, membership, communications and institutional records.",
  applicationName: "SectorX83",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
};
export const viewport: Viewport = {
  themeColor: "#171817",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
