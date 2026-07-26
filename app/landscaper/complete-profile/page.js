import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SERVICES } from "@/app/lib/services";
import { resolveActingUser, canWriteWhileImpersonating } from "@/lib/impersonation";
import { saveProfile } from "../actions";
import PhoneInput from "@/app/components/PhoneInput";

const ERROR_MESSAGES = {
  missing_fields:
    "Please fill in all required fields and pick at least one service.",
  server_error: "Something went wrong saving your profile. Please try again.",
  address_rate_limited:
    "You can only change your address once per week. Try again later.",
  impersonation_read_only:
    "Writes are only enabled while previewing in staging. This action didn't go through.",
};

export default async function LandscaperCompleteProfile({ searchParams }) {
  const { error } = await searchParams;
  const errorMessage = ERROR_MESSAGES[error];

  const supabase = await createClient();
  const { userId, isImpersonating } = await resolveActingUser(supabase, "landscaper");

  if (!userId) {
    redirect("/landscaper/login");
  }

  const readOnly = isImpersonating && !canWriteWhileImpersonating();

  const { data: profile } = await supabase
    .from("landscapers")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  const selectedServices = profile?.services
    ? profile.services.split(", ").map((s) => s.trim())
    : [];

  const daysSinceAddressUpdate = profile?.address_updated_at
    ? (Date.now() - new Date(profile.address_updated_at).getTime()) /
      (1000 * 60 * 60 * 24)
    : Infinity;
  const canChangeAddress = daysSinceAddressUpdate >= 7;
  const nextAddressChangeDate = profile?.address_updated_at
    ? new Date(
        new Date(profile.address_updated_at).getTime() + 7 * 24 * 60 * 60 * 1000
      )
    : null;

  return (
    <main className="flex flex-1 flex-col items-center bg-zinc-50 px-6 py-12">
      <div className="w-full max-w-md">
        <h1 className="text-center text-2xl font-bold text-black">
          {profile ? "Edit Your Profile" : "Set Up Your Profile"}
        </h1>

        <form action={saveProfile} className="mt-8 flex flex-col gap-4">
          {isImpersonating && (
            <p className="rounded-md bg-zinc-900 px-4 py-3 text-sm text-white">
              Admin preview.{" "}
              {readOnly
                ? "Saving is disabled in production."
                : "Saving is enabled (staging)."}
            </p>
          )}
          {errorMessage && (
            <p className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
              {errorMessage}
            </p>
          )}

          <div className="flex flex-col gap-1">
            <label
              htmlFor="business_name"
              className="text-sm font-medium text-black"
            >
              Business Name
            </label>
            <input
              id="business_name"
              name="business_name"
              type="text"
              required
              defaultValue={profile?.business_name ?? ""}
              className="rounded-md border border-zinc-300 px-3 py-2 text-black focus:border-green-600 focus:outline-none"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label
              htmlFor="contact_name"
              className="text-sm font-medium text-black"
            >
              Your Name
            </label>
            <input
              id="contact_name"
              name="contact_name"
              type="text"
              required
              defaultValue={profile?.contact_name ?? ""}
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
              defaultValue={profile?.phone}
              className="rounded-md border border-zinc-300 px-3 py-2 text-black focus:border-green-600 focus:outline-none"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="email" className="text-sm font-medium text-black">
              Public Email (optional)
            </label>
            <input
              id="email"
              name="email"
              type="email"
              defaultValue={profile?.email ?? ""}
              className="rounded-md border border-zinc-300 px-3 py-2 text-black focus:border-green-600 focus:outline-none"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="address" className="text-sm font-medium text-black">
              Home Base Address
            </label>
            <input
              id="address"
              name="address"
              type="text"
              required
              placeholder="e.g. 123 Main St, Pflugerville, TX 78660"
              defaultValue={profile?.address ?? ""}
              readOnly={!canChangeAddress}
              className={`rounded-md border border-zinc-300 px-3 py-2 text-black placeholder:text-zinc-700 focus:border-green-600 focus:outline-none ${
                !canChangeAddress ? "bg-zinc-100 text-zinc-600" : ""
              }`}
            />
            {!canChangeAddress && nextAddressChangeDate && (
              <p className="text-xs text-zinc-700">
                You can update your address again on{" "}
                {nextAddressChangeDate.toLocaleDateString()}.
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <label
              htmlFor="service_radius_miles"
              className="text-sm font-medium text-black"
            >
              Service Radius (miles)
            </label>
            <input
              id="service_radius_miles"
              name="service_radius_miles"
              type="number"
              min="1"
              defaultValue={profile?.service_radius_miles ?? 10}
              className="rounded-md border border-zinc-300 px-3 py-2 text-black focus:border-green-600 focus:outline-none"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label
              htmlFor="contact_hours"
              className="text-sm font-medium text-black"
            >
              Best Hours for Clients to Reach You (optional)
            </label>
            <input
              id="contact_hours"
              name="contact_hours"
              type="text"
              placeholder="e.g. Mon-Fri 9am-5pm"
              defaultValue={profile?.contact_hours ?? ""}
              className="rounded-md border border-zinc-300 px-3 py-2 text-black placeholder:text-zinc-700 focus:border-green-600 focus:outline-none"
            />
          </div>

          <fieldset className="flex flex-col gap-2">
            <legend className="text-sm font-medium text-black">
              Services Offered
            </legend>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {SERVICES.map((service) => (
                <label
                  key={service}
                  className="flex items-center gap-2 text-sm text-black"
                >
                  <input
                    type="checkbox"
                    name="services"
                    value={service}
                    defaultChecked={selectedServices.includes(service)}
                    className="rounded border-zinc-300 text-green-700 focus:ring-green-600"
                  />
                  {service}
                </label>
              ))}
            </div>
          </fieldset>

          <button
            type="submit"
            disabled={readOnly}
            className="mt-2 rounded-md bg-green-700 px-4 py-2 font-medium text-white transition-colors hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {profile ? "Save Changes" : "Continue"}
          </button>
        </form>
      </div>
    </main>
  );
}
