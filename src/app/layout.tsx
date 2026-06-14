import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pixelwar · Interactive Pixel Wall",
  description: "Eine moderne soziale Pixel-Wall mit virtueller Economy, Pixel-Besitz und Strategie-Game-Mechaniken."
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="de">
      <body>
        <div className="fixed inset-0 -z-10 bg-aurora" />
        <div className="fixed inset-0 -z-10 bg-grid bg-[size:32px_32px] opacity-40" />
        {children}
      </body>
    </html>
  );
}
