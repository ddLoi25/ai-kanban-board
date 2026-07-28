import type { Metadata } from "next";
import { Archivo_Black, Manrope } from "next/font/google";
import "./globals.css";

const archivoBlack = Archivo_Black({
  variable: "--font-archivo-black",
  subsets: ["latin"],
  weight: ["400"],
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Kanflow",
  description: "A Kanban board that keeps up with how you actually work.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${archivoBlack.variable} ${manrope.variable} h-full antialiased`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
