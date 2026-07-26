import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  logout,
  updateLeadStatus,
  updateRequestStatus,
  startImpersonation,
} from "./actions";

const LEAD_STATUSES = ["new", "contacted", "matched", "closed"];
const REQUEST_STATUSES = ["pending", "contacted", "completed", "declined"];
const PAGE_SIZE = 10;
const TABS = ["clients", "landscapers", "accounts", "requests", "purchases"];

function LogInAsButton({ targetId, role }) {
  return (
    <form action={startImpersonation}>
      <input type="hidden" name="target_id" value={targetId} />
      <input type="hidden" name="role" value={role} />
      <button
        type="submit"
        className="rounded-md border border-zinc-300 px-2 py-1 text-xs font-medium text-black hover:bg-zinc-100"
      >
        Log in as
      </button>
    </form>
  );
}

function sanitizeSearchTerm(term) {
  return term.replace(/[,()]/g, "").trim();
}

function groupMatchesByLeadId(rows) {
  const matches = new Map();

  for (const row of rows) {
    if (!row.landscaper_id) continue;
    if (!matches.has(row.lead_id)) matches.set(row.lead_id, []);
    matches.get(row.lead_id).push({
      id: row.landscaper_id,
      businessName: row.business_name,
      contactName: row.contact_name,
      phone: row.landscaper_phone,
      email: row.landscaper_email,
      services: row.landscaper_services,
      distance: row.distance_miles,
      withinRadius: row.within_radius,
    });
  }

  return matches;
}

function buildHref(tab, q, page) {
  const params = new URLSearchParams();
  params.set("tab", tab);
  if (q) params.set("q", q);
  if (page > 1) params.set("page", String(page));
  return `/admin?${params.toString()}`;
}

function Pagination({ tab, q, page, totalPages }) {
  if (totalPages <= 1) return null;

  return (
    <div className="mt-4 flex items-center justify-center gap-3 text-sm">
      {page > 1 ? (
        <Link
          href={buildHref(tab, q, page - 1)}
          className="rounded-md border border-zinc-300 px-3 py-1 text-black hover:bg-zinc-100"
        >
          Previous
        </Link>
      ) : (
        <span className="rounded-md border border-zinc-200 px-3 py-1 text-black opacity-40">
          Previous
        </span>
      )}
      <span className="text-black">
        Page {page} of {totalPages}
      </span>
      {page < totalPages ? (
        <Link
          href={buildHref(tab, q, page + 1)}
          className="rounded-md border border-zinc-300 px-3 py-1 text-black hover:bg-zinc-100"
        >
          Next
        </Link>
      ) : (
        <span className="rounded-md border border-zinc-200 px-3 py-1 text-black opacity-40">
          Next
        </span>
      )}
    </div>
  );
}

function SearchForm({ tab, q, placeholder }) {
  return (
    <form method="get" className="flex items-center gap-2">
      <input type="hidden" name="tab" value={tab} />
      <input
        type="text"
        name="q"
        defaultValue={q}
        placeholder={placeholder}
        className="w-full rounded-md border border-zinc-300 px-3 py-2 text-black placeholder:text-zinc-700 focus:border-green-600 focus:outline-none"
      />
      <button
        type="submit"
        className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700"
      >
        Search
      </button>
      {q && (
        <Link
          href={`/admin?tab=${tab}`}
          className="text-sm text-black hover:text-green-700"
        >
          Clear
        </Link>
      )}
    </form>
  );
}

