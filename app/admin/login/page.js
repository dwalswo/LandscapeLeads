import { login } from "./actions";

const ERROR_MESSAGES = {
  missing_fields: "Please enter your email and password.",
  invalid_credentials: "Invalid email or password.",
};

export default async function AdminLogin({ searchParams }) {
  const { error } = await searchParams;
  const errorMessage = ERROR_MESSAGES[error];

  return (
    <main className="flex flex-1 flex-col items-center justify-center bg-zinc-50 px-6 py-24">
      <div className="w-full max-w-sm">
        <h1 className="text-center text-2xl font-bold text-black">
          Admin Login
        </h1>

        <form action={login} className="mt-8 flex flex-col gap-4">
          {errorMessage && (
            <p className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
              {errorMessage}
            </p>
          )}

          <div className="flex flex-col gap-1">
            <label htmlFor="email" className="text-sm font-medium text-black">
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
              className="rounded-md border border-zinc-300 px-3 py-2 text-black focus:border-green-600 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            className="mt-2 rounded-md bg-green-700 px-4 py-2 font-medium text-white transition-colors hover:bg-green-800"
          >
            Log In
          </button>
        </form>
      </div>
    </main>
  );
}
