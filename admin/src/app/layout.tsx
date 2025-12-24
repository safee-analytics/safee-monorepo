import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Safee Admin Dashboard",
  description: "Admin dashboard for managing Safee platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
