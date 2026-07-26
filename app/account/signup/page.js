import Link from "next/link";
import { signup } from "../actions";

const ERROR_MESSAGES = {
  missing_fields: "Please enter your email and password.",
  signup_failed: "Couldn't create your account. Try a different email or a stronger password.",
};

export default async function ClientSignup({ searchParams }) {
  const { error, message } = await searchParams;
  const errorMessage = ERROR_MESSAGES[error];

  return (
    <main className="flex flex-1 flex-col items-center justify-center bg-zinc-50 px-6 py-24">
      <div className="w-full max-w-sm">
        <h1 className="text-center text-2xl font-bold text-black">
          Create Your Account
        </h1>
        <p className="mt-2 text-center text-sm text-black">
          Browse landscapers near you and request service directly.
        </p>

        {message === "check_email" ? (
          <p className="mt-8 rounded-md bg-green-50 px-4 py-3 text-sm text-green-800">
            Almost done — check your email for a confirmation link, then log
            in.
          </p>
        ) : (
          <form action={signup} className="mt-8 flex flex-col gap-4">
            {errorMessage && (
              <p className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
                {errorMessage}
              </p>
            )}

            <div className="flex flex-col gap-1">
              <label
                htmlFor="email"
                className="text-sm font-medium text-black"
              >
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="rounded-md border border-zinc-300 px-3 py-2 text-black focus:border-green-600 focus:outline-none"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label
                htmlFor="password"
                className="text-sm font-medium text-black"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                minLength={6}
                className="rounded-md border border-zinc-300 px-3 py-2 text-black focus:border-green-600 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="mt-2 rounded-md bg-green-700 px-4 py-2 font-medium text-white transition-colors hover:bg-green-800"
            >
              Create Account
            </button>
          </form>
        )}

        <p className="mt-4 text-center text-sm text-black">
          Already have an account?{" "}
          <Link href="/account/login" className="font-medium text-green-700">
            Log in
          </Link>
        </p>
      </div>
    </main>
  );
}
