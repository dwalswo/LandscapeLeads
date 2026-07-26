import { submitLead } from "@/app/actions";
import { SERVICES, BUDGET_RANGES, TIMELINES } from "@/app/lib/services";
import PhoneInput from "@/app/components/PhoneInput";

const ERROR_MESSAGES = {
  missing_fields: "Please fill in all required fields.",
  server_error: "Something went wrong submitting your request. Please try again.",
};

export default async function Home({ searchParams }) {
  const { error } = await searchParams;
  const errorMessage = ERROR_MESSAGES[error];

  return (
    <main className="flex flex-1 flex-col items-center bg-zinc-50">
      <section className="w-full bg-green-700 py-16 text-white">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Get a Free Landscaping Quote in Pflugerville, TX
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-green-50">
            Tell us what you need done and we&apos;ll connect you with a
            landscaper local to Pflugerville. No cost, no obligation.
          </p>
        </div>
      </section>

      <section
        id="quote-form"
        className="w-full max-w-md flex-1 px-6 py-12"
      >
        <form action={submitLead} className="flex flex-col gap-4">
          {errorMessage && (
            <p className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
              {errorMessage}
            </p>
          )}

          <div className="flex flex-col gap-1">
            <label htmlFor="name" className="text-sm font-medium text-zinc-900">
              Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              className="rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 focus:border-green-600 focus:outline-none"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="phone" className="text-sm font-medium text-zinc-900">
              Phone Number
            </label>
            <PhoneInput
              id="phone"
              name="phone"
              required
              className="rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 focus:border-green-600 focus:outline-none"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="email" className="text-sm font-medium text-zinc-900">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 focus:border-green-600 focus:outline-none"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="address" className="text-sm font-medium text-zinc-900">
              Address
            </label>
            <input
              id="address"
              name="address"
              type="text"
              required
              placeholder="e.g. 123 Main St, Pflugerville, TX 78660"
              className="rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 placeholder:text-zinc-700 focus:border-green-600 focus:outline-none"
            />
            <p className="text-xs text-zinc-900">
              Currently serving Pflugerville, TX and nearby areas.
            </p>
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="service" className="text-sm font-medium text-zinc-900">
              Service Needed
            </label>
            <select
              id="service"
              name="service"
              required
              defaultValue=""
              className="rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 focus:border-green-600 focus:outline-none"
            >
              <option value="" disabled>
                Select a service
              </option>
              {SERVICES.map((service) => (
                <option key={service} value={service}>
                  {service}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="budget_range" className="text-sm font-medium text-zinc-900">
              Budget Range
            </label>
            <select
              id="budget_range"
              name="budget_range"
              required
              defaultValue=""
              className="rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 focus:border-green-600 focus:outline-none"
            >
              <option value="" disabled>
                Select a budget range
              </option>
              {BUDGET_RANGES.map((range) => (
                <option key={range} value={range}>
                  {range}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="timeline" className="text-sm font-medium text-zinc-900">
              Timeline
            </label>
            <select
              id="timeline"
              name="timeline"
              required
              defaultValue=""
              className="rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 focus:border-green-600 focus:outline-none"
            >
              <option value="" disabled>
                Select a timeline
              </option>
              {TIMELINES.map((timeline) => (
                <option key={timeline} value={timeline}>
                  {timeline}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="notes" className="text-sm font-medium text-zinc-900">
              Anything else we should know? (optional)
            </label>
            <textarea
              id="notes"
              name="notes"
              rows={3}
              className="rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 focus:border-green-600 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            className="mt-2 rounded-md bg-green-700 px-4 py-2 font-medium text-white transition-colors hover:bg-green-800"
          >
            Get My Free Quote
          </button>
        </form>
      </section>
    </main>
  );
}
