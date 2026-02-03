import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Upsell Funnel Builder",
  description: "Drag-and-drop funnel builder",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
