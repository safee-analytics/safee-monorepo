import type { Metadata } from "next";
import { Inter, Cairo } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/providers/AuthProvider";
import { QueryProvider } from "@/lib/providers/QueryProvider";
import { ClientProviders } from "@/lib/providers/ClientProviders";

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
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
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
            <ClientProviders>{children}</ClientProviders>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
