import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";
import { NotificationBanner } from "@/components/NotificationBanner";

export const metadata: Metadata = {
  title: "COSMOS | Personel Takip Sistemi",
  description: "COSMOS - Özel Okul ve Dershane Personel Takip, Bordro ve Ödeme Sistemi",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "COSMOS",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const t = localStorage.getItem("cosmos_theme");
                if (t === "dark") {
                  document.documentElement.classList.add("dark");
                } else {
                  document.documentElement.classList.remove("dark");
                }
              } catch (_) {}
            `,
          }}
        />
      </head>
      <body className="bg-slate-50 dark:bg-slate-950 min-h-screen text-slate-800 dark:text-slate-100 flex flex-col lg:flex-row antialiased">
        <Sidebar />
        <main className="flex-1 min-w-0 flex flex-col min-h-screen overflow-x-hidden">
          <NotificationBanner />
          {children}
        </main>
      </body>
    </html>
  );
}
