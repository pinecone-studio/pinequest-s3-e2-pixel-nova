import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { TooltipProvider } from "@/components/ui/tooltip";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-sans",
});

const notoSansMongolian = localFont({
  src: "../../node_modules/@fontsource/noto-sans-mongolian/files/noto-sans-mongolian-mongolian-400-normal.woff2",
  variable: "--font-mongolian",
  display: "swap",
});

export const metadata: Metadata = {
  title: "EduCore LMS",
  description: "AI-д суурилсан онлайн шалгалтын платформ",
  icons: {
    icon: [
      { url: "/favicon.svg?v=2", type: "image/svg+xml" },
      { url: "/icon.svg?v=2", type: "image/svg+xml" },
    ],
    shortcut: ["/favicon.svg?v=2"],
    apple: ["/favicon.svg?v=2"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="mn">
      <body
        className={`${manrope.variable} ${notoSansMongolian.variable} antialiased`}
      >
        <TooltipProvider>{children}</TooltipProvider>
      </body>
    </html>
  );
}
