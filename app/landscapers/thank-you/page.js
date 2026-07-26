import Link from "next/link";

export default function LandscaperThankYou() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center bg-zinc-50 px-6 py-24 text-center">
      <h1 className="text-3xl font-bold text-green-700">
        You&apos;re signed up!
      </h1>
      <p className="mt-4 max-w-md text-zinc-900">
        We&apos;ll text or call you when a lead in your area matches your
        services.
      </p>
      <Link
        href="/"
        className="mt-8 rounded-md bg-green-700 px-4 py-2 font-medium text-white transition-colors hover:bg-green-800"
      >
        Back to Home
      </Link>
    </main>
  );
}
