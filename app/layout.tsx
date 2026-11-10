import type { Metadata, Viewport } from "next";
import "./globals.css";
import PhaseTwoDock from "@/components/PhaseTwoDock";

export const metadata: Metadata = {
  title: "SectorX83 | Independent Research Network",
  description: "Independent public-source research, institutional analysis and a voluntary community for discussion and shared learning.",
  applicationName: "SectorX83",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
};

export const viewport: Viewport = { themeColor: "#0b0b0a", colorScheme: "dark", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}<PhaseTwoDock /></body></html>;
}
