import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { haversineMiles } from "@/lib/distance";
import { SERVICES } from "@/app/lib/services";
import { resolveActingUser, canWriteWhileImpersonating } from "@/lib/impersonation";
import { logout, requestLandscaper, stopImpersonation } from "./actions";

const ERROR_MESSAGES = {
  impersonation_read_only:
    "Writes are only enabled while previewing in staging. This action didn't go through.",
  impersonation_unsupported:
    "Phone verification isn't available while previewing as another user.",
};

export default async function AccountDashboard({ searchParams }) {
  const { verified, error } = await searchParams;
  const errorMessage = ERROR_MESSAGES[error];
  const supabase = await createClient();
  const { userId, isImpersonating } = await resolveActingUser(supabase, "client");

  if (!userId) {
    redirect("/account/login");
  }

  const { data: profile } = await supabase
    .from("client_profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (!profile) {
    redirect(isImpersonating ? "/admin?error=no_profile" : "/account/complete-profile");
  }

  const { data: userData } = await supabase.auth.getUser();
  const isPhoneVerified = Boolean(userData?.user?.phone_confirmed_at);

  const { data: landscapers, error: landscapersError } = await supabase
    .from("landscapers")
    .select("*");

  const nearby = (landscapers ?? [])
    .map((landscaper) => ({
      ...landscaper,
      distance: haversineMiles(
        profile.lat,
        profile.lng,
        landscaper.lat,
        landscaper.lng
      ),
    }))
    .sort((a, b) => {
      if (a.distance == null) return 1;
      if (b.distance == null) return -1;
      return a.distance - b.distance;
    });

  const { data: myRequests } = await supabase
    .from("service_requests")
    .select("*, landscapers(business_name, phone, email)")
    .eq("client_id", userId)
    .order("created_at", { ascending: false });

  return (
    <main className="flex flex-1 flex-col bg-zinc-50 px-6 py-10">
      {isImpersonating && (
        <div className="mx-auto mb-4 flex w-full max-w-4xl flex-wrap items-center justify-between gap-2 rounded-md bg-zinc-900 px-4 py-3 text-sm text-white">
          <span>
            Admin preview — viewing as <strong>{profile.name}</strong>.{" "}
            {canWriteWhileImpersonating()
              ? "Writes are enabled (staging)."
              : "Read-only in production."}
          </span>
          <form action={stopImpersonation}>
            <button
              type="submit"
              className="rounded-md border border-white px-3 py-1 text-xs font-medium hover:bg-white hover:text-zinc-900"
            >
              Stop Previewing
            </button>
          </form>
        </div>
      )}

      <div className="mx-auto flex w-full max-w-4xl items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-black">
            Hi, {profile.name}
          </h1>
          <p className="text-sm text-black">
            Showing landscapers near {profile.address}
          </p>
        </div>
        {!isImpersonating && (
          <form action={logout}>
            <button
              type="submit"
              className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium text-black hover:bg-zinc-100"
            >
              Log Out
            </button>
          </form>
        )}
      </div>

      <div className="mx-auto mt-4 w-full max-w-4xl">
        {errorMessage && (
          <p className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMessage}
          </p>
        )}
        {verified === "1" && (
          <p className="rounded-md bg-green-50 px-4 py-3 text-sm text-green-800">
            Your phone number is verified.
          </p>
        )}
        {!isImpersonating && !isPhoneVerified && verified !== "1" && (
          <p className="rounded-md bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
            Your phone number isn&apos;t verified yet.{" "}
            <Link
              href="/account/verify-phone"
              className="font-medium underline"
            >
              Verify it
            </Link>{" "}
            so landscapers know your requests are legit.
          </p>
        )}
      </div>

      {myRequests && myRequests.length > 0 && (
        <div className="mx-auto mt-8 w-full max-w-4xl">
          <h2 className="text-lg font-bold text-black">Your Requests</h2>
          <div className="mt-2 overflow-x-auto rounded-lg border border-zinc-200 bg-white">
            <table className="w-full min-w-[500px] text-sm text-black">
              <thead>
                <tr className="border-b border-zinc-200 text-left text-black">
                  <th className="px-4 py-2">Landscaper</th>
                  <th className="px-4 py-2">Service</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2">Requested</th>
                </tr>
              </thead>
              <tbody>
                {myRequests.map((req) => (
                  <tr
                    key={req.id}
                    className="border-b border-zinc-100 last:border-0"
                  >
                    <td className="px-4 py-2">
                      {req.landscapers?.business_name}
                      <div className="text-xs text-black">
                        {req.landscapers?.phone} &middot;{" "}
                        {req.landscapers?.email}
                      </div>
                    </td>
                    <td className="px-4 py-2">{req.service}</td>
                    <td className="px-4 py-2 capitalize">{req.status}</td>
                    <td className="px-4 py-2">
                      {new Date(req.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="mx-auto mt-8 w-full max-w-4xl">
        <h2 className="text-lg font-bold text-black">
          Landscapers Near You
        </h2>

        {landscapersError && (
          <p className="mt-2 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
            Couldn&apos;t load landscapers: {landscapersError.message}
          </p>
        )}

        {nearby.length === 0 && !landscapersError && (
          <p className="mt-2 text-sm text-black">
            No landscapers have signed up in your area yet.
          </p>
        )}

        <div className="mt-4 flex flex-col gap-4">
          {nearby.map((landscaper) => (
            <div
              key={landscaper.id}
              className="rounded-lg border border-zinc-200 bg-white p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="font-semibold text-black">
                    {landscaper.business_name}
                  </p>
                  <p className="text-sm text-black">
                    {landscaper.services}
                  </p>
                  <p className="text-sm text-black">
                    {landscaper.phone} &middot; {landscaper.email}
                  </p>
                  {landscaper.contact_hours && (
                    <p className="text-sm text-black">
                      Best hours to reach them: {landscaper.contact_hours}
                    </p>
                  )}
                  <p className="text-xs text-black">
                    {landscaper.distance != null
                      ? `${landscaper.distance} mi away`
                      : "Distance unknown"}
                  </p>
                </div>
              </div>

              <form
                action={requestLandscaper}
                className="mt-4 flex flex-wrap items-end gap-2 border-t border-zinc-100 pt-4"
              >
                <input
                  type="hidden"
                  name="landscaper_id"
                  value={landscaper.id}
                />
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-black">
                    Service
                  </label>
                  <select
                    name="service"
                    required
                    defaultValue=""
                    className="rounded-md border border-zinc-300 px-2 py-1.5 text-sm text-black"
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
                <div className="flex flex-1 flex-col gap-1">
                  <label className="text-xs font-medium text-black">
                    Message (optional)
                  </label>
                  <input
                    type="text"
                    name="message"
                    className="w-full rounded-md border border-zinc-300 px-2 py-1.5 text-sm text-black focus:border-green-600 focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  className="rounded-md bg-green-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-800"
                >
                  Request Service
                </button>
              </form>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
