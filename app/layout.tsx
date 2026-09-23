import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";

export const metadata: Metadata = {
  title: "Personel Takip Sistemi - Özel Okul & Dershane",
  description: "Personel, Bordro, İzin ve SGK Takip Sistemi",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body className="bg-slate-50 min-h-screen text-slate-800 flex flex-col lg:flex-row antialiased">
        <Sidebar />
        <main className="flex-1 min-w-0 flex flex-col min-h-screen overflow-x-hidden">
          {children}
        </main>
      </body>
    </html>
  );
}
