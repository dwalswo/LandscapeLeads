import { submitLandscaper } from "@/app/actions";
import { SERVICES } from "@/app/lib/services";

const ERROR_MESSAGES = {
  missing_fields: "Please fill in all required fields and pick at least one service.",
  server_error: "Something went wrong submitting your profile. Please try again.",
};

export default async function Landscapers({ searchParams }) {
  const { error } = await searchParams;
  const errorMessage = ERROR_MESSAGES[error];

  return (
    <main className="flex flex-1 flex-col items-center bg-zinc-50">
      <section className="w-full bg-zinc-900 py-16 text-white">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Get Pflugerville-Area Leads Sent Straight to You
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-white">
            We&apos;re signing up landscapers serving Pflugerville, TX and
            nearby areas. Sign up with your service area and we&apos;ll
            send you leads from homeowners near you. First leads are free
            — no cost to sign up.
          </p>
        </div>
      </section>

      <section
        id="signup-form"
        className="w-full max-w-md flex-1 px-6 py-12"
      >
        <form action={submitLandscaper} className="flex flex-col gap-4">
          {errorMessage && (
            <p className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
              {errorMessage}
            </p>
          )}

          <div className="flex flex-col gap-1">
            <label
              htmlFor="business_name"
              className="text-sm font-medium text-zinc-900"
            >
              Business Name
            </label>
            <input
              id="business_name"
              name="business_name"
              type="text"
              required
              className="rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 focus:border-green-600 focus:outline-none"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label
              htmlFor="contact_name"
              className="text-sm font-medium text-zinc-900"
            >
              Your Name
            </label>
            <input
              id="contact_name"
              name="contact_name"
              type="text"
              required
              className="rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 focus:border-green-600 focus:outline-none"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="phone" className="text-sm font-medium text-zinc-900">
              Phone Number
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              required
              className="rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 focus:border-green-600 focus:outline-none"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="email" className="text-sm font-medium text-zinc-900">
              Email (optional)
            </label>
            <input
              id="email"
              name="email"
              type="email"
              className="rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 focus:border-green-600 focus:outline-none"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="zip" className="text-sm font-medium text-zinc-900">
              Home Base Zip Code
            </label>
            <input
              id="zip"
              name="zip"
              type="text"
              required
              placeholder="e.g. 78660"
              className="rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 placeholder:text-zinc-700 focus:border-green-600 focus:outline-none"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label
              htmlFor="service_radius_miles"
              className="text-sm font-medium text-zinc-900"
            >
              Service Radius (miles)
            </label>
            <input
              id="service_radius_miles"
              name="service_radius_miles"
              type="number"
              min="1"
              defaultValue={10}
              className="rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 focus:border-green-600 focus:outline-none"
            />
          </div>

          <fieldset className="flex flex-col gap-2">
            <legend className="text-sm font-medium text-zinc-900">
              Services Offered
            </legend>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {SERVICES.map((service) => (
                <label
                  key={service}
                  className="flex items-center gap-2 text-sm text-zinc-900"
                >
                  <input
                    type="checkbox"
                    name="services"
                    value={service}
                    className="rounded border-zinc-300 text-green-700 focus:ring-green-600"
                  />
                  {service}
                </label>
              ))}
            </div>
          </fieldset>

          <button
            type="submit"
            className="mt-2 rounded-md bg-green-700 px-4 py-2 font-medium text-white transition-colors hover:bg-green-800"
          >
            Sign Up for Leads
          </button>
        </form>
      </section>
    </main>
  );
}