export default async function AdminDashboard({ searchParams }) {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();

  if (!claims?.claims) {
    redirect("/admin/login");
  }

  const params = await searchParams;
  const impersonationError =
    params.error === "no_profile"
      ? "That user doesn't have a profile to preview."
      : null;
  const tab = TABS.includes(params.tab) ? params.tab : "clients";
  const qRaw = Array.isArray(params.q) ? params.q[0] : params.q;
  const q = (qRaw ?? "").toString();
  const term = sanitizeSearchTerm(q);
  const pageRaw = Array.isArray(params.page) ? params.page[0] : params.page;
  const requestedPage = Math.max(1, parseInt(pageRaw, 10) || 1);

  const from = (requestedPage - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let leads = [];
  let leadMatches = new Map();
  let landscapers = [];
  let clientAccounts = [];
  let requests = [];
  let purchases = [];
  let totalCount = 0;
  let loadError = null;

  if (tab === "clients") {
    let query = supabase
      .from("leads")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to);

    if (term) {
      query = query.or(
        `name.ilike.%${term}%,phone.ilike.%${term}%,email.ilike.%${term}%,address.ilike.%${term}%,service.ilike.%${term}%`
      );
    }

    const { data, count, error } = await query;
    leads = data ?? [];
    totalCount = count ?? 0;
    loadError = error;

    if (leads.length > 0) {
      const leadIds = leads.map((lead) => lead.id);
      const { data: matchRows } = await supabase
        .from("lead_landscaper_matches")
        .select("*")
        .in("lead_id", leadIds);
      leadMatches = groupMatchesByLeadId(matchRows ?? []);
    }
  } else if (tab === "landscapers") {
    let query = supabase
      .from("landscapers")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to);

    if (term) {
      query = query.or(
        `business_name.ilike.%${term}%,contact_name.ilike.%${term}%,email.ilike.%${term}%,address.ilike.%${term}%,services.ilike.%${term}%`
      );
    }

    const { data, count, error } = await query;
    landscapers = data ?? [];
    totalCount = count ?? 0;
    loadError = error;
  } else if (tab === "accounts") {
    let query = supabase
      .from("client_profiles")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to);

    if (term) {
      query = query.or(
        `name.ilike.%${term}%,phone.ilike.%${term}%,email.ilike.%${term}%,address.ilike.%${term}%`
      );
    }

    const { data, count, error } = await query;
    clientAccounts = data ?? [];
    totalCount = count ?? 0;
    loadError = error;
  } else if (tab === "requests") {
    let query = supabase
      .from("service_requests")
      .select(
        "*, client_profiles(name, phone, email, address), landscapers(business_name, phone, email, contact_hours)",
        { count: "exact" }
      )
      .order("created_at", { ascending: false })
      .range(from, to);

    if (term) {
      query = query.ilike("service", `%${term}%`);
    }

    const { data, count, error } = await query;
    requests = data ?? [];
    totalCount = count ?? 0;
    loadError = error;
  } else {
    const { data, count, error } = await supabase
      .from("lead_purchases")
      .select(
        "*, landscapers(business_name, phone, email), leads(name, phone, email, address, service), client_profiles(name, phone, email, address)",
        { count: "exact" }
      )
      .order("created_at", { ascending: false })
      .range(from, to);

    purchases = data ?? [];
    totalCount = count ?? 0;
    loadError = error;
  }

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const page = Math.min(requestedPage, totalPages);

  const searchPlaceholder = {
    clients: "Search clients by name, phone, email, address, or service",
    landscapers: "Search landscapers by business, contact, email, address, or services",
    accounts: "Search client accounts by name, phone, email, or address",
    requests: "Search requests by service",
    purchases: null,
  }[tab];

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

      {impersonationError && (
        <div className="mx-auto mt-4 w-full max-w-4xl rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
          {impersonationError}
        </div>
      )}

      <div className="mx-auto mt-6 flex w-full max-w-4xl gap-2 border-b border-zinc-200">
        {TABS.map((t) => (
          <Link
            key={t}
            href={`/admin?tab=${t}`}
            className={`px-4 py-2 text-sm font-medium capitalize ${
              tab === t
                ? "border-b-2 border-green-700 text-black"
                : "text-black hover:text-green-700"
            }`}
          >
            {t}
          </Link>
        ))}
      </div>

      <div className="mx-auto mt-6 w-full max-w-4xl">
        {tab !== "purchases" && (
          <SearchForm tab={tab} q={q} placeholder={searchPlaceholder} />
        )}

        <p className="mt-2 text-xs text-black">
          {totalCount} result{totalCount === 1 ? "" : "s"}
          {term ? ` for "${term}"` : ""}
        </p>

        {loadError && (
          <p className="mt-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
            Couldn&apos;t load data: {loadError.message}
          </p>
        )}

        {tab === "clients" && (
          <div className="mt-4 flex flex-col gap-6">
            {leads.length === 0 && !loadError && (
              <p className="text-sm text-black">No clients found.</p>
            )}

            {leads.map((lead) => {
              const matches = leadMatches.get(lead.id) ?? [];
              return (
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
                        {lead.phone} &middot; {lead.email} &middot;{" "}
                        {lead.address}
                      </p>
                      <p className="text-sm text-black">
                        {lead.budget_range} &middot; {lead.timeline}
                      </p>
                      <p className="text-xs text-black">
                        Submitted{" "}
                        {new Date(lead.created_at).toLocaleString()}
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
                        {LEAD_STATUSES.map((status) => (
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
                  {matches.length === 0 ? (
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
                            <th className="py-1 pr-3">Email</th>
                            <th className="py-1 pr-3">Services</th>
                            <th className="py-1 pr-3">Distance</th>
                            <th className="py-1 pr-3">In Radius?</th>
                          </tr>
                        </thead>
                        <tbody>
                          {matches.map((match) => (
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
                              <td className="py-1.5 pr-3">{match.email}</td>
                              <td className="py-1.5 pr-3">
                                {match.services}
                              </td>
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
              );
            })}
          </div>
        )}

        {tab === "landscapers" && (
          <div className="mt-4 overflow-x-auto rounded-lg border border-zinc-200 bg-white">
            {landscapers.length === 0 && !loadError ? (
              <p className="p-5 text-sm text-black">No landscapers found.</p>
            ) : (
              <table className="w-full min-w-[700px] text-sm text-black">
                <thead>
                  <tr className="border-b border-zinc-200 text-left text-black">
                    <th className="px-4 py-2">Business</th>
                    <th className="px-4 py-2">Phone</th>
                    <th className="px-4 py-2">Email</th>
                    <th className="px-4 py-2">Address</th>
                    <th className="px-4 py-2">Radius</th>
                    <th className="px-4 py-2">Contact Hours</th>
                    <th className="px-4 py-2">Services</th>
                    <th className="px-4 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {landscapers.map((landscaper) => (
                    <tr
                      key={landscaper.id}
                      className="border-b border-zinc-100 last:border-0"
                    >
                      <td className="px-4 py-2">
                        {landscaper.business_name}
                        <div className="text-xs text-black">
                          {landscaper.contact_name}
                        </div>
                      </td>
                      <td className="px-4 py-2">{landscaper.phone}</td>
                      <td className="px-4 py-2">
                        {landscaper.email ?? "—"}
                      </td>
                      <td className="px-4 py-2">{landscaper.address}</td>
                      <td className="px-4 py-2">
                        {landscaper.service_radius_miles} mi
                      </td>
                      <td className="px-4 py-2">
                        {landscaper.contact_hours ?? "—"}
                      </td>
                      <td className="px-4 py-2">{landscaper.services}</td>
                      <td className="px-4 py-2">
                        <LogInAsButton
                          targetId={landscaper.id}
                          role="landscaper"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {tab === "accounts" && (
          <div className="mt-4 overflow-x-auto rounded-lg border border-zinc-200 bg-white">
            {clientAccounts.length === 0 && !loadError ? (
              <p className="p-5 text-sm text-black">
                No client accounts found.
              </p>
            ) : (
              <table className="w-full min-w-[500px] text-sm text-black">
                <thead>
                  <tr className="border-b border-zinc-200 text-left text-black">
                    <th className="px-4 py-2">Name</th>
                    <th className="px-4 py-2">Phone</th>
                    <th className="px-4 py-2">Email</th>
                    <th className="px-4 py-2">Address</th>
                    <th className="px-4 py-2">Signed Up</th>
                    <th className="px-4 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {clientAccounts.map((client) => (
                    <tr
                      key={client.id}
                      className="border-b border-zinc-100 last:border-0"
                    >
                      <td className="px-4 py-2">{client.name}</td>
                      <td className="px-4 py-2">{client.phone}</td>
                      <td className="px-4 py-2">{client.email}</td>
                      <td className="px-4 py-2">{client.address}</td>
                      <td className="px-4 py-2">
                        {new Date(client.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-2">
                        <LogInAsButton targetId={client.id} role="client" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {tab === "requests" && (
          <div className="mt-4 overflow-x-auto rounded-lg border border-zinc-200 bg-white">
            {requests.length === 0 && !loadError ? (
              <p className="p-5 text-sm text-black">No requests found.</p>
            ) : (
              <table className="w-full min-w-[650px] text-sm text-black">
                <thead>
                  <tr className="border-b border-zinc-200 text-left text-black">
                    <th className="px-4 py-2">Client</th>
                    <th className="px-4 py-2">Landscaper</th>
                    <th className="px-4 py-2">Service</th>
                    <th className="px-4 py-2">Message</th>
                    <th className="px-4 py-2">Status</th>
                    <th className="px-4 py-2">Requested</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((req) => (
                    <tr
                      key={req.id}
                      className="border-b border-zinc-100 last:border-0"
                    >
                      <td className="px-4 py-2">
                        {req.client_profiles?.name}
                        <div className="text-xs text-black">
                          {req.client_profiles?.phone} &middot;{" "}
                          {req.client_profiles?.email} &middot;{" "}
                          {req.client_profiles?.address}
                        </div>
                      </td>
                      <td className="px-4 py-2">
                        {req.landscapers?.business_name}
                        <div className="text-xs text-black">
                          {req.landscapers?.phone} &middot;{" "}
                          {req.landscapers?.email}
                          {req.landscapers?.contact_hours
                            ? ` · ${req.landscapers.contact_hours}`
                            : ""}
                        </div>
                      </td>
                      <td className="px-4 py-2">{req.service}</td>
                      <td className="px-4 py-2">{req.message ?? "—"}</td>
                      <td className="px-4 py-2">
                        <form
                          action={updateRequestStatus}
                          className="flex items-center gap-2"
                        >
                          <input
                            type="hidden"
                            name="request_id"
                            value={req.id}
                          />
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
                            className="rounded-md bg-zinc-900 px-2 py-1 text-xs font-medium text-white hover:bg-zinc-700"
                          >
                            Update
                          </button>
                        </form>
                      </td>
                      <td className="px-4 py-2">
                        {new Date(req.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {tab === "purchases" && (
          <div className="mt-4 overflow-x-auto rounded-lg border border-zinc-200 bg-white">
            {purchases.length === 0 && !loadError ? (
              <p className="p-5 text-sm text-black">No purchases yet.</p>
            ) : (
              <table className="w-full min-w-[650px] text-sm text-black">
                <thead>
                  <tr className="border-b border-zinc-200 text-left text-black">
                    <th className="px-4 py-2">Landscaper</th>
                    <th className="px-4 py-2">Source</th>
                    <th className="px-4 py-2">Client / Lead</th>
                    <th className="px-4 py-2">Service</th>
                    <th className="px-4 py-2">Price</th>
                    <th className="px-4 py-2">Purchased</th>
                  </tr>
                </thead>
                <tbody>
                  {purchases.map((purchase) => {
                    const source = purchase.leads ?? purchase.client_profiles;
                    return (
                      <tr
                        key={purchase.id}
                        className="border-b border-zinc-100 last:border-0"
                      >
                        <td className="px-4 py-2">
                          {purchase.landscapers?.business_name}
                          <div className="text-xs text-black">
                            {purchase.landscapers?.phone} &middot;{" "}
                            {purchase.landscapers?.email}
                          </div>
                        </td>
                        <td className="px-4 py-2 capitalize">
                          {purchase.lead_id ? "Lead" : "Client Account"}
                        </td>
                        <td className="px-4 py-2">
                          {source?.name}
                          <div className="text-xs text-black">
                            {source?.phone} &middot; {source?.email} &middot;{" "}
                            {source?.address}
                          </div>
                        </td>
                        <td className="px-4 py-2">
                          {purchase.leads?.service ?? "—"}
                        </td>
                        <td className="px-4 py-2 font-medium text-green-700">
                          ${Number(purchase.price).toFixed(2)}
                        </td>
                        <td className="px-4 py-2">
                          {new Date(purchase.created_at).toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}

        <Pagination tab={tab} q={q} page={page} totalPages={totalPages} />
      </div>
    </main>
  );
}
