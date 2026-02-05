import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { ProvidersWrapper } from "@/components/ProvidersWrapper";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
});

export const metadata: Metadata = {
  title: "pockeet - Your Smart USDC Treasury",
  description: "Deposit from anywhere, earn everywhere. The easiest way to manage and grow your USDC across multiple chains.",
  keywords: ["USDC", "DeFi", "Yield", "Treasury", "Multi-chain", "Sui", "Arc", "Ethereum"],
  authors: [{ name: "Sejoro Ajose" }],
  openGraph: {
    title: "pockeet - Your Smart USDC Treasury",
    description: "Deposit from anywhere, earn everywhere",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "pockeet - Your Smart USDC Treasury",
    description: "Deposit from anywhere, earn everywhere",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link href="https://fonts.cdnfonts.com/css/coolvetica" rel="stylesheet" />
      </head>
      <body className={`${geist.variable} antialiased bg-gray-50 min-h-screen`}>
        <ProvidersWrapper>
          <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-1">
              {children}
            </main>
            {/* <Footer /> */}
          </div>
        </ProvidersWrapper>
      </body>
    </html>
  );
}