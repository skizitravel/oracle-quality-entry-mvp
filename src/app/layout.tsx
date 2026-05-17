import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Oracle Quality Entry MVP",
  description: "Prototype form builder and inspection entry app for Oracle Quality receiving inspection."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen font-sans antialiased">
        <header className="no-print border-b border-border bg-white">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
            <Link href="/" className="text-sm font-semibold tracking-wide text-slate-950">
              Oracle Quality Entry MVP
            </Link>
            <nav className="flex items-center gap-4 text-sm text-muted-foreground">
              <Link href="/admin/forms" className="hover:text-slate-950">
                Admin
              </Link>
              <Link href="/inspect" className="hover:text-slate-950">
                Inspector
              </Link>
            </nav>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
