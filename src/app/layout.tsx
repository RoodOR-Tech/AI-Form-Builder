import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Use Form Builder",
  description: "Guided Information Technology Investment AI Use Form",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
