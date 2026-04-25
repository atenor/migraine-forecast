import type { Metadata } from "next";
import localFont from "next/font/local";
import { Inter } from "next/font/google";
import Link from "next/link";
import BottomNav from "@/components/BottomNav";
import { SettingsProvider } from "@/lib/settings-context";
import "./globals.css";

const geistSans = localFont({ src: "./fonts/GeistVF.woff", variable: "--font-geist-sans", weight: "100 900" });
const geistMono = localFont({ src: "./fonts/GeistMonoVF.woff", variable: "--font-geist-mono", weight: "100 900" });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", weight: ["300", "400", "500", "600", "700"] });

export const metadata: Metadata = {
  title: "Migraine Forecast",
  description: "Barometric pressure-aware migraine risk tracker",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} ${inter.variable} antialiased min-h-screen overflow-x-hidden`}>
        <div style={{ overflowX: "clip" }}>
        <SettingsProvider>

          {/* ── Header ── */}
          <header className="fixed top-0 left-0 right-0 z-40 h-16
                             bg-[rgba(5,13,26,0.7)] backdrop-blur-2xl
                             border-b border-white/[0.05]">
            <div className="max-w-2xl mx-auto h-full px-5 flex items-center justify-between">

              {/* Logo mark + wordmark */}
              <Link href="/" className="flex items-center gap-3 group">
                {/* SVG mark: miniature pressure gauge arc — mirrors the risk gauge */}
                <svg width="32" height="20" viewBox="0 0 32 20" fill="none" className="shrink-0">
                  {/* Track arc */}
                  <path
                    d="M 2,18 A 14,14 0 0,1 30,18"
                    stroke="rgba(78,205,196,0.18)"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                  {/* Filled arc — about 40% — suggests a live reading */}
                  <path
                    d="M 2,18 A 14,14 0 0,1 14.2,4.5"
                    stroke="#4ecdc4"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    style={{ filter: "drop-shadow(0 0 4px rgba(78,205,196,0.6))" }}
                  />
                  {/* Center dot */}
                  <circle cx="16" cy="18" r="1.5" fill="rgba(78,205,196,0.35)" />
                </svg>

                {/* Two-line wordmark */}
                <div className="flex flex-col leading-none select-none">
                  <span
                    className="font-[var(--font-inter)] text-[10px] font-medium tracking-[0.25em] uppercase text-calm-mist/60
                               group-hover:text-calm-mist transition-colors duration-300"
                  >
                    Migraine
                  </span>
                  <span
                    className="font-[var(--font-inter)] text-[16px] font-semibold tracking-[-0.01em] text-white/90
                               group-hover:text-white transition-colors duration-300"
                    style={{ marginTop: "2px" }}
                  >
                    Forecast
                  </span>
                </div>
              </Link>

              {/* Settings button */}
              <Link
                href="/settings"
                aria-label="Settings"
                className="w-9 h-9 flex items-center justify-center rounded-full
                           bg-white/[0.05] border border-white/[0.08]
                           text-white/35 hover:text-calm-teal hover:border-calm-teal/30
                           hover:bg-calm-teal/[0.07] transition-all duration-200"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className="w-[17px] h-[17px]">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </Link>
            </div>
          </header>

          {/* Page content */}
          <main className="max-w-2xl mx-auto px-4 pt-24 pb-36 min-h-screen">
            {children}
          </main>

          {/* Bottom tab navigation */}
          <BottomNav />

        </SettingsProvider>
        </div>
      </body>
    </html>
  );
}
