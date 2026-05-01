import type { Metadata } from "next";
import { Inter } from "next/font/google";

import "./globals.css";

const headingFont = Inter({
  subsets: ["latin"],
  variable: "--font-heading",
  weight: ["500", "600", "700", "800"]
});

const bodyFont = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600"]
});

export const metadata: Metadata = {
  title: "Brainio LMS",
  description: "Brainio LMS demo dashboards for 5 roles."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${headingFont.variable} ${bodyFont.variable}`}>
      <body>{children}</body>
    </html>
  );
}
