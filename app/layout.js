import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import RoleNav from "./components/RoleNav";
import { supabase } from "@/lib/supabaseClient";
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

// Keeps the "Now serving..." client/company counts in the header from
// getting frozen at build time -- refetched at most once a minute.
export const revalidate = 60;

export default async function RootLayout({ children }) {
  const { data: stats } = await supabase.rpc("get_platform_stats").maybeSingle();
  const clientCount = stats?.client_count ?? 0;
  const landscaperCount = stats?.company_count ?? 0;

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
            <RoleNav />
          </div>
          <div className="border-t border-zinc-100 bg-zinc-50 py-1.5 text-center text-xs text-black">
            Now serving {clientCount} client{clientCount === 1 ? "" : "s"} and{" "}
            {landscaperCount} landscaper{landscaperCount === 1 ? "" : "s"}
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
