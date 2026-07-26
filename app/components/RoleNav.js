"use client";

import Link from "next/link";
import { useState } from "react";

const isStaging = process.env.NEXT_PUBLIC_APP_ENV !== "production";

export default function RoleNav() {
  const [role, setRole] = useState("client");
  const isClient = role === "client";

  const loginHref = isClient ? "/account/login" : "/landscaper/login";
  const dashboardHref = isClient ? "/account" : "/landscaper";
  const quoteHref = isClient ? "/" : "/landscapers";
  const quoteLabel = isClient ? "Get a Quote" : "Get Client Leads";

  return (
    <nav className="flex items-center gap-6 text-sm font-medium">
      {isStaging && (
        <Link href={quoteHref} className="hover:text-green-700">
          {quoteLabel}
        </Link>
      )}

      <div className="flex items-center gap-2">
        <span className="text-black">You are a:</span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setRole("client")}
            className={
              isClient ? "font-semibold text-green-700" : "text-black"
            }
          >
            Client
          </button>

          <button
            type="button"
            role="switch"
            aria-checked={!isClient}
            aria-label="Toggle between client and landscaper"
            onClick={() => setRole(isClient ? "landscaper" : "client")}
            className="relative h-6 w-11 shrink-0 rounded-full bg-zinc-300 transition-colors focus:outline-none focus:ring-2 focus:ring-green-600"
          >
            <span
              className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                isClient ? "translate-x-0" : "translate-x-5"
              }`}
            />
          </button>

          <button
            type="button"
            onClick={() => setRole("landscaper")}
            className={
              !isClient ? "font-semibold text-green-700" : "text-black"
            }
          >
            Landscaper
          </button>
        </div>
      </div>

      <Link href={loginHref} className="hover:text-green-700">
        Login
      </Link>
      <Link href={dashboardHref} className="hover:text-green-700">
        Dashboard
      </Link>
    </nav>
  );
}
