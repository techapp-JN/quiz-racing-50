import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "QUIZ JUSTNEW",
  description: "ตอบให้ไว แข่งให้สุด ใครจะเป็น Champion?",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased relative min-h-screen flex flex-col`}
      >
        <div className="flex-1">
          {children}
        </div>
        <div className="fixed bottom-1 right-2 text-[10px] text-slate-500/50 pointer-events-none z-50">
          v1.0.2 (Update: Reset System Fix)
        </div>
      </body>
    </html>
  );
}
