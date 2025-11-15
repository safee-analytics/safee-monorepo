import type { Metadata } from "next";
import { Inter, Cairo } from "next/font/google";
import "./globals.css";
import { DirectionWrapper } from "@/components/layout/DirectionWrapper";
import { AuthProvider } from "@/lib/providers/AuthProvider";
import { QueryProvider } from "@/lib/providers/QueryProvider";

// Arabic and English font support
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic", "latin"],
});

export const metadata: Metadata = {
  title: "Safee Analytics - حلول الأعمال الذكية",
  description: "Integrated business management platform for MENA region | منصة إدارة الأعمال المتكاملة",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <body className={`${inter.variable} ${cairo.variable} antialiased`} suppressHydrationWarning>
        <QueryProvider>
          <AuthProvider>
            <DirectionWrapper>{children}</DirectionWrapper>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
