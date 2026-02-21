import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ManuOS - Manufacturing Operating System",
  description: "Complete manufacturing management system for production planning, scheduling, and execution. Built with modern web technologies.",
  keywords: ["ManuOS", "Manufacturing", "ERP", "Production Planning", "Gantt Chart", "Kanban", "Inventory Management"],
  authors: [{ name: "ManuOS Team" }],
  icons: {
    icon: "/favicon.svg",
    apple: "/favicon.svg",
  },
  openGraph: {
    title: "ManuOS - Manufacturing Operating System",
    description: "Complete manufacturing management system",
    url: "https://manuos.app",
    siteName: "ManuOS",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ManuOS - Manufacturing Operating System",
    description: "Complete manufacturing management system",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
