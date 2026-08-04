import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./phase2.css";
import "./showcase-phase2.css";
import "./phase22-hud.css";
import "./phase23.css";
import "./release-candidate.css";

const title = "Lumi Island";
const description =
  "光る小さな島で、集めて、作って、住民のおねがいをかなえる子ども向け3Dスローライフゲーム。";

export const metadata: Metadata = {
  metadataBase: new URL("https://lumi-island-game.neon-acorn-2741.chatgpt.site"),
  title: {
    default: title,
    template: `%s | ${title}`,
  },
  description,
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
  openGraph: {
    title,
    description,
    type: "website",
    url: "/",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Lumi Island 3D game" }],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/og.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#203f43",
  colorScheme: "dark light",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
