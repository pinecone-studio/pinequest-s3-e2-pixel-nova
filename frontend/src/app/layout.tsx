import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";
import { TooltipProvider } from "@/components/ui/tooltip";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-sans",
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
      <body className={`${manrope.variable} antialiased`}>
        <TooltipProvider>{children}</TooltipProvider>
      </body>
    </html>
  );
}
