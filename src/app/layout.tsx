// OWNER: Member C (Recipe Display / UX / Deploy)
import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SnapRecipe",
  description: "Snap a photo of food, get an AI-estimated recipe.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "SnapRecipe", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#ff6b35",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
