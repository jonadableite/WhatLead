import type { Metadata, Viewport } from "next";

import { Geist, Geist_Mono } from "next/font/google";

import "../index.css";
import Header from "@/components/header";
import Providers from "@/components/providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "WhatLead - WhatsApp Marketing Platform",
    template: "%s | WhatLead",
  },
  description: "Plataforma completa de WhatsApp Marketing com automação, proteção anti-ban, disparos em massa e IA avançada.",
  keywords: ["whatsapp", "marketing", "automação", "disparos", "mensagens", "vendas"],
  authors: [{ name: "WhatLead" }],
  creator: "WhatLead",
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: "WhatLead",
    title: "WhatLead - WhatsApp Marketing Platform",
    description: "Plataforma completa de WhatsApp Marketing",
  },
  twitter: {
    card: "summary_large_image",
    title: "WhatLead",
    description: "WhatsApp Marketing Platform",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#13131b" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning className="dark">
      <body 
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased min-h-dvh bg-background text-foreground`}
      >
        <Providers>
          <div className="relative flex min-h-dvh flex-col">
            {/* Background gradient effect */}
            <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
              <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-radial from-primary/5 via-transparent to-transparent opacity-50" />
              <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-radial from-primary/3 via-transparent to-transparent opacity-30" />
            </div>
            
            <Header />
            <main className="flex-1 safe-bottom">
              {children}
            </main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
