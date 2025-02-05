import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "WebRTC Chat",
  description: "Real-time chat application using WebRTC and Next.js",
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
