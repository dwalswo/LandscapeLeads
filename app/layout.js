import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "LandscapeLeads — Free Landscaping Quotes in Pflugerville, TX",
  description:
    "Get matched with a local landscaper in Pflugerville, TX for free, or sign up as a landscaper to receive leads in the area.",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-white text-black">
        <header className="border-b border-zinc-200">
          <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
            <Link href="/" className="text-lg font-bold text-green-700">
              LandscapeLeads
            </Link>
            <nav className="flex items-center gap-6 text-sm font-medium">
              <Link href="/" className="hover:text-green-700">
                Get a Quote
              </Link>
              <Link href="/landscapers" className="hover:text-green-700">
                For Landscapers
              </Link>
            </nav>
          </div>
        </header>
        <div className="flex flex-1 flex-col">{children}</div>
        <footer className="border-t border-zinc-200 py-6 text-center text-sm text-black">
          &copy; {new Date().getFullYear()} LandscapeLeads &middot;{" "}
          <Link href="/admin" className="hover:text-green-700">
            Admin
          </Link>
        </footer>
      </body>
    </html>
  );
}
