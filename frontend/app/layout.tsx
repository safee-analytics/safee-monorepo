import type { Metadata } from "next";
import { Inter, Cairo } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/providers/AuthProvider";
import { QueryProvider } from "@/lib/providers/QueryProvider";
import { WebSocketProvider } from "@/lib/websocket/WebSocketProvider";
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
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                function getTheme() {
                  const stored = localStorage.getItem('safee-theme');
                  // If explicitly set to light or dark, use that
                  if (stored === 'light') return 'light';
                  if (stored === 'dark') return 'dark';
                  // If set to auto or not set at all, use system preference
                  if (stored === 'auto' || !stored) {
                    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                  }
                  return 'light';
                }
                const theme = getTheme();
                document.documentElement.classList.remove('light', 'dark');
                document.documentElement.classList.add(theme);
              })();
            `,
          }}
        />
      </head>
      <body className={`${inter.variable} ${cairo.variable} antialiased`} suppressHydrationWarning>
        <QueryProvider>
          <AuthProvider>
            <WebSocketProvider>
              <ClientProviders>{children}</ClientProviders>
            </WebSocketProvider>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
