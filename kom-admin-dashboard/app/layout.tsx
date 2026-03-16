import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const cairo = Cairo({
  subsets: ["arabic"],
  variable: "--font-cairo",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "لوحة تحكم KOM",
  description: "لوحة تحكم ملك السوق - KOM",
  icons: {
    icon: "/favicon.png?v=2",
    shortcut: "/favicon.png?v=2",
    apple: "/favicon.png?v=2",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <body className={`${cairo.variable} antialiased bg-[#f7f7f7] text-black`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
