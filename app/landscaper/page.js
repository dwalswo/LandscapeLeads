import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { haversineMiles } from "@/lib/distance";
import { computeLeadPrice } from "@/lib/pricing";
import { resolveActingUser, canWriteWhileImpersonating } from "@/lib/impersonation";
import { abbreviateName } from "@/lib/name";
import { cityOnly } from "@/lib/address";
import { logout, updateRequestStatus, buyLead, stopImpersonation } from "./actions";

const REQUEST_STATUSES = ["pending", "contacted", "completed", "declined"];

const ERROR_MESSAGES = {
  invalid_lead: "That lead couldn't be found.",
  lead_not_found: "That lead couldn't be found.",
  out_of_range: "That lead is outside your service radius.",
  already_purchased: "You've already purchased that lead.",
  purchase_failed: "Something went wrong buying that lead. Please try again.",
  impersonation_read_only:
    "Writes are only enabled while previewing in staging. This action didn't go through.",
};

export default async function LandscaperDashboard({ searchParams }) {
  const { error, bought } = await searchParams;
  const errorMessage = ERROR_MESSAGES[error];

  const supabase = await createClient();
  const { userId, isImpersonating } = await resolveActingUser(supabase, "landscaper");

  if (!userId) {
    redirect("/landscaper/login");
  }

  const { data: profile } = await supabase
    .from("landscapers")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (!profile) {
    redirect(isImpersonating ? "/admin?error=no_profile" : "/landscaper/complete-profile");
  }

  const { data: requests, error: requestsError } = await supabase
    .from("service_requests")
    .select("*, client_profiles(name, phone, address, lat, lng)")
    .eq("landscaper_id", userId)
    .order("created_at", { ascending: false });

  const { data: leadMatches, error: leadMatchesError } = await supabase
    .from("lead_landscaper_matches")
    .select("*")
    .eq("landscaper_id", userId)
    .eq("within_radius", true);

  const { data: clientProfiles, error: clientProfilesError } = await supabase
    .from("client_profiles")
    .select("*");

  const { data: purchases } = await supabase
    .from("lead_purchases")
    .select("lead_id, client_id")
    .eq("landscaper_id", userId);

  const purchasedLeadIds = new Set(
    (purchases ?? []).filter((p) => p.lead_id).map((p) => p.lead_id)
  );
  const purchasedClientIds = new Set(
    (purchases ?? []).filter((p) => p.client_id).map((p) => p.client_id)
  );

  const nearbyLeads = (leadMatches ?? []).map((match) => ({
    key: `lead-${match.lead_id}`,
    sourceType: "lead",
    sourceId: match.lead_id,
    name: match.lead_name,
    phone: match.lead_phone,
    address: match.lead_address,
    service: match.lead_service,
    distance: match.distance_miles,
    price: computeLeadPrice(match.distance_miles),
    purchased: purchasedLeadIds.has(match.lead_id),
  }));

  const nearbyClients = (clientProfiles ?? [])
    .map((client) => ({
      ...client,
      distance: haversineMiles(profile.lat, profile.lng, client.lat, client.lng),
    }))
    .filter(
      (client) =>
        client.distance != null && client.distance <= profile.service_radius_miles
    )
    .map((client) => ({
      key: `client-${client.id}`,
      sourceType: "client_profile",
      sourceId: client.id,
      name: client.name,
      phone: client.phone,
      address: client.address,
      service: null,
      distance: client.distance,
      price: computeLeadPrice(client.distance),
      purchased: purchasedClientIds.has(client.id),
    }));

  const nearbyClientsAndLeads = [...nearbyLeads, ...nearbyClients].sort(
    (a, b) => {
      if (a.distance == null) return 1;
      if (b.distance == null) return -1;
      return a.distance - b.distance;
    }
  );

  return (
    <main className="flex flex-1 flex-col bg-zinc-50 px-6 py-10">
      {isImpersonating && (
        <div className="mx-auto mb-4 flex w-full max-w-4xl flex-wrap items-center justify-between gap-2 rounded-md bg-zinc-900 px-4 py-3 text-sm text-white">
          <span>
            Admin preview — viewing as{" "}
            <strong>{profile.business_name}</strong>.{" "}
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
            {profile.business_name}
          </h1>
          <p className="text-sm text-black">
            {profile.address} &middot; {profile.service_radius_miles} mi radius
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/landscaper/complete-profile"
            className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium text-black hover:bg-zinc-100"
          >
            Edit Profile
          </Link>
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
      </div>

      <div className="mx-auto mt-8 w-full max-w-4xl">
        <h2 className="text-lg font-bold text-black">Client Requests</h2>

        {requestsError && (
          <p className="mt-2 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
            Couldn&apos;t load requests: {requestsError.message}
          </p>
        )}

        {(!requests || requests.length === 0) && !requestsError && (
          <p className="mt-2 text-sm text-black">
            No client requests yet. They&apos;ll show up here as soon as a
            client requests your services.
          </p>
        )}

        <div className="mt-4 flex flex-col gap-4">
          {(requests ?? []).map((req) => {
            const requestPurchased = purchasedClientIds.has(req.client_id);
            const requestDistance = haversineMiles(
              profile.lat,
              profile.lng,
              req.client_profiles?.lat,
              req.client_profiles?.lng
            );
            const requestPrice = computeLeadPrice(requestDistance);

            return (
              <div
                key={req.id}
                className="rounded-lg border border-zinc-200 bg-white p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-black">
                      {requestPurchased
                        ? req.client_profiles?.name
                        : abbreviateName(req.client_profiles?.name)}{" "}
                      <span className="font-normal text-black">
                        &middot; {req.service}
                      </span>
                    </p>

                    {requestPurchased ? (
                      <p className="text-sm text-black">
                        {req.client_profiles?.phone} &middot;{" "}
                        {req.client_profiles?.address}
                      </p>
                    ) : (
                      <div className="mt-1 flex flex-wrap items-center gap-2 rounded-md bg-green-50 px-3 py-2">
                        <p className="text-sm font-medium text-green-800">
                          A client has shown interest in your services, buy
                          now!
                        </p>
                        <form action={buyLead}>
                          <input
                            type="hidden"
                            name="source_type"
                            value="client_profile"
                          />
                          <input
                            type="hidden"
                            name="source_id"
                            value={req.client_id}
                          />
                          <button
                            type="submit"
                            className="rounded-md bg-green-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-800"
                          >
                            Buy Lead — ${requestPrice.toFixed(2)}
                          </button>
                        </form>
                      </div>
                    )}

                    {req.message && (
                      <p className="mt-1 text-sm text-black">
                        &ldquo;{req.message}&rdquo;
                      </p>
                    )}
                    <p className="text-xs text-black">
                      Requested {new Date(req.created_at).toLocaleString()}
                    </p>
                  </div>

                  <form
                    action={updateRequestStatus}
                    className="flex items-center gap-2"
                  >
                    <input type="hidden" name="request_id" value={req.id} />
                    <select
                      name="status"
                      defaultValue={req.status}
                      className="rounded-md border border-zinc-300 px-2 py-1 text-sm text-black"
                    >
                      {REQUEST_STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                    <button
                      type="submit"
                      className="rounded-md bg-zinc-900 px-3 py-1 text-sm font-medium text-white hover:bg-zinc-700"
                    >
                      Update
                    </button>
                  </form>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mx-auto mt-8 w-full max-w-4xl">
        <h2 className="text-lg font-bold text-black">Clients Near You</h2>
        <p className="text-sm text-black">
          Within your {profile.service_radius_miles} mi radius of{" "}
          {profile.address}. Price scales with distance, from $4.99 to $9.99.
        </p>

        {bought === "1" && (
          <p className="mt-2 rounded-md bg-green-50 px-4 py-3 text-sm text-green-800">
            Lead purchased — contact info is now visible below.
          </p>
        )}
        {errorMessage && (
          <p className="mt-2 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMessage}
          </p>
        )}

        {(leadMatchesError || clientProfilesError) && (
          <p className="mt-2 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
            Couldn&apos;t load nearby clients:{" "}
            {leadMatchesError?.message ?? clientProfilesError?.message}
          </p>
        )}

        {nearbyClientsAndLeads.length === 0 &&
          !leadMatchesError &&
          !clientProfilesError && (
            <p className="mt-2 text-sm text-black">
              No clients near you yet.
            </p>
          )}

        <div className="mt-4 overflow-x-auto rounded-lg border border-zinc-200 bg-white">
          {nearbyClientsAndLeads.length > 0 && (
            <table className="w-full min-w-[650px] text-sm text-black">
              <thead>
                <tr className="border-b border-zinc-200 text-left text-black">
                  <th className="px-4 py-2">Name</th>
                  <th className="px-4 py-2">Service</th>
                  <th className="px-4 py-2">Address</th>
                  <th className="px-4 py-2">Distance</th>
                  <th className="px-4 py-2">Price</th>
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {nearbyClientsAndLeads.map((item) => (
                  <tr
                    key={item.key}
                    className="border-b border-zinc-100 last:border-0"
                  >
                    <td className="px-4 py-2">
                      {item.purchased
                        ? item.name
                        : abbreviateName(item.name)}
                    </td>
                    <td className="px-4 py-2">{item.service ?? "—"}</td>
                    <td className="px-4 py-2">
                      {item.purchased
                        ? item.address
                        : cityOnly(item.address)}
                    </td>
                    <td className="px-4 py-2">
                      {item.distance != null
                        ? `${item.distance} mi`
                        : "unknown"}
                    </td>
                    <td className="px-4 py-2 font-medium text-green-700">
                      {item.purchased ? "Claimed" : `$${item.price.toFixed(2)}`}
                    </td>
                    <td className="px-4 py-2">
                      {item.purchased ? (
                        <span className="text-xs font-medium text-black">
                          {item.phone}
                        </span>
                      ) : (
                        <form action={buyLead}>
                          <input
                            type="hidden"
                            name="source_type"
                            value={item.sourceType}
                          />
                          <input
                            type="hidden"
                            name="source_id"
                            value={item.sourceId}
                          />
                          <button
                            type="submit"
                            className="rounded-md bg-green-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-800"
                          >
                            Buy Lead
                          </button>
                        </form>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </main>
  );
}
