import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logout, updateLeadStatus } from "./actions";

const STATUSES = ["new", "contacted", "matched", "closed"];

function groupByLead(rows) {
  const leads = new Map();

  for (const row of rows) {
    if (!leads.has(row.lead_id)) {
      leads.set(row.lead_id, {
        id: row.lead_id,
        name: row.lead_name,
        phone: row.lead_phone,
        zip: row.lead_zip,
        service: row.lead_service,
        status: row.lead_status,
        createdAt: row.lead_created_at,
        matches: [],
      });
    }

    if (row.landscaper_id) {
      leads.get(row.lead_id).matches.push({
        id: row.landscaper_id,
        businessName: row.business_name,
        contactName: row.contact_name,
        phone: row.landscaper_phone,
        zip: row.landscaper_zip,
        services: row.landscaper_services,
        radius: row.service_radius_miles,
        distance: row.distance_miles,
        withinRadius: row.within_radius,
      });
    }
  }

  return Array.from(leads.values());
}

export default async function AdminDashboard() {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();

  if (!claims?.claims) {
    redirect("/admin/login");
  }

  const { data: rows, error } = await supabase
    .from("lead_landscaper_matches")
    .select("*");

  const leads = groupByLead(rows ?? []);

  return (
    <main className="flex flex-1 flex-col bg-zinc-50 px-6 py-10">
      <div className="mx-auto flex w-full max-w-4xl items-center justify-between">
        <h1 className="text-2xl font-bold text-black">Lead Matching</h1>
        <form action={logout}>
          <button
            type="submit"
            className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium text-black hover:bg-zinc-100"
          >
            Log Out
          </button>
        </form>
      </div>

      <div className="mx-auto mt-8 w-full max-w-4xl">
        {error && (
          <p className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
            Couldn&apos;t load leads: {error.message}
          </p>
        )}

        {leads.length === 0 && !error && (
          <p className="text-sm text-black">No leads yet.</p>
        )}

        <div className="flex flex-col gap-6">
          {leads.map((lead) => (
            <div
              key={lead.id}
              className="rounded-lg border border-zinc-200 bg-white p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="font-semibold text-black">
                    {lead.name}{" "}
                    <span className="font-normal text-black">
                      &middot; {lead.service}
                    </span>
                  </p>
                  <p className="text-sm text-black">
                    {lead.phone} &middot; {lead.zip}
                  </p>
                  <p className="text-xs text-black">
                    Submitted {new Date(lead.createdAt).toLocaleString()}
                  </p>
                </div>

                <form
                  action={updateLeadStatus}
                  className="flex items-center gap-2"
                >
                  <input type="hidden" name="lead_id" value={lead.id} />
                  <select
                    name="status"
                    defaultValue={lead.status}
                    className="rounded-md border border-zinc-300 px-2 py-1 text-sm text-black"
                  >
                    {STATUSES.map((status) => (
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

              <p className="mt-4 text-xs font-medium uppercase tracking-wide text-black">
                Nearby Landscapers
              </p>
              {lead.matches.length === 0 ? (
                <p className="mt-1 text-sm text-black">
                  No landscapers signed up yet.
                </p>
              ) : (
                <div className="mt-2 overflow-x-auto">
                  <table className="w-full min-w-[500px] text-sm text-black">
                    <thead>
                      <tr className="border-b border-zinc-200 text-left text-black">
                        <th className="py-1 pr-3">Business</th>
                        <th className="py-1 pr-3">Phone</th>
                        <th className="py-1 pr-3">Services</th>
                        <th className="py-1 pr-3">Distance</th>
                        <th className="py-1 pr-3">In Radius?</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lead.matches.map((match) => (
                        <tr
                          key={match.id}
                          className="border-b border-zinc-100 last:border-0"
                        >
                          <td className="py-1.5 pr-3">
                            {match.businessName}
                            <div className="text-xs text-black">
                              {match.contactName}
                            </div>
                          </td>
                          <td className="py-1.5 pr-3">{match.phone}</td>
                          <td className="py-1.5 pr-3">{match.services}</td>
                          <td className="py-1.5 pr-3">
                            {match.distance != null
                              ? `${match.distance} mi`
                              : "unknown"}
                          </td>
                          <td className="py-1.5 pr-3">
                            {match.withinRadius === null ? (
                              "?"
                            ) : match.withinRadius ? (
                              <span className="font-medium text-green-700">
                                Yes
                              </span>
                            ) : (
                              <span className="text-black">No</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
