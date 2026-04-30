import type { Metadata } from "next";
import "@/src/legacy/styles/index.css";

export const metadata: Metadata = {
  title: "Verilearn",
  description: "Verilearn learning platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
