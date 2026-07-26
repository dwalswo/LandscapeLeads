import { completeProfile } from "../actions";
import PhoneInput from "@/app/components/PhoneInput";

const ERROR_MESSAGES = {
  missing_fields: "Please fill in all fields.",
  server_error: "Something went wrong saving your profile. Please try again.",
};

export default async function CompleteProfile({ searchParams }) {
  const { error } = await searchParams;
  const errorMessage = ERROR_MESSAGES[error];

  return (
    <main className="flex flex-1 flex-col items-center justify-center bg-zinc-50 px-6 py-24">
      <div className="w-full max-w-sm">
        <h1 className="text-center text-2xl font-bold text-black">
          One More Step
        </h1>
        <p className="mt-2 text-center text-sm text-black">
          Tell us a bit about you so we can find landscapers near you.
        </p>

        <form action={completeProfile} className="mt-8 flex flex-col gap-4">
          {errorMessage && (
            <p className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
              {errorMessage}
            </p>
          )}

          <div className="flex flex-col gap-1">
            <label htmlFor="name" className="text-sm font-medium text-black">
              Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              className="rounded-md border border-zinc-300 px-3 py-2 text-black focus:border-green-600 focus:outline-none"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="phone" className="text-sm font-medium text-black">
              Phone Number
            </label>
            <PhoneInput
              id="phone"
              name="phone"
              required
              className="rounded-md border border-zinc-300 px-3 py-2 text-black focus:border-green-600 focus:outline-none"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="address" className="text-sm font-medium text-black">
              Address
            </label>
            <input
              id="address"
              name="address"
              type="text"
              required
              placeholder="e.g. 123 Main St, Pflugerville, TX 78660"
              className="rounded-md border border-zinc-300 px-3 py-2 text-black placeholder:text-zinc-700 focus:border-green-600 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            className="mt-2 rounded-md bg-green-700 px-4 py-2 font-medium text-white transition-colors hover:bg-green-800"
          >
            Continue
          </button>
        </form>
      </div>
    </main>
  );
}
